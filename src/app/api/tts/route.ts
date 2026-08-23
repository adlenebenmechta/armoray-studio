import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = (body.text || "").toString().slice(0, 1000);
    if (!text) return NextResponse.json({ error: "no_text" }, { status: 400 });

    const zai = await ZAI.create();
    const response = await zai.audio.tts.create({
      input: text,
      voice: "tongtong",
      speed: 1.0,
      response_format: "mp3",
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(new Uint8Array(arrayBuffer)).toString("base64");
    return NextResponse.json({ audio: `data:audio/mp3;base64,${base64}` });
  } catch (e: unknown) {
    console.error("tts error", e);
    return NextResponse.json({ error: "tts_failed" }, { status: 500 });
  }
}
