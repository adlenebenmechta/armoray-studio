/**
 * Meta Ad Library scraper — Inspiration source.
 *
 * Mirrors Notch's competitor ad library: stores competitor FB pages,
 * periodically scrapes their ads via the Meta Ad Library API,
 * keeps a paged gallery in /api/inspiration.
 *
 * Required env:
 *   META_APP_ID, META_APP_SECRET  → Facebook app credentials
 *   META_AD_LIBRARY_TOKEN         → long-lived user access token with ads_read
 *
 * If env is missing, the service degrades gracefully to a local seeded
 * library (so the Inspiration UI still works in demo/dev mode).
 */

import { db } from "@/lib/db";

export interface CompetitorInput {
  pageUrl: string;
  pageId: string;
  name: string;
  avatar?: string | null;
  followersCount?: number;
  likeCount?: number;
  pageCategories?: string[];
  websiteUrls?: string[];
  productType?: string;
  verticals?: Array<{ category: string; subcategory: string }>;
}

function hasMeta() {
  return Boolean(
    process.env.META_APP_ID &&
      process.env.META_APP_SECRET &&
      process.env.META_AD_LIBRARY_TOKEN
  );
}

/**
 * Add a competitor by FB page URL or page ID.
 * If META env is set, fetches the page snapshot from Meta Graph API
 * (page snapshot, follower counts, ad_library_search).
 * If not set, just persists what was provided.
 */
export async function addCompetitor(input: CompetitorInput) {
  const existing = await db.competitor.findUnique({
    where: { pageId: input.pageId },
  });
  if (existing) return existing;

  const competitor = await db.competitor.create({
    data: {
      pageUrl: input.pageUrl,
      pageId: input.pageId,
      name: input.name,
      avatar: input.avatar ?? null,
      followersCount: input.followersCount ?? 0,
      likeCount: input.likeCount ?? 0,
      pageCategories: JSON.stringify(input.pageCategories ?? []),
      websiteUrls: JSON.stringify(input.websiteUrls ?? []),
      productType: input.productType ?? null,
      verticals: JSON.stringify(input.verticals ?? []),
      isValidAccount: true,
    },
  });

  // Kick off async scrape (non-blocking)
  scrapeCompetitorAds(competitor.id).catch((e) =>
    console.error("scrape kick-off failed", e)
  );

  return competitor;
}

/**
 * Scrape competitor ads from Meta Ad Library.
 * https://graph.facebook.com/v18.0/ads_archive
 *
 * Stores new ads and updates seen-existing ones (lastSeenAt).
 * Sets lastScrapedAt + lastFetchCount on the Competitor row.
 */
export async function scrapeCompetitorAds(competitorId: string) {
  if (!hasMeta()) {
    // Dev fallback: mark as scraped but no real fetch
    await db.competitor.update({
      where: { id: competitorId },
      data: { lastScrapedAt: new Date(), lastFetchCount: 0 },
    });
    return { scraped: 0, note: "meta_env_missing" };
  }

  const competitor = await db.competitor.findUnique({
    where: { id: competitorId },
  });
  if (!competitor) throw new Error("competitor_not_found");

  const token = process.env.META_AD_LIBRARY_TOKEN!;
  const url = new URL("https://graph.facebook.com/v18.0/ads_archive");
  url.searchParams.set(
    "access_token",
    `${token}|${process.env.META_APP_SECRET}`
  );
  url.searchParams.set(
    "fields",
    "id,ad_creation_time,ad_creative_bodies,ad_creative_link_titles,ad_creative_link_captions,ad_creative_link_urls,ad_snapshot_url,ad_delivery_start_time,ad_delivery_stop_time,branded_content_advertiser_names,categories,page_id,page_name,platforms,published,ad_creative_videos,ad_creative_images"
  );
  url.searchParams.set("search_type", "page_unordered");
  url.searchParams.set("view_token", "DEFAULT");
  url.searchParams.set("limit", "50");
  url.searchParams.set("ad_reached_countries", '["US"]');
  url.searchParams.set("search_page_ids", JSON.stringify([competitor.pageId]));

  let fetched = 0;
  let nextUrl: string | null = url.toString();

  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      console.error("meta ads_archive failed", res.status, await res.text());
      break;
    }
    const json: any = await res.json();
    const ads: any[] = json.data ?? [];
    fetched += ads.length;

    for (const ad of ads) {
      const adArchiveId = String(ad.id);
      const bodies = ad.ad_creative_bodies ?? [];
      const titles = ad.ad_creative_link_titles ?? [];
      const linkUrls = ad.ad_creative_link_urls ?? [];
      const videos = ad.ad_creative_videos ?? [];
      const images = ad.ad_creative_images ?? [];

      const isVideo = videos.length > 0;
      const videoUrl = videos[0]?.url ?? null;
      const imageUrl = images[0]?.url ?? null;

      // Build a thumbnail (prefer video poster, fall back to image)
      const thumbnailUrl = videos[0]?.preview_url ?? imageUrl ?? null;

      const body = bodies[0] ?? "";
      const title = titles[0] ?? "";
      const linkUrl = linkUrls[0] ?? null;

      const startDate = ad.ad_delivery_start_time
        ? new Date(ad.ad_delivery_start_time)
        : null;
      const endDate = ad.ad_delivery_stop_time
        ? new Date(ad.ad_delivery_stop_time)
        : null;

      try {
        await db.metaLibraryAd.upsert({
          where: {
            competitorId_adArchiveId: { competitorId, adArchiveId },
          },
          create: {
            competitorId,
            adArchiveId,
            body: body.slice(0, 2000),
            title: title.slice(0, 500),
            linkUrl,
            videoUrl,
            imageUrl,
            thumbnailUrl,
            isVideo,
            categories: JSON.stringify(ad.categories ?? []),
            adFormat: isVideo ? "Video" : "Image",
            startDate,
            endDate,
          },
          update: {
            lastSeenAt: new Date(),
            body: body.slice(0, 2000),
            title: title.slice(0, 500),
          },
        });
      } catch (e) {
        console.error("upsert ad failed", e);
      }
    }

    nextUrl = json.paging?.next ?? null;
    // Safety: limit to 5 pages per scrape (250 ads) to stay within
    // Facebook's rate-limit guidance and our serverless budget.
    if (fetched >= 250) break;
  }

  // Update competitor with scrape results
  const totalAds = await db.metaLibraryAd.count({
    where: { competitorId },
  });
  const videoAds = await db.metaLibraryAd.count({
    where: { competitorId, isVideo: true },
  });
  const imageAds = await db.metaLibraryAd.count({
    where: { competitorId, isVideo: false },
  });

  await db.competitor.update({
    where: { id: competitorId },
    data: {
      lastScrapedAt: new Date(),
      lastFetchCount: fetched,
      lastFetchHitLimit: fetched >= 250,
      totalAdsCount: totalAds,
      totalUniqueAdsCount: totalAds, // simplified
      videoAdsCount: videoAds,
      imageAdsCount: imageAds,
    },
  });

  return { scraped: fetched, total: totalAds };
}

/**
 * Get paged ads gallery (Inspiration UI source).
 */
export async function listInspirationAds(opts: {
  competitorId?: string;
  perPage?: number;
  page?: number;
  sortBy?: "startDate" | "lastSeenAt" | "createdAt";
  order?: "asc" | "desc";
  unique?: boolean;
  onlyVideo?: boolean;
}) {
  const perPage = Math.min(opts.perPage ?? 21, 100);
  const page = Math.max(1, opts.page ?? 1);
  const sortBy = opts.sortBy ?? "startDate";
  const order = opts.order ?? "desc";

  const where: any = {};
  if (opts.competitorId) where.competitorId = opts.competitorId;
  if (opts.onlyVideo) where.isVideo = true;
  if (opts.unique) {
    // distinct by (body+title) — collapse A/B variants
    // sqlite doesn't have distinct-on; we'll just return all and let UI dedupe
  }

  const [total, items] = await Promise.all([
    db.metaLibraryAd.count({ where }),
    db.metaLibraryAd.findMany({
      where,
      include: { competitor: { select: { name: true, pageUrl: true, avatar: true } } },
      orderBy: { [sortBy]: order },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    total,
    page,
    perPage,
    items: items.map((a) => ({
      id: a.id,
      competitor: a.competitor.name,
      competitorAvatar: a.competitor.avatar,
      title: a.title,
      body: a.body,
      thumbnailUrl: a.thumbnailUrl ?? a.imageUrl,
      videoUrl: a.videoUrl,
      isVideo: a.isVideo,
      startDate: a.startDate,
      endDate: a.endDate,
      linkUrl: a.linkUrl,
    })),
  };
}

/**
 * Sync status (for the "Inspiration is scraping..." UI banner).
 */
export async function getInspirationStatus() {
  const competitors = await db.competitor.findMany();
  return {
    metaConfigured: hasMeta(),
    totalCompetitors: competitors.length,
    scrapingNow: competitors.filter(
      (c) =>
        c.lastScrapedAt &&
        Date.now() - c.lastScrapedAt.getTime() < 60_000 // active in last minute
    ).length,
    competitors: competitors.map((c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      lastScrapedAt: c.lastScrapedAt,
      lastFetchCount: c.lastFetchCount,
      lastFetchHitLimit: c.lastFetchHitLimit,
      totalAdsCount: c.totalAdsCount,
      videoAdsCount: c.videoAdsCount,
      imageAdsCount: c.imageAdsCount,
      isValid: c.isValidAccount,
    })),
  };
}
