import ZAI from "z-ai-web-dev-sdk";
import type { VideoAnalysis } from "./analysis";

export interface AdaptedScene {
  index: number;
  isProductScene: boolean;
  newPrompt: string;
  newVoiceover: string;
  onScreenNew: string;
}

export interface AdaptationResult {
  hookLine: string;
  ctaLine: string;
  explanation: string;
  scenes: AdaptedScene[];
}

/**
 * Engine 2 — Script Rewriter (the "same video but for MY product" step).
 * Keeps the winning persuasion structure of the reference ad and rebuilds
 * every scene around the user's product — with Notch's creative guardrails:
 * ≤15 spoken words per scene, ~3.2 words/second pace, functional beats
 * preserved (hook/demo/cta), product visual-model facts injected.
 */
export async function adaptScriptForProduct(
  analysis: VideoAnalysis,
  product: {
    name: string;
    url?: string | null;
    desc?: string | null;
    size?: string | null;
    facts?: string[];
  },
  localeName: string
): Promise<AdaptationResult> {
  const zai = await ZAI.create();

  const productFactsBlock = product.facts?.length
    ? `\n- Saved rendering facts (MUST be preserved in every generated scene): ${product.facts.join(" | ")}`
    : "";
  const productSizeBlock = product.size ? `\n- Real-world size: ${product.size} (keep the product correctly scaled in hands, rooms and close-ups)` : "";

  const prompt = `You are a breakthrough advertising copywriter and prompt engineer for AI video generation.

You are given:
1) The structural analysis (reference X-ray) of a WINNING reference video ad:
${JSON.stringify(analysis, null, 2)}

2) The user's product (Brand Brain):
- Name: ${product.name}
- URL: ${product.url || "not provided"}
- Description / audience: ${product.desc || "not provided"}${productSizeBlock}${productFactsBlock}

Your job: recreate the SAME winning structure for the user's product — same persuasion sequence, same functional beats (hook → demo → cta), same pacing, same scene types and same energy — but with all content replaced by the user's product.

Respond with STRICT JSON only (no markdown fences, no commentary), with this exact shape:
{
  "hookLine": "the new opening hook line for the user's product, in ${localeName}",
  "ctaLine": "the new closing call-to-action line, in ${localeName}",
  "explanation": "one short sentence (in ${localeName}) explaining what you kept from the reference and what you replaced",
  "scenes": [
    {
      "index": 0,
      "isProductScene": true,
      "newPrompt": "ENGLISH video-generation prompt for this scene rebuilt around the user's product: describe the visuals, the product appearance, camera angle and movement, lighting, style, mood. 25-60 words. Very concrete and filmable. Always feature the user's product.",
      "newVoiceover": "the new voiceover line for this scene in ${localeName} (match the reference scene's intent; MAX 15 words — spoken dialogue must be short and punchy)",
      "onScreenNew": "short punchy on-screen text for this scene in ${localeName} (2-6 words)"
    }
  ]
}

Rules:
- One adapted scene per reference scene, same order, same roles (hook/demo/proof/cta) and same approximate durations.
- Creative guardrails (these matter): each newVoiceover is at most 15 words; total spoken pace ≈ 3.2 words/second; the whole ad arc stays within the reference total duration.
- newPrompt MUST be written in English ONLY (the video model works best in English) and MUST prominently feature the user's product. If the product name contains non-Latin characters (Arabic etc.), use its Latin/brand part or a short English translation of it (e.g. "Hydra Glow serum") — NEVER mix Arabic script inside the English prompt.
- Keep prompts strictly commercial and product-focused: bottles, packaging, textures, drops, splashes, surfaces, lighting, camera moves. AVOID describing human skin, body parts, faces, or people in close-up detail — if the reference scene had people, describe the scene abstractly (hands at most, or replace with product/lifestyle-object shots).
- If a reference scene was a product close-up (isProductScene), the adapted scene must be a hero product shot suitable for image-to-video using the user's product photo.
- newVoiceover and onScreenNew MUST be in ${localeName}.
- Keep the total number of scenes identical to the reference (${analysis.scenes.length} scenes).
- Output raw JSON only.`;

  const response = await zai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    thinking: { type: "disabled" },
  });

  const reply = response.choices?.[0]?.message?.content ?? "";
  return parseAdaptation(reply, analysis.scenes.length);
}

function parseAdaptation(raw: string, sceneCount: number): AdaptationResult {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);

  try {
    const parsed = JSON.parse(text);
    const scenes: AdaptedScene[] = (parsed.scenes ?? [])
      .slice(0, 6)
      .map((s: Partial<AdaptedScene>, i: number) => ({
        index: Number.isFinite(s.index) ? Number(s.index) : i,
        isProductScene: Boolean(s.isProductScene),
        newPrompt: String(s.newPrompt ?? "").slice(0, 900),
        newVoiceover: String(s.newVoiceover ?? "").slice(0, 400),
        onScreenNew: String(s.onScreenNew ?? "").slice(0, 120),
      }));
    if (!scenes.length) throw new Error("no scenes");
    return {
      hookLine: String(parsed.hookLine ?? "").slice(0, 300),
      ctaLine: String(parsed.ctaLine ?? "").slice(0, 300),
      explanation: String(parsed.explanation ?? "").slice(0, 500),
      scenes,
    };
  } catch {
    return {
      hookLine: "",
      ctaLine: "",
      explanation: "",
      scenes: Array.from({ length: Math.max(1, Math.min(sceneCount, 4)) }, (_, i) => ({
        index: i,
        isProductScene: i === 1,
        newPrompt: `Cinematic commercial shot of the product, studio lighting, slow camera push-in, premium mood`,
        newVoiceover: "",
        onScreenNew: "",
      })),
    };
  }
}
