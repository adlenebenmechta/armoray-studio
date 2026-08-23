import ZAI from "z-ai-web-dev-sdk";

export interface GenTask {
  taskId: string;
}

export class SceneTaskError extends Error {
  transient: boolean;
  constructor(message: string, transient: boolean) {
    super(message);
    this.transient = transient;
  }
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

  const isTransient = (err: unknown) => {
    const msg = String((err as { message?: string })?.message ?? err);
    return msg.includes("429") || msg.includes("Too many requests");
  };

  const attempt = async (params: Record<string, unknown>) => {
    try {
      return await zai.video.generations.create(params as never);
    } catch (err) {
      if (isTransient(err)) throw new SceneTaskError("rate_limited", true);
      throw err;
    }
  };

  try {
    if (opts.isProductScene && opts.productImage) {
      try {
        const task = await attempt({ ...base, image_url: opts.productImage });
        return { taskId: task.id };
      } catch (err) {
        if (err instanceof SceneTaskError) throw err; // rate limited — do not fallback
        // non-transient failure: fall through to text-to-video
      }
    }
    try {
      const task = await attempt(base);
      return { taskId: task.id };
    } catch (err) {
      if (err instanceof SceneTaskError) throw err;
      // fallback: horizontal size
      const task = await attempt({ ...base, size: "1920x1080" });
      return { taskId: task.id };
    }
  } catch (err) {
    if (err instanceof SceneTaskError) throw err;
    const msg = String((err as { message?: string })?.message ?? err);
    throw new SceneTaskError(msg, false);
  }
}

export interface TaskResult {
  status: "processing" | "done" | "error";
  videoUrl?: string;
}

export async function queryTask(taskId: string): Promise<TaskResult> {
  const zai = await ZAI.create();
  try {
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
  } catch (err: unknown) {
    // The SDK throws on FAIL with a 400 containing the status in the body.
    const msg = String((err as { message?: string })?.message ?? err);
    if (msg.includes("FAIL") || msg.includes("1301") || msg.includes("content") || msg.includes("filter")) {
      return { status: "error" };
    }
    return { status: "processing" }; // transient query error, keep waiting
  }
}
