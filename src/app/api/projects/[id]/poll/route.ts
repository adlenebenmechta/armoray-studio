import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSceneTask, queryTask, SceneTaskError } from "@/lib/ai/generation";
import { runSpeechQa } from "@/lib/ai/speechqa";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: { scenes: { orderBy: { index: "asc" } } },
    });
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const changes: { sceneId: string; status: string; videoUrl?: string }[] = [];
    let anyGenerating = false;

    for (const scene of project.scenes) {
      if (scene.status === "generating" && scene.taskId) {
        try {
          const result = await queryTask(scene.taskId);
          if (result.status === "done" && result.videoUrl) {
            // Speech QA — the Notch-style "listen back" check
            let speechQa: string | null = null;
            try {
              if (scene.newVoiceover) {
                const qa = await runSpeechQa(result.videoUrl, scene.newVoiceover);
                speechQa = JSON.stringify(qa);
              }
            } catch {
              speechQa = null;
            }
            await db.scene.update({
              where: { id: scene.id },
              data: { status: "done", videoUrl: result.videoUrl, speechQa },
            });
            changes.push({ sceneId: scene.id, status: "done", videoUrl: result.videoUrl });
          } else if (result.status === "error") {
            await db.scene.update({
              where: { id: scene.id },
              data: { status: "error", error: "generation_failed" },
            });
            changes.push({ sceneId: scene.id, status: "error" });
          } else {
            anyGenerating = true;
          }
        } catch {
          anyGenerating = true; // keep waiting, transient query error
        }
      }
    }

    // Sequential generation: the API allows ~1 concurrent task (429 otherwise).
    // When nothing is generating, automatically start the next pending scene.
    let startedNext = false;
    if (!anyGenerating && project.status === "generating") {
      const next = project.scenes.find((s) => s.newPrompt && s.status === "pending");
      if (next) {
        try {
          const task = await createSceneTask({
            prompt: next.newPrompt!,
            productImage: project.productImage,
            isProductScene: next.isProductScene,
          });
          await db.scene.update({
            where: { id: next.id },
            data: { taskId: task.taskId, status: "generating", error: null },
          });
          startedNext = true;
        } catch (err) {
          if (err instanceof SceneTaskError && err.transient) {
            // rate limited (429): leave the scene pending, next poll retries
          } else {
            await db.scene.update({
              where: { id: next.id },
              data: { status: "error", error: "task_create_failed" },
            });
          }
        }
      }
    }

    // update project status
    const hasScenes = project.scenes.length > 0;
    const allSettled = hasScenes && project.scenes.every((s) => s.status === "done" || s.status === "error");
    if (allSettled) {
      await db.project.update({ where: { id }, data: { status: "done" } });

      // ── AUTO-ASSEMBLY (Notch's packaging stage) ────────────────────
      // When every scene is done, run the final packaging: A-roll trim
      // bookkeeping, audio check, end card, auto-title. Best effort —
      // a failure here never blocks the done state.
      try {
        const fresh = await db.project.findUnique({
          where: { id },
          include: { scenes: { orderBy: { index: "asc" } } },
        });
        if (fresh && fresh.scenes.every((s) => s.status === "done")) {
          const { assembleTimeline, generateEndCard, generateAutoTitle } = await import("@/lib/ai/assembly");
          const assembly = assembleTimeline(
            fresh.scenes.map((s) => ({
              role: s.role,
              duration: s.duration,
              videoUrl: s.videoUrl,
              speechQa: s.speechQa,
              newVoiceover: s.newVoiceover,
            })),
            fresh.productName
          );
          if (assembly.endCardPrompt) {
            assembly.endCardUrl = await generateEndCard(assembly.endCardPrompt);
          }
          const localeNames: Record<string, string> = { ar: "Arabic", en: "English", fr: "French" };
          const autoTitle = await generateAutoTitle(
            fresh.productName,
            fresh.scenes.map((s) => ({
              role: s.role,
              duration: s.duration,
              videoUrl: s.videoUrl,
              speechQa: s.speechQa,
              newVoiceover: s.newVoiceover,
            })),
            localeNames[fresh.locale] ?? "English"
          );
          await db.project.update({
            where: { id },
            data: {
              assembly: JSON.stringify(assembly),
              endCardUrl: assembly.endCardUrl,
              autoTitle,
              status: "packaged",
            },
          });
        }
      } catch (asmErr) {
        console.error("auto-assembly skipped", asmErr);
      }
    }

    const updated = await db.project.findUnique({
      where: { id },
      include: { scenes: { orderBy: { index: "asc" } } },
    });

    return NextResponse.json({ project: updated, changes, startedNext });
  } catch {
    return NextResponse.json({ error: "poll_failed" }, { status: 500 });
  }
}
