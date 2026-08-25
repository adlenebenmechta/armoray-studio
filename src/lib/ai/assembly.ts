import type ZAI from "z-ai-web-dev-sdk";
import { getZAI } from "./zai";
import type { SpeechQaResult } from "./speechqa";

/**
 * FINAL ASSEMBLY — Notch's packaging stage, captured live:
 *
 *   "A-roll trimmed" → "Audio check complete" → "Video assembly complete"
 *   → "Generating end card" → "Assembled: 3 A-roll + 0 B-roll, 34s"
 *   → renderVideo → "Render complete" → "Your <Product> video ad" (9:16)
 *   → session auto-titled e.g. "Holy Strips: 4-Step Morning Energy Hack for Over 40s"
 *
 * A-roll = the scene videos with spoken dialogue (talking head / demo).
 * B-roll = supplementary cutaway clips without speech (0 in our MVP).
 * The end card is a branded closing frame appended after the last scene.
 */

export interface AssemblyStep {
  key: string;
  label: string;
  status: "done" | "pending";
  detail?: string;
}

export interface AssemblyResult {
  steps: AssemblyStep[];
  aRollCount: number;
  bRollCount: number;
  totalDurationSec: number;
  endCardPrompt: string | null;
  endCardUrl: string | null;
  autoTitle: string | null;
  aspectRatio: "9:16";
}

interface SceneForAssembly {
  role: string;
  duration: number;
  videoUrl: string | null;
  speechQa: string | null;
  newVoiceover: string | null;
}

/** Run the assembly bookkeeping over finished scenes (no FFmpeg needed for MVP). */
export function assembleTimeline(
  scenes: SceneForAssembly[],
  productName: string | null
): AssemblyResult {
  const steps: AssemblyStep[] = [];

  // 1. A-roll trim — apply each scene's speech trim
  const trims: string[] = [];
  let aRollCount = 0;
  let totalDurationSec = 0;
  for (const scene of scenes) {
    if (!scene.videoUrl) continue;
    aRollCount++;
    let dur = scene.duration || 5;
    if (scene.speechQa) {
      try {
        const qa = JSON.parse(scene.speechQa) as SpeechQaResult;
        const removed = (qa.trim?.removedMs ?? 0) / 1000;
        dur = Math.max(2, dur - removed);
        if (removed > 0) trims.push(`${removed.toFixed(1)}s`);
      } catch {
        // keep raw duration
      }
    }
    totalDurationSec += dur;
  }
  steps.push({
    key: "a-roll-trim",
    label: "A-roll trimmed",
    status: "done",
    detail: trims.length ? `${trims.join(", ")} removed` : undefined,
  });

  // 2. Audio check
  const audioIssues = scenes.filter((s) => {
    if (!s.speechQa) return false;
    try {
      const qa = JSON.parse(s.speechQa) as SpeechQaResult;
      return !qa.passed;
    } catch {
      return false;
    }
  }).length;
  steps.push({
    key: "audio-check",
    label: "Audio check complete",
    status: "done",
    detail: audioIssues ? `${audioIssues} scene(s) flagged` : "all scenes passed",
  });

  // 3. Timeline assembly
  steps.push({
    key: "assembly",
    label: "Video assembly complete",
    status: "done",
    detail: `${aRollCount} scenes sequenced`,
  });

  // 4. End card
  const endCardPrompt = buildEndCardPrompt(productName, scenes);
  steps.push({
    key: "end-card",
    label: "Generating end card",
    status: "done",
    detail: "branded closing frame",
  });

  // 5. Final count line (Notch's exact format)
  steps.push({
    key: "count",
    label: `Assembled: ${aRollCount} A-roll + 0 B-roll, ${Math.round(totalDurationSec)}s`,
    status: "done",
  });

  return {
    steps,
    aRollCount,
    bRollCount: 0,
    totalDurationSec: Math.round(totalDurationSec * 10) / 10,
    endCardPrompt,
    endCardUrl: null,
    autoTitle: null,
    aspectRatio: "9:16",
  };
}

/** Notch-style branded end card: product hero + logo lockup + CTA text. */
export function buildEndCardPrompt(
  productName: string | null,
  scenes: SceneForAssembly[]
): string | null {
  const ctaScene = scenes.find((s) => s.role === "cta") ?? scenes[scenes.length - 1];
  if (!ctaScene) return null;
  return `Vertical 9:16 end card frame for "${productName || "the product"}": centered product hero shot on clean studio background, bold uppercase brand wordmark at top, short call-to-action text "${(ctaScene.newVoiceover || "Try it today").slice(0, 60)}" at bottom, high contrast, advertising quality, crisp studio lighting, no watermarks.`;
}

/** Generate the end card image with the image API. */
export async function generateEndCard(prompt: string): Promise<string | null> {
  try {
    const zai = await getZAI();
    const res = await zai.images.generations.create({
      prompt,
      size: "768x1344", // 9:16
    });
    const item = res?.data?.[0] as { url?: string; base64?: string } | undefined;
    if (item?.url) return item.url;
    if (item?.base64) return `data:image/png;base64,${item.base64}`;
    return null;
  } catch {
    return null;
  }
}

/**
 * Auto-title — Notch names the session after itself, e.g.
 * "Holy Strips: 4-Step Morning Energy Hack for Over 40s".
 * We ask the LLM for a short punchy title from product + script.
 */
export async function generateAutoTitle(
  productName: string | null,
  scenes: SceneForAssembly[],
  localeName: string
): Promise<string | null> {
  try {
    const zai = await getZAI();
    const script = scenes
      .map((s, i) => `Scene ${i + 1} (${s.role}): ${s.newVoiceover ?? ""}`)
      .join("\n")
      .slice(0, 1200);
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `You name video-ad sessions. Product: "${productName || "the product"}". Script beats:\n${script}\n\nReply with ONE short title (max 60 chars) in ${localeName}, format: "Product: The Hook Promise". No quotes, no explanation — just the title.`,
        },
      ],
      thinking: { type: "disabled" },
    });
    const title = (response.choices?.[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "");
    return title ? title.slice(0, 80) : null;
  } catch {
    return null;
  }
}
