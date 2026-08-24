import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeCompetitorAds } from "@/lib/inspiration/metaAdLibrary";

/**
 * POST /api/inspiration/competitors/[id]/scrape
 * Trigger a re-scrape of competitor ads from Meta Ad Library.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const competitor = await db.competitor.findUnique({ where: { id } });
    if (!competitor) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const result = await scrapeCompetitorAds(id);
    return NextResponse.json({ result });
  } catch (e: unknown) {
    const msg = String((e as Error)?.message ?? e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
