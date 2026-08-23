import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { queryTask } from "@/lib/ai/generation";

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
    let anyDone = false;

    for (const scene of project.scenes) {
      if (scene.status === "generating" && scene.taskId) {
        try {
          const result = await queryTask(scene.taskId);
          if (result.status === "done" && result.videoUrl) {
            await db.scene.update({
              where: { id: scene.id },
              data: { status: "done", videoUrl: result.videoUrl },
            });
            changes.push({ sceneId: scene.id, status: "done", videoUrl: result.videoUrl });
            anyDone = true;
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
      } else if (scene.status === "done") {
        anyDone = true;
      } else if (scene.status === "error") {
        // nothing
      }
    }

    // update project status
    const hasScenes = project.scenes.length > 0;
    const allSettled = hasScenes && project.scenes.every((s) => s.status === "done" || s.status === "error");
    const anyPending = hasScenes && project.scenes.some((s) => s.status === "pending" || s.status === "generating");

    if (allSettled) {
      await db.project.update({ where: { id }, data: { status: "done" } });
    } else if (anyPending && !anyGenerating && project.status === "generating") {
      // some scenes pending but none generating anymore (e.g. after failures) — keep status
    }

    const updated = await db.project.findUnique({
      where: { id },
      include: { scenes: { orderBy: { index: "asc" } } },
    });

    return NextResponse.json({ project: updated, changes });
  } catch {
    return NextResponse.json({ error: "poll_failed" }, { status: 500 });
  }
}
