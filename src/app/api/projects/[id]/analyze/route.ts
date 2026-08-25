import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeVideoFrames } from "@/lib/ai/analysis";
import { buildIntakeForm, gateMessage } from "@/lib/ai/evidence";

const localeNames: Record<string, string> = { ar: "Arabic", en: "English", fr: "French" };

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const frames: string[] = Array.isArray(body.frames) ? body.frames.slice(0, 8) : [];
    const duration = Math.min(300, Math.max(3, Number(body.duration) || 15));
    const transcript = body.transcript ? String(body.transcript).slice(0, 4000) : null;
    const videoName = body.videoName ? String(body.videoName).slice(0, 200) : null;

    if (!frames.length) {
      return NextResponse.json({ error: "no_frames" }, { status: 400 });
    }

    const project = await db.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

    await db.project.update({
      where: { id },
      data: { status: "analyzing", refVideoName: videoName, refDuration: duration, refTranscript: transcript },
    });

    const localeName = localeNames[project.locale] ?? "English";
    const analysis = await analyzeVideoFrames(frames, duration, transcript, localeName);

    // reset scenes for this project
    await db.scene.deleteMany({ where: { projectId: id } });

    for (let i = 0; i < analysis.scenes.length; i++) {
      const s = analysis.scenes[i];
      await db.scene.create({
        data: {
          projectId: id,
          index: i,
          role: s.role || "demo",
          description: s.description,
          camera: s.camera,
          onScreenText: s.onScreenText,
          duration: s.duration,
          isProductScene: s.isProductScene,
          // Notch x-ray fields
          startSec: s.startSec,
          endSec: s.endSec,
          shotStartsSec: JSON.stringify(s.shotStartsSec),
          evidenceNeeded: JSON.stringify(s.productEvidenceNeeded ?? []),
        },
      });
    }

    // ── PRODUCT-EVIDENCE GATE ──────────────────────────────────────────
    // Notch holds generation when the reference demo requires product facts
    // that are missing. Build the dynamic intake form from the x-ray.
    const intakeForm = buildIntakeForm(analysis, {
      name: project.productName,
      productSize: project.productSize,
      productFacts: project.productFacts,
      productImage: project.productImage,
    });

    const updated = await db.project.update({
      where: { id },
      data: {
        refAnalysis: JSON.stringify(analysis),
        status: intakeForm ? "evidence_gate" : "analyzed",
        evidenceGate: intakeForm ? JSON.stringify(intakeForm) : null,
      },
      include: { scenes: { orderBy: { index: "asc" } } },
    });

    return NextResponse.json({
      project: updated,
      analysis,
      intakeForm,
      gateMessage: intakeForm ? gateMessage(intakeForm, project.locale) : null,
    });
  } catch (e: unknown) {
    console.error("analyze error", e);
    return NextResponse.json({ error: "analyze_failed" }, { status: 500 });
  }
}
