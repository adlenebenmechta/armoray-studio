import { NextResponse } from "next/server";
import { listAvatars } from "@/lib/avatars/library";

/**
 * GET /api/avatars?gender=Female&ageBucket=YoungAdult&setting=kitchen&tag=ugc&limit=500
 * Returns the avatar library (mirrors Notch's /api/v1/video-agent/avatars/library).
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const result = await listAvatars({
      gender: url.searchParams.get("gender") ?? undefined,
      ageBucket: url.searchParams.get("ageBucket") ?? undefined,
      setting: url.searchParams.get("setting") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? 500),
    });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = String((e as Error)?.message ?? e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
