# Worklog — Armoray Studio Project

---
Task ID: 1
Agent: main
Task: Research Notch platform and reveal its "secrets" (chat mechanism, models, video cloning pipeline)

Work Log:
- Web-searched Notch (usenotch.ai) features: clone-a-competitor, URL-to-ads, animated ads, about page
- Logged into app.usenotch.ai with OTP codes (email hello@armoray.com)
- Explored real account: agents dashboard, chats list, Brand Brain, product pages, ads library
- Read the full "Zero Trace Deodorant Wipes" chat: complete autonomous workflow with activity feed
- Extracted video CDN URLs confirming the generation model: /videos/generic/seedance/scene-1-hook...
- Documented REFERENCE X-RAY, Speech QA (3.2 w/s, pronunciation checks), Recast feature,
  product Visual Model (real-world size, rendering facts, reference photos by role),
  brand gamification scoring, credits system

Stage Summary:
- Notch uses Seedance for video generation (confirmed via CDN paths)
- Chat = autonomous agent workflow with visible reasoning, tool calls (seedStoryboard, createAvatar, updateStoryboard)
- Creative guardrails: ≤15 words/scene dialogue, 3.2 words/s pace, hook/demo/cta beats
- Speech QA stops after 2 pronunciation failures and asks the user
- All secrets documented and delivered to user in Arabic

---
Task ID: 2
Agent: main
Task: Build Armoray Studio — multilingual (AR/EN/FR) AI ad-cloning platform with the discovered features

Work Log:
- Initialized Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui project
- Built i18n system: 3 dictionaries (ar/en/fr), RTL support, Cairo font for Arabic
- Landing page: hero, how-it-works, features (4 engines), agents, testimonials, pricing, footer — all in 3 languages
- Studio app: sidebar (Agents/Projects/Brand Brain/Settings), language switcher, project management
- Agent chat with Nova (LLM): greeting, suggestions, persisted messages
- Pipeline APIs: /analyze (VLM X-Ray with hook/demo/proof/cta + timeline), /product (Brand Brain with
  size + rendering facts + photo), /adapt (Script Rewriter with 15-word/3.2wps guardrails),
  /generate + /poll (sequential scene generation with rate-limit retry + Speech QA), /chat, /asr, /tts
- Client-side media: frame extraction, audio-to-WAV base64, image downscaling
- Reference X-Ray card with proportional timeline map, Speech QA rows, storyboard cards
- Fixed: React setState-in-effect errors, s.settings reference bug, localeNames import,
  content filter on video prompts (product-focused prompts), 429 rate limits (sequential queue + transient retry)
- Tested end-to-end in browser: analysis (real VLM on test video), product save, adaptation (real LLM),
  scene 1 video generated successfully with real video URL

Stage Summary:
- Full pipeline works end-to-end in the dev environment with real AI
- Scene 1 video generated: cdn video URL confirmed
- App verified via agent-browser: 3 languages, RTL, chat, analysis card, storyboard

---
Task ID: 3
Agent: main
Task: Deploy to GitHub and Vercel

Work Log:
- Created GitHub repo: adlenebenmechta/armoray-studio (pushed via token)
- Created Vercel project prj_g9sJYaIwLRXTktvJRn1E5dSkbNen, linked GitHub repo (repoId 1343271917)
- Deployed from git source; disabled SSO deployment protection for public access
- SQLite serverless: ephemeral /tmp bootstrap with raw SQL DDL on cold start
- ZAI credential layer: getZAI() wrapper with env-based construction (ZAI_BASE_URL, ZAI_API_KEY...)
- Set env vars on Vercel; tested public GLM endpoint https://api.z.ai/api/paas/v4
- Chat endpoint graceful fallback when AI provider unavailable (guided replies in 3 languages)
- README with env setup docs

Stage Summary:
- Production URL: https://armoray-studio.vercel.app (HTTP 200, public)
- API verified: /api/projects returns data, /api/chat replies (fallback when no key)
- Studio creates projects on production (verified in browser)
- Full AI activation: user sets ZAI_API_KEY from their z.ai account in Vercel env vars

---
Task ID: 4
Agent: main
Task: Notch-exact design match (fonts, colors, login) + A-Z secrets document

Work Log:
- Extracted Notch design tokens via DevTools: Inter font, #EEDEEC bg, #212121 text,
  #F1EFEF inputs, #D9D9D9 borders, 8px radius, 64px pill buttons, white rounded-2xl cards,
  brand colors #593dfa/#2563eb/#c026d3/#d54123, GSI Google button 360x44, login card 440px p-10
- Detected auth stack: Google Identity Services (gsi/client) + custom email OTP backend
  (no Firebase/Auth0/Supabase/Clerk), React-Toastify, PostHog+Mixpanel+Sentry+GA4+FB Pixel
- Extracted live API map: /api/v1/video-agent/sessions, session-statuses, workspaces products,
  whoami, subscription, personalised-agents, notifications, mixpanel proxy, ad-insight endpoints, ads-library
- Rebuilt globals.css with Notch-accurate tokens, layout.tsx with Inter + Noto Sans Arabic
- Built LoginScreen.tsx: exact replica (440px card, GSI-style Google button, email→4-digit OTP
  with auto-advance focus, resend timer 30s, Privacy/Terms links, 3 languages)
- Rewrote Landing + StudioApp in light theme with Notch sidebar structure (Chats list with
  status labels, Credits box, language switcher)
- Fixed: stale CSS chunk cache (proxy), setMode→setUserMode bug, localeNames import
- Wrote comprehensive Arabic RTL secrets document (11-task pipeline, models/APIs per task,
  design tokens table, API map, business system, replication map) → 11-page PDF via creative-flow

Stage Summary:
- Production live at armoray-studio.vercel.app with Notch-exact light theme + login flow
- Secrets document delivered: download/أسرار_Notch_الوثيقة_الكاملة.pdf (+HTML source)
- Full login flow verified on production: landing → login (email+OTP) → studio

---
Task ID: 5
Agent: main
Task: Explain + implement Notch's free-edit credit system

Work Log:
- Explained the 3-layer mechanism: parentSessionId child sessions (billing on root
  sessions only), what's NOT re-run during edits (X-RAY/Brand Brain/Storyboard/script),
  and the business logic (better final ads = better performance data) with the
  2-retry cost guard ("before a third paid take")
- Implemented in Armoray: project.credits ledger — first generation charges 3
  credits, all subsequent regenerations are free edits (isEdit/creditCost in response)
- Agent messaging: paidGenIntro vs freeEditIntro (AR/EN/FR), real sidebar counter
- Fixed Dictionary types (missing fields), chat ctx typing, vision content typing —
  tsc clean for Vercel build
- Secrets document: added chapter 8 (why edits are free) — now 12 pages
- Restarted dev server with detached launcher (scripts/start-dev.sh) after cache clear

Stage Summary:
- Credit system verified: 1st gen = 3 credits, 2nd/3rd = 0 (isEdit=true)
- Production deployed and verified: armoray-studio.vercel.app

---
Task ID: 6
Agent: main
Task: Copy avatar-machine project 1:1, add AR/FR, integrate as "Notch Alternative" window

Work Log:
- Source identified: adlenbenmechta2/my-project ("AI Avatar Machine", 80 API routes,
  8 machines: Avatar/Carousel/Podcast/BOF/Claymotion/AllInOne/AutoPublish/Scheduler)
- Full clone (shallow clone was corrupt — full clone fixed), pushed UNTOUCHED as first
  commit to new repo adlenebenmechta/notch-alternative (new token)
- i18n layer: src/lib/i18n.ts (EN/AR/FR dicts + useAppLang hook + RTL)
- MainMenu: 24 strings localized + floating pill switcher (EN/ع/FR) + dir=rtl
- Deploy #1 failed: auto-chain maxDuration=600 > hobby limit 300 → capped
- Deploy #2 crashed client-side: t() used in AuthModal/PlansSection without hook → fixed
  (+ repaired a corrupted 'mounted' state line)
- Final deploy verified: switcher works, Arabic renders RTL on production
- Armoray Studio: apps hub section (Notch Alternative + Armoray cards) on landing,
  'Notch Alternative' window with full-screen iframe in studio sidebar (verified 1144x836)
- Both projects deployed and verified on Vercel

Stage Summary:
- notch-alternative.vercel.app — LIVE, trilingual entry (EN/AR/FR + RTL)
- armoray-studio.vercel.app — LIVE, multi-window hub with embedded Notch Alternative
- GitHub: adlenebenmechta/notch-alternative (3 commits: pristine copy → i18n → fixes)

---
Task ID: 7
Agent: main
Task: Deploy notch-alternative on Railway

Work Log:
- Railway project created via GraphQL API (98acc92a) + PostgreSQL service (working, PGDATA fix)
  + volume + domains notch-alternative-production/app-production-b84c
- Deep debugging journey: fixed maxDuration>300 (hobby), bun→node start script,
  removed conflicting railway.json (was overriding Dockerfile — main killer),
  NODE_OPTIONS heap cap 700MB, turbopack.root dev-only, HOSTNAME=0.0.0.0
- Container went from instant-EXITED → RUNNING (progress) but healthcheck still fails
- Final isolation test: raw node HTTP server (no Next) ALSO fails → trial plan has
  broken networking (no sockets detected, logs frozen at 'Starting Container',
  instant 502 with 15s timeout) — platform-level limitation, not app
- Verified Vercel deployment is fully working (HTTP 200, trilingual, RTL Arabic)
- Restored production CMD in Dockerfile for future Railway plan upgrade

Stage Summary:
- LIVE: https://notch-alternative.vercel.app (working, trilingual)
- Railway: project+DB configured and waiting; needs paid plan for networking to work
- All fixes committed to GitHub (98c37e1)

---
Task ID: 8
Agent: main
Task: Add "Notch Alternative" window inside notch-alternative.vercel.app main menu

Work Log:
- Reverted the armoray-studio landing layout change (user complaint — restore original)
- Added 9th menu card "Notch Alternative / بديل Notch / Alternative Notch" to the
  Avatar Machine MainMenu (lightning+grid icon, violet accent, trilingual strings)
- Created NotchAltView component: fullscreen window with header (back / title /
  open-in-tab buttons) + iframe embedding armoray-studio.vercel.app/?studio=1
- Wired into page.tsx navigation chain like the other 8 machines (auth-gated)
- Fixed turbopack root resolution (import.meta.dirname) — dev works in nested dir,
  production standalone unaffected
- Verified locally end-to-end: card visible → login → click → window opens with
  iframe → back button → Arabic switch shows "بديل Notch" with RTL
- Deployed to Vercel and verified the 9th card live on production

Stage Summary:
- https://notch-alternative.vercel.app now has 9 machines including Notch Alternative
- armoray-studio.vercel.app restored to original layout
