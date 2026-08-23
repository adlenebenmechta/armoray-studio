import ZAI from "z-ai-web-dev-sdk";

async function main(taskId: string) {
  const zai = await ZAI.create();
  try {
    const result = await zai.async.result.query(taskId);
    console.log(JSON.stringify({
      status: result.task_status,
      model: result.model || null,
      videoUrl: (result as any).video_result?.[0]?.url || (result as any).video_url || (result as any).url || null,
    }, null, 2));
  } catch (err: any) {
    console.error("query failed:", err?.message || err);
  }
}

const taskId = process.argv[2];
if (!taskId) {
  console.error("usage: bun run check-task.ts <taskId>");
  process.exit(1);
}
main(taskId);
