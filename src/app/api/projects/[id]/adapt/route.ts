import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adaptScriptForProduct } from "@/lib/ai/adaptation";
import type { VideoAnalysis } from "@/lib/ai/analysis";

const localeNames: Record<string, string> = { ar: "Arabic", en: "English", fr: "French" };

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: { scenes: { orderBy: { index: "asc" } } },
    });
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (!project.refAnalysis) return NextResponse.json({ error: "no_analysis" }, { status: 400 });
    if (!project.productName) return NextResponse.json({ error: "no_product" }, { status: 400 });

    await db.project.update({ where: { id }, data: { status: "adapting" } });

    const analysis: VideoAnalysis = JSON.parse(project.refAnalysis);
    const localeName = localeNames[project.locale] ?? "English";

    const adaptation = await adaptScriptForProduct(
      analysis,
      { name: project.productName, url: project.productUrl, desc: project.productDesc },
      localeName
    );

    // map adaptation onto existing scenes
    for (const scene of project.scenes) {
      const adapted = adaptation.scenes.find((a) => a.index === scene.index) ?? adaptation.scenes[scene.index] ?? adaptation.scenes[0];
      if (!adapted) continue;
      await db.scene.update({
        where: { id: scene.id },
        data: {
          newPrompt: adapted.newPrompt,
          newVoiceover: adapted.newVoiceover,
          onScreenNew: adapted.onScreenNew,
          isProductScene: adapted.isProductScene || scene.isProductScene,
          status: "pending",
          videoUrl: null,
          taskId: null,
          error: null,
        },
      });
    }

    const updated = await db.project.update({
      where: { id },
      data: { status: "adapted" },
      include: { scenes: { orderBy: { index: "asc" } } },
    });

    return NextResponse.json({ project: updated, adaptation });
  } catch (e: unknown) {
    console.error("adapt error", e);
    return NextResponse.json({ error: "adapt_failed" }, { status: 500 });
  }
}
