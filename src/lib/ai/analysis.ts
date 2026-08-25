import type ZAI from "z-ai-web-dev-sdk";
import { getZAI } from "./zai";

export interface SceneAnalysis {
  id: string; // scene-1-hook (Notch-style: scene-N-role)
  description: string;
  camera: string;
  onScreenText: string;
  duration: number;
  isProductScene: boolean;
  voiceover: string;
  role: string; // functional beat: hook | demo | proof | cta | problem | solution
  startSec: number; // seconds from video start
  endSec: number; // seconds from video start
  shotStartsSec: number[]; // cut points within this scene (Notch x-ray field)
  frameIndex: number; // index of the representative frame for this scene
  productEvidenceNeeded: string[]; // e.g. ["size","open-mechanism","contents"]
}

export interface XrayStats {
  framework: string; // e.g. "Problem-Solution"
  sceneCount: number;
  shotCount: number;
  peopleCount: number;
}

export interface VideoAnalysis {
  hook: string;
  structure: string[];
  tone: string;
  pacing: string;
  format: string;
  summary: string;
  scenes: SceneAnalysis[];
  stats: XrayStats;
  subtitle: string; // "3 scenes · 10 shots · Problem-Solution"
  frameProgress: { total: number; succeeded: number; failed: number };
}

const ROLES = ["hook", "demo", "proof", "cta", "problem", "solution", "agitate"];

/**
 * Engine 1 — Vision structure analysis (the "REFERENCE X-RAY" step).
 * Takes frames extracted client-side from the reference video and produces
 * the winning persuasion structure with Notch's exact x-ray schema:
 * scenes with roles, cut points (shotStartsSec), framework stats, and the
 * product evidence the demo scene will require for faithful adaptation.
 */
export async function analyzeVideoFrames(
  frames: string[],
  durationSec: number,
  transcript: string | null,
  localeName: string
): Promise<VideoAnalysis> {
  const zai = await getZAI();

  const prompt = `You are an elite advertising creative analyst. You are given ${frames.length} key frames, extracted in chronological order from a ${Math.round(durationSec)}-second video ad.
${transcript ? `The transcribed voiceover of the video is:\n"""${transcript}"""\n` : ""}
Analyze the ad like a top creative strategist (this is the "reference X-ray"). Respond with STRICT JSON only (no markdown fences, no commentary), in ${localeName} language, with this exact shape:
{
  "hook": "what happens in the first 3 seconds and why it stops the scroll (1-2 sentences)",
  "structure": ["the persuasion sequence as short labels, e.g. Hook, Problem, Solution, Proof, CTA"],
  "framework": "the persuasion framework name in 1-3 words, e.g. Problem-Solution, Before-After-Bridge, PAS, Hook-Story-Offer",
  "tone": "tone of voice in 2-4 words",
  "pacing": "editing pace description in 3-8 words",
  "format": "ad format in 2-5 words, e.g. 'UGC talking head', 'Before-After demo', 'Street interview'",
  "summary": "one sentence describing the whole ad",
  "peopleCount": 1,
  "scenes": [
    {
      "description": "detailed visual description of the scene (what is shown, who is on screen, setting, lighting)",
      "camera": "camera angle and movement (e.g. close-up static, slow push-in, handheld)",
      "onScreenText": "any text overlays visible in this scene, empty string if none",
      "duration": 5,
      "isProductScene": true,
      "voiceover": "the voiceover line spoken during this scene (from the transcript if available, otherwise inferred)",
      "role": "one of: hook | demo | proof | cta | problem | solution | agitate",
      "startSec": 0,
      "shotCount": 3,
      "productEvidenceNeeded": ["size"]
    }
  ]
}
Rules:
- Produce between 3 and 5 scenes maximum, ordered chronologically, covering the whole video.
- "duration" values must sum approximately to ${Math.round(durationSec)} seconds; each scene 3-10 seconds.
- "startSec" = cumulative start time of the scene in seconds (first scene 0).
- "role" is the functional beat of the scene in the persuasion arc; every ad should have at least one hook and one cta.
- "isProductScene" is true ONLY when the scene is a close-up / hero shot of the advertised product itself.
- "shotCount" = how many distinct cuts/shots are inside this scene (1-5). The video is ${frames.length} frames over ${Math.round(durationSec)}s.
- "productEvidenceNeeded" = list of product facts a faithful adaptation would REQUIRE, chosen from: "size" (physical dimensions/scale), "open-mechanism" (how the product opens/works), "contents" (what it looks like inside/in use), "texture" (material feel), "usage" (how it is being used). Empty list if the scene shows no product interaction.
- "peopleCount" = how many distinct people appear in the whole ad.
- Keep all string values (except camera/structure labels you may keep concise) written in ${localeName}.
- Output raw JSON only.`;

  const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: prompt },
  ];
  for (const f of frames) {
    content.push({ type: "image_url", image_url: { url: f } });
  }

  const response = await zai.chat.completions.createVision({
    model: "glm-4.6v",
    messages: [
      {
        role: "user",
        content,
      },
    ],
    thinking: { type: "disabled" },
  });

  const reply = response.choices?.[0]?.message?.content ?? "";
  return parseAnalysis(reply, durationSec, frames.length);
}

function parseAnalysis(raw: string, durationSec: number, frameCount: number): VideoAnalysis {
  let text = raw.trim();
  // strip markdown fences if present
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  // find first { ... last }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    const fallbackScene: SceneAnalysis = {
      id: "scene-1-hook",
      description: raw.slice(0, 500),
      camera: "",
      onScreenText: "",
      duration: Math.min(10, Math.max(3, durationSec / 2)),
      isProductScene: true,
      voiceover: "",
      role: "hook",
      startSec: 0,
      endSec: Math.min(10, Math.max(3, durationSec / 2)),
      shotStartsSec: [0],
      frameIndex: 0,
      productEvidenceNeeded: ["size"],
    };
    return {
      hook: "",
      structure: [],
      tone: "",
      pacing: "",
      format: "",
      summary: raw.slice(0, 300),
      scenes: [fallbackScene],
      stats: { framework: "Problem-Solution", sceneCount: 1, shotCount: 1, peopleCount: 1 },
      subtitle: `1 scene · 1 shot · Problem-Solution`,
      frameProgress: { total: frameCount, succeeded: frameCount, failed: 0 },
    };
  }

  const scenesRaw = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  let cumStart = 0;
  const scenes: SceneAnalysis[] = scenesRaw
    .slice(0, 5)
    .map((s: Record<string, unknown>, i: number) => {
      const duration = Math.min(12, Math.max(3, Number(s.duration) || 5));
      const role = ROLES.includes(String(s.role)) ? String(s.role) : i === 0 ? "hook" : "demo";
      const startSec = Number.isFinite(Number(s.startSec)) ? Number(s.startSec) : cumStart;
      const shotCount = Math.min(6, Math.max(1, Math.round(Number(s.shotCount) || 2)));
      // Build cut points evenly inside the scene (Notch's shotStartsSec)
      const shotStartsSec: number[] = [];
      for (let k = 0; k < shotCount; k++) {
        shotStartsSec.push(Math.round((startSec + (duration * k) / shotCount) * 10) / 10);
      }
      const evidence = Array.isArray(s.productEvidenceNeeded)
        ? (s.productEvidenceNeeded as unknown[])
            .map((e) => String(e))
            .filter((e) => ["size", "open-mechanism", "contents", "texture", "usage"].includes(e))
            .slice(0, 3)
        : [];
      const scene: SceneAnalysis = {
        id: `scene-${i + 1}-${role}`,
        description: String(s.description ?? "").slice(0, 800),
        camera: String(s.camera ?? "").slice(0, 200),
        onScreenText: String(s.onScreenText ?? "").slice(0, 300),
        duration,
        isProductScene: Boolean(s.isProductScene),
        voiceover: String(s.voiceover ?? "").slice(0, 500),
        role,
        startSec,
        endSec: startSec + duration,
        shotStartsSec,
        frameIndex: Math.min(frameCount - 1, Math.max(0, Math.floor((startSec / Math.max(1, durationSec)) * frameCount))),
        productEvidenceNeeded: evidence,
      };
      cumStart += duration;
      return scene;
    });

  const shotCount = scenes.reduce((acc, s) => acc + s.shotStartsSec.length, 0);
  const framework = String(parsed.framework ?? "Problem-Solution").slice(0, 60);
  const peopleCount = Math.max(0, Math.round(Number(parsed.peopleCount) || 1));
  const stats: XrayStats = {
    framework,
    sceneCount: scenes.length,
    shotCount,
    peopleCount,
  };

  return {
    hook: String(parsed.hook ?? "").slice(0, 500),
    structure: (Array.isArray(parsed.structure) ? parsed.structure : [])
      .slice(0, 8)
      .map((x: unknown) => String(x).slice(0, 60)),
    tone: String(parsed.tone ?? "").slice(0, 120),
    pacing: String(parsed.pacing ?? "").slice(0, 160),
    format: String(parsed.format ?? "").slice(0, 120),
    summary: String(parsed.summary ?? "").slice(0, 500),
    scenes,
    stats,
    subtitle: `${scenes.length} scenes · ${shotCount} shots · ${framework}`,
    frameProgress: { total: frameCount, succeeded: frameCount, failed: 0 },
  };
}
