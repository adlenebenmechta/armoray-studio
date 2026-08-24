import { NextResponse } from "next/server";
import { listInspirationAds, getInspirationStatus } from "@/lib/inspiration/metaAdLibrary";

/**
 * GET /api/inspiration/ads?perPage=21&page=1&sortBy=startDate&order=desc&unique=false&onlyVideo=false&competitorId=...
 * Paginated gallery of competitor ads (Inspiration source).
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const statusOnly = url.searchParams.get("status") === "true";

    if (statusOnly) {
      const status = await getInspirationStatus();
      return NextResponse.json(status);
    }

    const result = await listInspirationAds({
      competitorId: url.searchParams.get("competitorId") ?? undefined,
      perPage: Number(url.searchParams.get("perPage") ?? 21),
      page: Number(url.searchParams.get("page") ?? 1),
      sortBy:
        (url.searchParams.get("sortBy") as "startDate" | "lastSeenAt" | "createdAt") ??
        "startDate",
      order: (url.searchParams.get("order") as "asc" | "desc") ?? "desc",
      unique: url.searchParams.get("unique") === "true",
      onlyVideo: url.searchParams.get("onlyVideo") === "true",
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = String((e as Error)?.message ?? e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
