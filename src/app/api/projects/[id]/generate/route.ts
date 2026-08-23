import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSceneTask, SceneTaskError } from "@/lib/ai/generation";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: { scenes: { orderBy: { index: "asc" } } },
    });
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const scenes = project.scenes.filter((s) => s.newPrompt && s.status !== "generating" && s.status !== "done");
    if (!scenes.length) return NextResponse.json({ error: "no_scenes" }, { status: 400 });

    await db.project.update({ where: { id }, data: { status: "generating" } });

    // Reset failed scenes to pending so the sequential queue can retry them
    for (const s of project.scenes.filter((sc) => sc.status === "error")) {
      await db.scene.update({ where: { id: s.id }, data: { status: "pending", error: null } });
    }

    // Refetch AFTER resets so we see fresh statuses (bug fix: stale scenes list)
    const freshScenes = await db.scene.findMany({ where: { projectId: id }, orderBy: { index: "asc" } });

    // The video API rate-limits concurrent tasks (429), so we start ONLY the
    // first scene here. The poll endpoint chains the remaining scenes
    // sequentially as each one finishes.
    const started: string[] = [];
    const failed: string[] = [];
    const first = freshScenes.find((s) => s.newPrompt && s.status !== "done" && s.status !== "generating");

    if (first) {
      try {
        const task = await createSceneTask({
          prompt: first.newPrompt!,
          productImage: project.productImage,
          isProductScene: first.isProductScene,
        });
        await db.scene.update({
          where: { id: first.id },
          data: { taskId: task.taskId, status: "generating", error: null },
        });
        started.push(first.id);
      } catch (err) {
        if (err instanceof SceneTaskError && err.transient) {
          // rate limited (429): leave scene pending, poll endpoint will retry
          await db.scene.update({ where: { id: first.id }, data: { status: "pending" } });
        } else {
          await db.scene.update({
            where: { id: first.id },
            data: { status: "error", error: "task_create_failed" },
          });
        }
        failed.push(first.id);
      }
    }

    const updated = await db.project.findUnique({
      where: { id },
      include: { scenes: { orderBy: { index: "asc" } } },
    });

    return NextResponse.json({ project: updated, started, failed });
  } catch (e: unknown) {
    console.error("generate error", e);
    return NextResponse.json({ error: "generate_failed" }, { status: 500 });
  }
}
