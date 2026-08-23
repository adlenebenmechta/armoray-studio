import ZAI from "z-ai-web-dev-sdk";

/**
 * Credential layer for the ZAI SDK.
 * - Development sandbox: reads /etc/.z-ai-config via ZAI.create().
 * - Production (Vercel): constructs the client from env vars so the file
 *   system (read-only on serverless) is not needed.
 */
const globalForZAI = globalThis as unknown as {
  zaiInstance: ZAI | undefined;
};

export async function getZAI(): Promise<ZAI> {
  if (globalForZAI.zaiInstance) return globalForZAI.zaiInstance;

  let instance: ZAI;
  if (process.env.ZAI_API_KEY && process.env.ZAI_BASE_URL) {
    // Production path — env-based credentials
    const config: Record<string, string> = {
      baseUrl: process.env.ZAI_BASE_URL,
      apiKey: process.env.ZAI_API_KEY,
    };
    if (process.env.ZAI_CHAT_ID) config.chatId = process.env.ZAI_CHAT_ID;
    if (process.env.ZAI_USER_ID) config.userId = process.env.ZAI_USER_ID;
    if (process.env.ZAI_TOKEN) config.token = process.env.ZAI_TOKEN;
    instance = new (ZAI as unknown as new (cfg: Record<string, string>) => ZAI)(config);
  } else {
    // Development path — file-based config
    instance = await ZAI.create();
  }

  globalForZAI.zaiInstance = instance;
  return instance;
}
