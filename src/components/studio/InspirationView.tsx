"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Search,
  Plus,
  Sparkles,
  Video,
  ImageIcon,
  Users,
  ExternalLink,
  RefreshCw,
  Play,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";

interface Competitor {
  id: string;
  name: string;
  pageUrl: string;
  avatar: string | null;
  followersCount: number;
  totalAdsCount: number;
  videoAdsCount: number;
  imageAdsCount: number;
  lastScrapedAt: string | null;
  lastFetchCount: number;
  lastFetchHitLimit: boolean;
  isValid: boolean;
}

interface Ad {
  id: string;
  competitor: string;
  competitorAvatar: string | null;
  title: string | null;
  body: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  isVideo: boolean;
  startDate: string | null;
  endDate: string | null;
  linkUrl: string | null;
}

interface AvatarItem {
  id: string;
  externalId: string;
  name: string;
  source: string;
  frameId: string | null;
  publicUrl: string | null;
  gender: string | null;
  ageBucket: string | null;
  activity: string | null;
  setting: string | null;
  cameraAngle: string | null;
  skinTone: string | null;
  vibe: string | null;
  tags: string[];
}

export default function InspirationView() {
  const { dict, locale } = useLang();
  const t = dict.studio?.inspiration ?? {
    title: "Inspiration",
    subtitle: "Competitor ads scraped from the Meta Ad Library",
    addCompetitor: "Add competitor",
    competitorName: "Page name",
    pageId: "Facebook Page ID",
    pageUrl: "Page URL (optional)",
    addBtn: "Add",
    sync: "Re-scrape",
    noAds: "No ads yet — add a competitor to start scraping",
    videosOnly: "Videos only",
    metaNotConfigured:
      "Meta API not configured — using dev mode (no live scraping). Set META_APP_ID / META_APP_SECRET / META_AD_LIBRARY_TOKEN to enable real scraping.",
    adsCount: "ads",
    videos: "videos",
    images: "images",
    lastScraped: "Last scraped",
    never: "never",
    avatarPicker: "Avatar library",
    avatarSubtitle: "Licensed Higgsfield-style presenters",
    all: "All",
    female: "Female",
    male: "Male",
    senior: "Senior",
    ugc: "UGC",
    studio: "Studio",
    outdoor: "Outdoor",
    useAsRef: "Use as reference",
    selected: "Selected",
  };

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCompetitor, setFilterCompetitor] = useState<string>("");
  const [onlyVideo, setOnlyVideo] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<{
    metaConfigured: boolean;
    totalCompetitors: number;
  } | null>(null);

  // Avatar state
  const [avatars, setAvatars] = useState<AvatarItem[]>([]);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [avatarGender, setAvatarGender] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const loadCompetitors = useCallback(async () => {
    try {
      const res = await fetch("/api/inspiration/competitors");
      const data = await res.json();
      setCompetitors(data.competitors ?? []);
      const statusRes = await fetch("/api/inspiration/ads?status=true");
      const s = await statusRes.json();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAds = useCallback(async () => {
    setAdsLoading(true);
    try {
      const params = new URLSearchParams({
        perPage: "21",
        page: String(page),
        sortBy: "startDate",
        order: "desc",
      });
      if (filterCompetitor) params.set("competitorId", filterCompetitor);
      if (onlyVideo) params.set("onlyVideo", "true");
      const res = await fetch(`/api/inspiration/ads?${params}`);
      const data = await res.json();
      setAds(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setAdsLoading(false);
    }
  }, [page, filterCompetitor, onlyVideo]);

  const loadAvatars = useCallback(async () => {
    setAvatarLoading(true);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (avatarGender) params.set("gender", avatarGender);
      const res = await fetch(`/api/avatars?${params}`);
      const data = await res.json();
      setAvatars(data.avatars ?? []);
    } finally {
      setAvatarLoading(false);
    }
  }, [avatarGender]);

  useEffect(() => {
    loadCompetitors();
    loadAvatars();
  }, [loadCompetitors, loadAvatars]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  async function handleAddCompetitor(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    const pageId = String(form.get("pageId") ?? "").trim();
    const pageUrl =
      String(form.get("pageUrl") ?? "").trim() ||
      `https://www.facebook.com/${pageId}`;
    if (!name || !pageId) return;
    await fetch("/api/inspiration/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pageId, pageUrl }),
    });
    setShowAddForm(false);
    await loadCompetitors();
    await loadAds();
  }

  async function handleScrape(id: string) {
    await fetch(`/api/inspiration/competitors/${id}/scrape`, {
      method: "POST",
    });
    await loadCompetitors();
    await loadAds();
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Sparkles className="w-6 h-6" style={{ color: "#593dfa" }} />
            {t.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.subtitle}</p>
          {status && !status.metaConfigured && (
            <div className="mt-3 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
              {t.metaNotConfigured}
            </div>
          )}
        </div>

        {/* Competitors section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-muted-foreground">
              {dict.studio?.sidebar?.agents ? "Competitors" : "Competitors"} (
              {competitors.length})
            </h2>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 btn-pill"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.addCompetitor}
            </button>
          </div>

          {showAddForm && (
            <form
              action={handleAddCompetitor}
              className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 p-3 rounded-xl border border-border bg-card"
            >
              <input
                name="name"
                placeholder={t.competitorName}
                required
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <input
                name="pageId"
                placeholder={t.pageId}
                required
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <input
                name="pageUrl"
                placeholder={t.pageUrl}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <button
                type="submit"
                className="md:col-span-3 btn-pill h-10 bg-primary text-primary-foreground text-sm font-semibold"
              >
                {t.addBtn}
              </button>
            </form>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : competitors.length === 0 ? (
            <div className="text-muted-foreground text-sm border border-dashed border-border rounded-2xl bg-card p-6 text-center">
              {t.noAds}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {competitors.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center gap-3">
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Users className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{c.name}</div>
                      <a
                        href={c.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        dir="ltr"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {c.pageUrl.replace("https://www.facebook.com/", "")}
                      </a>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      <b className="text-foreground">{c.totalAdsCount}</b>{" "}
                      {t.adsCount}
                    </span>
                    <span>
                      <b className="text-foreground">{c.videoAdsCount}</b>{" "}
                      {t.videos}
                    </span>
                    <span>
                      <b className="text-foreground">{c.imageAdsCount}</b>{" "}
                      {t.images}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {t.lastScraped}:{" "}
                      {c.lastScrapedAt
                        ? new Date(c.lastScrapedAt).toLocaleString(locale)
                        : t.never}
                    </span>
                    <button
                      onClick={() => handleScrape(c.id)}
                      className="text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t.sync}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ads gallery */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-muted-foreground">
              {dict.studio?.sidebar?.projects ?? "Ad library"} ({total})
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterCompetitor}
                onChange={(e) => {
                  setPage(1);
                  setFilterCompetitor(e.target.value);
                }}
                className="px-2 py-1.5 rounded-lg border border-border bg-card text-xs"
              >
                <option value="">{dict.studio?.views?.projects?.title ?? "All competitors"}</option>
                {competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVideo}
                  onChange={(e) => {
                    setPage(1);
                    setOnlyVideo(e.target.checked);
                  }}
                  className="rounded"
                />
                {t.videosOnly}
              </label>
            </div>
          </div>

          {adsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : ads.length === 0 ? (
            <div className="text-muted-foreground text-sm border border-dashed border-border rounded-2xl bg-card p-10 text-center">
              {t.noAds}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {ads.map((ad) => (
                  <a
                    key={ad.id}
                    href={ad.videoUrl || ad.linkUrl || ad.thumbnailUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-[9/16] bg-muted relative">
                      {ad.thumbnailUrl ? (
                        <img
                          src={ad.thumbnailUrl}
                          alt={ad.title || ad.competitor}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      {ad.isVideo && (
                        <div className="absolute top-2 end-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                          <Play className="w-3 h-3 text-white" fill="white" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-bold truncate">
                        {ad.competitor}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                        {ad.title || ad.body?.slice(0, 80) || ""}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              {total > 21 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="btn-pill px-3 h-8 text-xs bg-card border border-border disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {page} / {Math.ceil(total / 21)}
                  </span>
                  <button
                    disabled={page * 21 >= total}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-pill px-3 h-8 text-xs bg-card border border-border disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Avatar library */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t.avatarPicker}
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {t.avatarSubtitle}
              </p>
            </div>
            <div className="flex gap-1 flex-wrap">
              {["", "Female", "Male", "YoungAdult", "Adult", "Senior"].map(
                (g) => (
                  <button
                    key={g || "all"}
                    onClick={() => setAvatarGender(g)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                      avatarGender === g
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g === ""
                      ? t.all
                      : g === "Female"
                      ? t.female
                      : g === "Male"
                      ? t.male
                      : g}
                  </button>
                )
              )}
            </div>
          </div>

          {avatarLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {avatars.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAvatar(a.id)}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
                    selectedAvatar === a.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="aspect-[3/4] bg-muted">
                    {a.publicUrl && (
                      <img
                        src={a.publicUrl}
                        alt={a.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                    <div className="text-[10px] font-bold text-white truncate">
                      {a.name}
                    </div>
                    <div className="text-[8px] text-white/70 truncate">
                      {a.gender} · {a.setting}
                    </div>
                  </div>
                  {selectedAvatar === a.id && (
                    <div className="absolute top-1 end-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-[10px] text-white">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          {selectedAvatar && (
            <div className="text-xs text-muted-foreground mt-2">
              ✓ {t.selected}:{" "}
              <span className="font-bold text-foreground">
                {avatars.find((a) => a.id === selectedAvatar)?.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
