import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addCompetitor } from "@/lib/inspiration/metaAdLibrary";

/**
 * GET /api/inspiration/competitors
 * List all configured competitors (with scrape status).
 */
export async function GET() {
  const competitors = await db.competitor.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { ads: true } } },
  });

  return NextResponse.json({
    competitors: competitors.map((c) => ({
      id: c.id,
      pageUrl: c.pageUrl,
      pageId: c.pageId,
      name: c.name,
      avatar: c.avatar,
      followersCount: c.followersCount,
      likeCount: c.likeCount,
      totalAdsCount: c.totalAdsCount,
      totalUniqueAdsCount: c.totalUniqueAdsCount,
      videoAdsCount: c.videoAdsCount,
      imageAdsCount: c.imageAdsCount,
      lastScrapedAt: c.lastScrapedAt,
      lastFetchCount: c.lastFetchCount,
      lastFetchHitLimit: c.lastFetchHitLimit,
      isValid: c.isValidAccount,
      createdAt: c.createdAt,
    })),
  });
}

/**
 * POST /api/inspiration/competitors
 * Add a competitor by FB page URL or page ID.
 * Body: { pageUrl, pageId, name, avatar?, followersCount?, ... }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Basic validation
    if (!body.pageId || !body.name) {
      return NextResponse.json(
        { error: "pageId and name required" },
        { status: 400 }
      );
    }
    if (!body.pageUrl) {
      body.pageUrl = `https://www.facebook.com/${body.pageId}`;
    }

    const competitor = await addCompetitor(body);
    return NextResponse.json({ competitor });
  } catch (e: unknown) {
    const msg = String((e as Error)?.message ?? e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
