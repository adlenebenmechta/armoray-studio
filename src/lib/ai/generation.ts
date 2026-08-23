import ZAI from "z-ai-web-dev-sdk";

export interface GenTask {
  taskId: string;
}

/**
 * Engine 3 — Scene Engine (real AI video generation).
 * Product scenes use image-to-video with the user's product photo for consistency.
 * Other scenes use text-to-video.
 */
export async function createSceneTask(opts: {
  prompt: string;
  productImage?: string | null;
  isProductScene: boolean;
  size?: string;
}): Promise<GenTask> {
  const zai = await ZAI.create();
  const size = opts.size || "1080x1920";
  const base = {
    prompt: opts.prompt,
    quality: "speed" as const,
    size,
    fps: 30,
    duration: 5,
  };

  if (opts.isProductScene && opts.productImage) {
    try {
      const task = await zai.video.generations.create({
        ...base,
        image_url: opts.productImage,
      });
      return { taskId: task.id };
    } catch {
      // fall back to text-to-video if image-to-video fails
      const task = await zai.video.generations.create(base);
      return { taskId: task.id };
    }
  }

  try {
    const task = await zai.video.generations.create(base);
    return { taskId: task.id };
  } catch {
    // fallback: horizontal size
    const task = await zai.video.generations.create({ ...base, size: "1920x1080" });
    return { taskId: task.id };
  }
}

export interface TaskResult {
  status: "processing" | "done" | "error";
  videoUrl?: string;
}

export async function queryTask(taskId: string): Promise<TaskResult> {
  const zai = await ZAI.create();
  const result = await zai.async.result.query(taskId);

  if (result.task_status === "SUCCESS") {
    const videoUrl =
      (result as Record<string, any>).video_result?.[0]?.url ||
      (result as Record<string, any>).video_url ||
      (result as Record<string, any>).url ||
      (result as Record<string, any>).video;
    if (videoUrl) return { status: "done", videoUrl };
    return { status: "error" };
  }
  if (result.task_status === "FAIL") return { status: "error" };
  return { status: "processing" };
}
