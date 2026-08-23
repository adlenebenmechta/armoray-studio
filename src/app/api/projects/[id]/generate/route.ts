import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSceneTask } from "@/lib/ai/generation";

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

    const started: string[] = [];
    const failed: string[] = [];

    for (const scene of scenes) {
      try {
        const task = await createSceneTask({
          prompt: scene.newPrompt!,
          productImage: project.productImage,
          isProductScene: scene.isProductScene,
        });
        await db.scene.update({
          where: { id: scene.id },
          data: { taskId: task.taskId, status: "generating", error: null },
        });
        started.push(scene.id);
      } catch (e) {
        await db.scene.update({
          where: { id: scene.id },
          data: { status: "error", error: "task_create_failed" },
        });
        failed.push(scene.id);
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
