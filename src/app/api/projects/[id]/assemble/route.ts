import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assembleTimeline, generateEndCard, generateAutoTitle } from "@/lib/ai/assembly";

const localeNames: Record<string, string> = { ar: "Arabic", en: "English", fr: "French" };

/**
 * POST /api/projects/[id]/assemble — the final packaging stage.
 * Runs when all scenes are done: A-roll trim bookkeeping, audio check,
 * timeline assembly, branded end-card generation, and the LLM auto-title
 * (Notch's "Assembled: 3 A-roll + 0 B-roll, 34s" → "Render complete").
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: { scenes: { orderBy: { index: "asc" } } },
    });
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const scenes = project.scenes;
    if (!scenes.length) return NextResponse.json({ error: "no_scenes" }, { status: 400 });
    const anyUndone = scenes.some((s) => s.status !== "done");
    if (anyUndone) return NextResponse.json({ error: "scenes_not_done" }, { status: 400 });

    // 1. Assembly bookkeeping (trim counts, A-roll/B-roll, total duration)
    const assembly = assembleTimeline(
      scenes.map((s) => ({
        role: s.role,
        duration: s.duration,
        videoUrl: s.videoUrl,
        speechQa: s.speechQa,
        newVoiceover: s.newVoiceover,
      })),
      project.productName
    );

    // 2. End card image (best effort — null on failure)
    if (assembly.endCardPrompt) {
      const endCardUrl = await generateEndCard(assembly.endCardPrompt);
      assembly.endCardUrl = endCardUrl;
    }

    // 3. Auto-title (best effort)
    const localeName = localeNames[project.locale] ?? "English";
    const autoTitle = await generateAutoTitle(
      project.productName,
      scenes.map((s) => ({ role: s.role, duration: s.duration, videoUrl: s.videoUrl, speechQa: s.speechQa, newVoiceover: s.newVoiceover })),
      localeName
    );

    const nameUpdate = autoTitle && project.name.length < 3 ? { name: autoTitle } : {};

    const updated = await db.project.update({
      where: { id },
      data: {
        assembly: JSON.stringify(assembly),
        endCardUrl: assembly.endCardUrl,
        autoTitle,
        status: "packaged",
        ...nameUpdate,
      },
      include: { scenes: { orderBy: { index: "asc" } } },
    });

    return NextResponse.json({ project: updated, assembly });
  } catch (e: unknown) {
    console.error("assemble error", e);
    return NextResponse.json({ error: "assemble_failed" }, { status: 500 });
  }
}
