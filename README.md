# Armoray Studio — Multilingual AI Ad Cloning Platform

**Clone any winning video ad for your product — in Arabic, English and French.**

An AI-agent platform inspired by the ad-cloning pipeline: upload any reference video ad, add your product, and the agent rebuilds the same winning persuasion structure (hook → demo → CTA) around YOUR product with real AI video generation.

## ✨ Features

- 🌍 **3 languages with full RTL** — العربية / English / Français, switchable everywhere
- 🤖 **Nova agent chat** — LLM-powered agent that guides the whole pipeline conversationally
- 🩻 **Reference X-Ray** — in-browser frame + audio extraction, then VLM scene analysis with functional beats (hook / demo / proof / cta) and a proportional timeline map
- 🧠 **Brand Brain** — product profile with real-world size, saved rendering facts (injected into every generation prompt — the product-consistency trick), and a product photo
- ✍️ **Script Rewriter** — rebuilds the winning structure for your product with creative guardrails: ≤15 spoken words per scene, ~3.2 words/second pacing
- 🎬 **Scene Engine** — real AI video generation: text-to-video for lifestyle scenes, **image-to-video for product hero shots** (your real product photo), sequential queue with automatic retry on rate limits
- 🔊 **Speech QA** — after generation, each clip is transcribed and paced (words/s) like a professional QA pass
- 🗣️ **TTS voiceover preview** for every scene
- 📁 Projects library, storyboard cards, per-scene download

## 🚀 Live demo

- **Production**: https://armoray-studio-h7tch2saf-notch2.vercel.app (UI fully functional)
- Full AI pipeline runs where the Z AI SDK credentials are available (dev sandbox), or after configuring your own API key (below).

## ⚙️ Environment variables (for production AI)

| Variable | Purpose | Example |
|----------|---------|---------|
| `ZAI_BASE_URL` | AI provider base URL | `https://api.z.ai/api/paas/v4` |
| `ZAI_API_KEY` | Your Z.ai API key | from https://z.ai (API keys page) |
| `ZAI_TOKEN` | Optional auth token | — |
| `ZAI_USER_ID` | Optional user id | — |

Set them in **Vercel → Project → Settings → Environment Variables**.

Without a key, the app still works: the chat replies with guided fallback messages and the whole UX (landing, studio, 3 languages, storyboard flow) is fully explorable.

## 🛠️ Local development

```bash
bun install
bun run db:push     # SQLite schema
bun run dev         # http://localhost:3000
```

## 🧱 Tech stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui (New York)
- Prisma ORM (SQLite — ephemeral `/tmp` bootstrap on serverless)
- Z AI SDK: GLM-4.6V (vision analysis), LLM (agent + script rewriting), video generation (scene engine), ASR + TTS

## 📜 Pipeline

```
Reference video
   │  (client) frame + audio extraction
   ▼
Reference X-Ray (VLM: hook, scenes, beats, pacing, on-screen text, transcript)
   │
Brand Brain (product name, description, size, rendering facts, photo)
   │
Script Rewriter (same winning structure, product-swapped, ≤15 words/scene)
   │
Scene Engine (sequential text-to-video / image-to-video generation)
   │
Speech QA (transcript + pace check) → Storyboard with downloads
```

## ⚠️ Security note

Rotate any API tokens that were shared during development. Never commit `.env` files.
