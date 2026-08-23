import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentReply } from "@/lib/ai/agent";

const localeNames: Record<string, string> = { ar: "Arabic", en: "English", fr: "French" };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = (body.message || "").toString().slice(0, 2000);
    const projectId = body.projectId ? String(body.projectId) : null;
    const locale = ["ar", "en", "fr"].includes(body.locale) ? body.locale : "ar";
    const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(body.history)
      ? body.history.slice(-10).map((h: { role?: string; content?: string }) => ({
          role: h.role === "assistant" ? "assistant" : "user",
          content: String(h.content ?? "").slice(0, 1000),
        }))
      : [];

    if (!message) return NextResponse.json({ error: "no_message" }, { status: 400 });

    let ctx = {
      localeName: localeNames[locale] ?? "English",
      hasVideo: false,
      hasProduct: false,
      hasStoryboard: false,
      isGenerating: false,
    };

    if (projectId) {
      const project = await db.project.findUnique({ where: { id: projectId }, include: { scenes: true } });
      if (project) {
        ctx = {
          ...ctx,
          hasVideo: Boolean(project.refAnalysis),
          hasProduct: Boolean(project.productName),
          hasStoryboard: project.scenes.some((s) => s.newPrompt),
          isGenerating: project.scenes.some((s) => s.status === "generating"),
          productName: project.productName ?? undefined,
          sceneCount: project.scenes.length || undefined,
        };
      }
    }

    const reply = await agentReply(message, history, ctx);
    return NextResponse.json({ reply });
  } catch (e: unknown) {
    console.error("chat error", e);
    return NextResponse.json({ error: "chat_failed" }, { status: 500 });
  }
}
