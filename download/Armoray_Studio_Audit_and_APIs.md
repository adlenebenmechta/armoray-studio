# Armoray Studio — Audit and Production API List

## Audit: Does the "Notch Alternative" window apply the discovered secrets?

This audit compares the 11-task Notch pipeline (as documented in the secrets file) against the actual Armoray Studio code base (the project embedded inside the "Notch Alternative" window in notch-alternative.vercel.app).

### ✅ Fully Implemented Secrets (working as in Notch)

| # | Secret | File | Status |
|---|---------|---------|---|
| 1 | **Reference X-Ray** (VLM analysis with role/startAt/hook/structure/tone/pacing/format) | `src/lib/ai/analysis.ts` — `analyzeVideoFrames` uses `glm-4.6v` with chronological frames to extract hook + scene-by-scene breakdown with roles (hook/demo/proof/cta) and cumulative startAt | ✅ 100% |
| 3 | **seedStoryboard** (LLM script rewriter with Notch rules) | `src/lib/ai/adaptation.ts` — `adaptScriptForProduct` injects `productSize` + `productFacts` and enforces ≤15 words/scene, 3.2 words/sec, English-only prompts, A-roll/B-roll split via `isProductScene` | ✅ 100% |
| 6 | **Scene Engine** (video generation with image-to-video for product) | `src/lib/ai/generation.ts` — `createSceneTask` uses image-to-video for `isProductScene` (consistency with the product image), sequential chaining with transient retry on 429 in `src/app/api/projects/[id]/poll/route.ts` | ✅ 100% |
| 7 | **Speech QA** (transcript + 3.2 w/s pace check + pronunciation) | `src/lib/ai/speechqa.ts` — `runSpeechQa` uses `glm-4.6v` to read video + transcript + duration + speech_start (to trim leading silence), then `analyzeSpeech` measures pace and checks missing intended keywords (pronunciation) | ✅ 100% |
| 11 | **Free-Edit Credit System** (parentSessionId-style billing) | `src/app/api/projects/[id]/generate/route.ts` — `isEdit = project.credits > 0; creditCost = isEdit ? 0 : 3` (first generation 3 credits, all subsequent edits 0 credits) | ✅ 100% |
| – | **Client-side media processing** (no backend upload) | `src/components/studio/media.ts` — `extractFrames` (canvas JPEG) + `extractAudio` (WAV base64 via WebAudio) + `downscaleImage` for image-to-video | ✅ 100% |
| – | **Trilingual (AR/EN/FR) with RTL** | `src/lib/i18n/{en,ar,fr}.ts` + `LanguageProvider.tsx` + `<html lang dir>` in `layout.tsx` | ✅ 100% |

### ⚠️ Partially Implemented (needs completion to match Notch)

| Secret | Current status | What's missing |
|---|---|---|
| **2. Brand Brain** | Simple fields in `Project` (productSize, productFacts, productDesc) | Full Fact system like Notch: `{id, key:"memory/brand-description.md", summary, value (Markdown body), references[], isAlwaysLoaded, personalisedAgentId}` — multiple facts per brand, with `isAlwaysLoaded` controlling context injection. Needs new `BrandFact` Prisma model. |
| **Visual Model for Product** | Product image is a single string (URL) | Notch has `visualModelComplete` flag and `sizeDescription` as a separate structured field. Need: structured product size (real-world dimensions in cm), rendering facts list, and role-classified reference photos (hero/lifestyle/hands/context). |

### ❌ Completely Missing (must be added for production)

| Secret | What's missing |
|---|---|
| **4. createAvatar (Higgsfield library)** | Armoray has no avatar system. Notch uses **Higgsfield** (not HeyGen as I previously thought) — confirmed via `source: "higgsfield_licensed"` and `cco-public.s3.us-west-1.amazonaws.com/video-agent/reference-library/higgsfield_licensed/...`. Each avatar has: `id (hfa_*)`, `frameId (hff_*)`, `activity`, `ageBucket`, `cameraAngle`, `gender`, `setting`, `skinTone`, `vibe`, `publicUrl`. Needs: Higgsfield API integration or local avatar library + UI picker. |
| **5. Key Visuals** | Notch generates static key visual frames before video (for approval/storyboard preview). Armoray goes straight from script to video. Need: an image generation step before scene video generation. |
| **8. Corrective regen with pronunciation notes** | `runSpeechQa` returns `issues: ["pronunciation: word"]` but the poll route does NOT trigger automatic regen. Need: when issues > 0 and attempts < 2, automatically regenerate the scene with pronunciation notes injected into the prompt. |
| **9. Final assembly (A-roll/B-roll + end card via FFmpeg)** | Armoray shows only scene 1 video as the final result. Notch calls `normalized-{timestamp}.mp4` (assembled via FFmpeg with end card + watermark). Need: FFmpeg service (or serverless function) that concatenates scenes + end card + audio normalization. |
| **10. Product-Evidence Gate** | Armoray lets you generate even with no product image. Notch blocks generation until `visualModelComplete: true`. Need: pre-generation validation requiring product image + size + at least one rendering fact. |
| **Connections (4 real integrations)** | None of them exist in Armoray. Need: Meta Ads (publish via FB Ads Manager), TikTok Ads (publish), TikTok Creator (publish to creator account), Canva (import templates). |
| **Inspiration (competitor + industry ads)** | None. Need: Meta Ad Library scraper + TikTok Ad Library scraper to populate competitor ad galleries. |
| **Design Guideline** | None. Need: `colors.palettes[]`, `fonts`, `designGuidelines {dos, donts, description}`, `contentGuidelines {dos, donts, description}` — injected into every scene prompt for brand consistency. |

---

## Production API List — What to add to make Armoray Studio production-ready

### 1. Authentication (real OTP)

| Service | Purpose | Endpoint to build |
|---|---|---|
| **Resend** (resend.com) | Send OTP email with 4-char code | `POST /api/auth/request-otp` — generates code, saves in `OtpCode` Prisma model with 5-min expiry, sends via Resend |
| **Google Identity Services** | "Continue with Google" button | `POST /api/auth/google` — exchanges Google ID token for JWT |
| **jose + HttpOnly cookies** | Session management | Sign JWT, set cookie `armoray_sess`, validate on every API request |
| Prisma model: `OtpCode { id, email, code, expiresAt, usedAt }` | – | – |
| Prisma model: `User { id, email, googleSub, createdAt }` | – | – |
| Prisma model: `Workspace { id, ownerId, name }` | – | – |

### 2. Brand Brain (full facts system)

| Service | Endpoint | Schema |
|---|---|---|
| Prisma `BrandFact` model | `GET /api/brand/facts`, `POST /api/brand/facts`, `PUT /api/brand/facts/:id`, `DELETE /api/brand/facts/:id` | `{ id, workspaceId, key, summary, value (Markdown), references[] (JSON), isAlwaysLoaded, personalisedAgentId, createdAt, updatedAt }` |
| **GLM-4.6 (LLM)** | `POST /api/brand/auto-brain` | Takes product URL + image, auto-generates brand description, positioning, content rules, visual direction. Saves as 4 BrandFacts with `isAlwaysLoaded: true`. |

### 3. Design Guideline

| Endpoint | Schema |
|---|---|
| `GET /api/brand/design-guideline` | `{ colors: { palettes: [{ id, name, colors: [{ id, name, value }], isDefault }] }, fonts, designGuidelines: { dos[], donts[], description }, contentGuidelines: { dos[], donts[], description }, status }` |
| `PUT /api/brand/design-guideline` | Update palette/colors/dos/donts |

Inject `designGuidelines.description` + `contentGuidelines.description` + palette hex codes into every scene prompt in `adaptation.ts`.

### 4. Visual Product Model (Evidence Gate)

| Endpoint | Schema |
|---|---|
| `PUT /api/products/:id` | `{ sizeDescription (structured: { width, height, depth, unit }), renderingFacts: string[], referencePhotos: [{ role: "hero"|"lifestyle"|"hands"|"context", url }], visualModelComplete: boolean }` |
| `GET /api/products/:id/evidence-status` | `{ canGenerate: boolean, missingFields: string[] }` |

Block generation in `generate/route.ts` when `!visualModelComplete`.

### 5. Higgsfield Avatar Library

| Endpoint | Notes |
|---|---|
| `GET /api/avatars/library` | Returns array of Higgsfield avatars (mirror Notch schema: `id, name, gender, ageBucket, activity, setting, skinTone, cameraAngle, vibe, publicUrl, tags`) |
| `POST /api/avatars` | Create custom avatar — calls Higgsfield API to train avatar from uploaded reference video + face photos |

Need to obtain Higgsfield API key and integrate their avatar-creation endpoint.

### 6. Scene Generation — corrective regen

Update `src/app/api/projects/[id]/poll/route.ts`:
```
When Speech QA returns issues.length > 0 AND scene.retryCount < 2:
  → Re-run `createSceneTask` with `prompt + " NOTE: ensure the word '${missingWord}' is clearly visible/spoken"`
  → Increment scene.retryCount
When issues.length > 0 AND scene.retryCount >= 2:
  → Stop, set scene.status = "needs_user_input", show user a card "Help Nova pronounce 'X'"
```

Add `retryCount Int @default(0)` and `pronunciationNotes String?` to `Scene` Prisma model.

### 7. Final assembly (FFmpeg)

| Endpoint | Purpose |
|---|---|
| `POST /api/projects/:id/assemble` | Server-side FFmpeg (or `fluent-ffmpeg` Lambda) that: 1) concatenates scene videos in order, 2) normalizes audio (loudnorm to -14 LUFS), 3) adds end card (5s brand logo + URL), 4) optional watermark, 5) uploads to S3/CDN, 6) returns final MP4 URL |

Vercel has 300s function limit — for long videos use Railway background worker or AWS MediaConvert.

### 8. Connections (4 integrations)

| Integration | OAuth flow | Endpoints to build |
|---|---|---|
| **Meta Ads** (FB Ads Manager) | Meta Login → `ads_management` scope | `GET /api/meta/auth-url`, `GET /api/meta/callback`, `GET /api/meta/ad-accounts`, `POST /api/ad-ideas/:id/publish-meta` (creates ad creative + campaign in FB Ads Manager via `/<ad_account>/adcreatives` + `/<ad_account>/campaigns`) |
| **TikTok Ads** | TikTok Marketing API OAuth | `GET /api/tiktok/auth-url`, `GET /api/tiktok/callback`, `GET /api/tiktok/ad-accounts`, `POST /api/ad-ideas/:id/publish-tiktok` |
| **TikTok Creator** | TikTok Content Posting API | `GET /api/tiktok-creator/auth-url`, `POST /api/ad-ideas/:id/post-tiktok-creator` |
| **Canva** | Canva Connect OAuth | `GET /api/canva/auth-url`, `GET /api/canva/callback`, `GET /api/canva/designs` (list user's Canva designs to import as templates) |

### 9. Inspiration (competitor + industry ad library)

| Endpoint | Notes |
|---|---|
| `GET /api/competitors` | List configured competitor FB/TikTok pages |
| `POST /api/competitors` | Add competitor by FB page URL — kicks off Meta Ad Library scraper |
| `GET /api/meta-library-ads/status` | Sync progress (current `lastFetchCount`, `lastFetchHitLimit`) |
| `GET /api/meta-library-ads?perPage=21&page=1&sortBy=startDate&order=desc&unique=false` | Paged competitor ad gallery |
| `GET /api/meta-library-ads/filters` | Facets (industry, format, country) |
| `GET /api/tiktok-library-ads?...` | Same for TikTok |

Backend worker (Railway cron or AWS EventBridge) that periodically calls Meta Ad Library API (`https://graph.facebook.com/v18.0/ads_archive`) and TikTok Ad Library API to refresh stored ads.

### 10. Analytics (optional but Notch has them)

PostHog (already in env), Sentry (for errors), GA4 (page_view events). All optional for MVP but expected by serious users.

---

## Summary

**Out of 11 Notch secrets:**
- ✅ 5 fully implemented (X-Ray, Script Rewriter, Scene Engine, Speech QA, Credit system)
- ⚠️ 2 partial (Brand Brain as simple fields instead of full Fact system; Product Visual Model incomplete)
- ❌ 4 missing entirely (Higgsfield avatars, Key Visuals, corrective regen, final FFmpeg assembly, Product-Evidence Gate)

**APIs to add for production (priority order):**
1. 🔴 **Critical for launch** — Real OTP (Resend) + Google Identity + JWT sessions
2. 🔴 **Critical for clone-a-competitor feature** — Meta Ad Library scraper + competitors page
3. 🔴 **Critical for publish-to-ads feature** — Meta Ads + TikTok Ads OAuth + publish endpoints
4. 🟡 **Important** — Brand Brain Facts system + Design Guideline + Product Visual Model (Evidence Gate)
5. 🟡 **Important** — Higgsfield avatar library integration (or HeyGen as alternative)
6. 🟡 **Important** — Final FFmpeg assembly service
7. 🟢 **Polish** — Corrective regen with pronunciation notes, Key Visuals preview step, Canva + TikTok Creator integrations, PostHog/Sentry/GA4 analytics
