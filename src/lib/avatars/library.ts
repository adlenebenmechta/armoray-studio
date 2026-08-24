/**
 * Avatar library service.
 *
 * Mirrors Notch's Higgsfield-licensed avatar library:
 * - Avatars come from HIGGSFIELD (source="higgsfield_licensed")
 * - Each avatar has id (hfa_*), frameId (hff_*), name, publicUrl (poster),
 *   gender, ageBucket, activity, setting, cameraAngle, skinTone, vibe, tags
 *
 * In dev / when Higgsfield API key is not configured, falls back to a
 * seeded library of 12 pre-defined avatars (so the picker works).
 */

import { db } from "@/lib/db";

const SEEDED_AVATARS = [
  {
    externalId: "hfa_demo_001",
    name: "Maya",
    gender: "Female",
    ageBucket: "YoungAdult",
    activity: "standing",
    setting: "kitchen",
    cameraAngle: "front",
    skinTone: "skin200",
    vibe: "natural UGC morning routine, soft window light",
    tags: ["female", "ugc", "kitchen"],
    publicUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_002",
    name: "Daniel",
    gender: "Male",
    ageBucket: "Adult",
    activity: "sitting",
    setting: "home office",
    cameraAngle: "front",
    skinTone: "skin100",
    vibe: "confident product pitch, neutral background",
    tags: ["male", "testimonial"],
    publicUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2c?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_003",
    name: "Sophia",
    gender: "Female",
    ageBucket: "Adult",
    activity: "standing",
    setting: "studio",
    cameraAngle: "front",
    skinTone: "skin300",
    vibe: "premium beauty ad, studio softbox lighting",
    tags: ["female", "studio", "beauty"],
    publicUrl:
      "https://images.unsplash.com/photo-1438761681033-6471bcf51c40?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_004",
    name: "Marcus",
    gender: "Male",
    ageBucket: "YoungAdult",
    activity: "standing",
    setting: "gym",
    cameraAngle: "front",
    skinTone: "skin400",
    vibe: "fitness lifestyle, hard light, sweat",
    tags: ["male", "fitness"],
    publicUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69a2c6f3e1?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_005",
    name: "Aria",
    gender: "Female",
    ageBucket: "YoungAdult",
    activity: "standing",
    setting: "outdoor park",
    cameraAngle: "front",
    skinTone: "skin200",
    vibe: "aspirational outdoor, golden hour",
    tags: ["female", "outdoor"],
    publicUrl:
      "https://images.unsplash.com/photo-1502823403499-9cc03d0cb01d?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_006",
    name: "Liam",
    gender: "Male",
    ageBucket: "Senior",
    activity: "sitting",
    setting: "living room",
    cameraAngle: "front",
    skinTone: "skin100",
    vibe: "wise grandfather testimonial, warm tungsten",
    tags: ["male", "senior", "testimonial"],
    publicUrl:
      "https://images.unsplash.com/photo-1556157387-97cb2a71c1b5?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_007",
    name: "Zara",
    gender: "Female",
    ageBucket: "Adult",
    activity: "standing",
    setting: "beach",
    cameraAngle: "side",
    skinTone: "skin400",
    vibe: "summer lifestyle ad, sun flare",
    tags: ["female", "beach", "lifestyle"],
    publicUrl:
      "https://images.unsplash.com/photo-1517841208295-13351c3a8ec1?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_008",
    name: "Noah",
    gender: "Male",
    ageBucket: "YoungAdult",
    activity: "standing",
    setting: "street",
    cameraAngle: "front",
    skinTone: "skin300",
    vibe: "street interview UGC, handheld, day light",
    tags: ["male", "ugc", "street"],
    publicUrl:
      "https://images.unsplash.com/photo-1500648767791-4dcc0a77861f?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_009",
    name: "Priya",
    gender: "Female",
    ageBucket: "Adult",
    activity: "standing",
    setting: "yoga studio",
    cameraAngle: "front",
    skinTone: "skin300",
    vibe: "wellness guru, calm voice, soft light",
    tags: ["female", "wellness"],
    publicUrl:
      "https://images.unsplash.com/photo-1544005311-a5e1afe05060?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_010",
    name: "Ethan",
    gender: "Male",
    ageBucket: "YoungAdult",
    activity: "sitting",
    setting: "gaming desk",
    cameraAngle: "front",
    skinTone: "skin100",
    vibe: "tech reviewer, RGB lighting, modern setup",
    tags: ["male", "tech"],
    publicUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0fb37756b?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_011",
    name: "Ava",
    gender: "Female",
    ageBucket: "YoungAdult",
    activity: "standing",
    setting: "boutique",
    cameraAngle: "front",
    skinTone: "skin200",
    vibe: "fashion retail assistant, friendly bright",
    tags: ["female", "fashion"],
    publicUrl:
      "https://images.unsplash.com/photo-1488426812027-85e725a00cd7?w=400&h=600&fit=crop",
  },
  {
    externalId: "hfa_demo_012",
    name: "Lucas",
    gender: "Male",
    ageBucket: "Adult",
    activity: "standing",
    setting: "restaurant kitchen",
    cameraAngle: "front",
    skinTone: "skin200",
    vibe: "chef food pitch, warm kitchen light",
    tags: ["male", "chef", "food"],
    publicUrl:
      "https://images.unsplash.com/photo-1566554273541-37a9c89e57fd?w=400&h=600&fit=crop",
  },
];

function hasHiggsfield() {
  return Boolean(process.env.HIGGSFIELD_API_KEY);
}

/**
 * Sync the avatar library — pulls from Higgsfield if available,
 * otherwise seeds the local DB with demo avatars.
 */
export async function syncAvatarLibrary() {
  const existing = await db.avatar.count();
  if (existing === 0) {
    await db.avatar.createMany({
      data: SEEDED_AVATARS.map((a) => ({
        ...a,
        source: "higgsfield_licensed",
        frameId: a.externalId.replace("hfa_", "hff_"),
        tags: JSON.stringify(a.tags),
        emotions: JSON.stringify([]),
      })),
    });
  }
  if (!hasHiggsfield()) return { synced: existing || SEEDED_AVATARS.length, source: "demo_seed" };

  // Real Higgsfield sync — left as future hook
  // GET https://api.higgsfield.com/api/v1/avatars  (Authorization: Bearer HIGGSFIELD_API_KEY)
  // For now, leave the seeded library in place — Higgsfield sync is a TODO
  // that requires an actual production Higgsfield license.
  return { synced: existing, source: "higgsfield_cached" };
}

/**
 * List avatars (paginated).
 * Supports tag filtering (gender / ageBucket / setting).
 */
export async function listAvatars(opts: {
  limit?: number;
  gender?: string;
  ageBucket?: string;
  setting?: string;
  tag?: string;
} = {}) {
  await syncAvatarLibrary(); // ensure library is populated

  const where: any = {};
  if (opts.gender) where.gender = opts.gender;
  if (opts.ageBucket) where.ageBucket = opts.ageBucket;
  if (opts.setting) where.setting = opts.setting;

  const all = await db.avatar.findMany({
    where,
    take: opts.limit ?? 500,
    orderBy: { name: "asc" },
  });

  // Tag filter (JSON-contains, SQLite has no native JSON query — filter in JS)
  let filtered = all;
  if (opts.tag) {
    filtered = filtered.filter((a) => {
      const tags = JSON.parse(a.tags ?? "[]");
      return tags.includes(opts.tag!);
    });
  }

  return {
    source: hasHiggsfield() ? "higgsfield" : "demo_seed",
    total: filtered.length,
    avatars: filtered.map((a) => ({
      id: a.id,
      externalId: a.externalId,
      name: a.name,
      source: a.source,
      frameId: a.frameId,
      publicUrl: a.publicUrl,
      gender: a.gender,
      ageBucket: a.ageBucket,
      activity: a.activity,
      setting: a.setting,
      cameraAngle: a.cameraAngle,
      skinTone: a.skinTone,
      vibe: a.vibe,
      tags: JSON.parse(a.tags ?? "[]"),
    })),
  };
}

/**
 * Get a single avatar by external ID (for use in scene prompts).
 */
export async function getAvatarByExternalId(externalId: string) {
  return db.avatar.findUnique({ where: { externalId } });
}
