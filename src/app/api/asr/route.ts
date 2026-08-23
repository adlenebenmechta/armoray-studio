import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const file_base64 = (body.audioBase64 || "").toString();
    if (!file_base64) return NextResponse.json({ error: "no_audio" }, { status: 400 });

    const zai = await ZAI.create();
    const result = await zai.audio.asr.create({ file_base64 });
    return NextResponse.json({ text: result.text ?? "" });
  } catch (e: unknown) {
    console.error("asr error", e);
    return NextResponse.json({ error: "asr_failed" }, { status: 500 });
  }
}
