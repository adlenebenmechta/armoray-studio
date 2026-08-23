import type ZAI from "z-ai-web-dev-sdk";
import { getZAI } from "./zai";

export interface SceneAnalysis {
  description: string;
  camera: string;
  onScreenText: string;
  duration: number;
  isProductScene: boolean;
  voiceover: string;
  role: string; // functional beat: hook | demo | proof | cta
  startAt: number; // seconds from video start
}

export interface VideoAnalysis {
  hook: string;
  structure: string[];
  tone: string;
  pacing: string;
  summary: string;
  format: string;
  scenes: SceneAnalysis[];
}

/**
 * Engine 1 — Vision structure analysis (the "REFERENCE X-RAY" step).
 * Takes frames extracted client-side from the reference video and produces
 * the winning persuasion structure: hook, scene-by-scene breakdown with
 * functional beats (hook/demo/cta), tone, pacing — like Notch's X-RAY.
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
  "tone": "tone of voice in 2-4 words",
  "pacing": "editing pace description in 3-8 words",
  "format": "ad format in 2-5 words, e.g. 'UGC talking head', 'Before-After demo', 'Street interview'",
  "summary": "one sentence describing the whole ad",
  "scenes": [
    {
      "description": "detailed visual description of the scene (what is shown, who is on screen, setting, lighting)",
      "camera": "camera angle and movement (e.g. close-up static, slow push-in, handheld)",
      "onScreenText": "any text overlays visible in this scene, empty string if none",
      "duration": 5,
      "isProductScene": true,
      "voiceover": "the voiceover line spoken during this scene (from the transcript if available, otherwise inferred)",
      "role": "one of: hook | demo | proof | cta",
      "startAt": 0
    }
  ]
}
Rules:
- Produce between 3 and 5 scenes maximum, ordered chronologically, covering the whole video.
- "duration" values must sum approximately to ${Math.round(durationSec)} seconds; each scene 3-10 seconds.
- "startAt" = cumulative start time of the scene in seconds (first scene 0).
- "role" is the functional beat of the scene in the persuasion arc; every ad should have at least one hook and one cta.
- "isProductScene" is true ONLY when the scene is a close-up / hero shot of the advertised product itself.
- Keep all string values (except camera/structure labels you may keep concise) written in ${localeName}.
- Output raw JSON only.`;

  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
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
  return parseAnalysis(reply, durationSec);
}

function parseAnalysis(raw: string, durationSec: number): VideoAnalysis {
  let text = raw.trim();
  // strip markdown fences if present
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  // find first { ... last }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);

  let parsed: Partial<VideoAnalysis>;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      hook: "",
      structure: [],
      tone: "",
      pacing: "",
      format: "",
      summary: raw.slice(0, 300),
      scenes: [
        {
          description: raw.slice(0, 500),
          camera: "",
          onScreenText: "",
          duration: Math.min(10, Math.max(3, durationSec / 2)),
          isProductScene: true,
          voiceover: "",
          role: "hook",
          startAt: 0,
        },
      ],
    };
  }

  const validRoles = ["hook", "demo", "proof", "cta"];
  let cumStart = 0;
  const scenes: SceneAnalysis[] = (parsed.scenes ?? [])
    .slice(0, 5)
    .map((s: Partial<SceneAnalysis>, i: number) => {
      const duration = Math.min(10, Math.max(3, Number(s.duration) || 5));
      const startAt = Number.isFinite(s.startAt) ? Number(s.startAt) : cumStart;
      const scene: SceneAnalysis = {
        description: String(s.description ?? "").slice(0, 800),
        camera: String(s.camera ?? "").slice(0, 200),
        onScreenText: String(s.onScreenText ?? "").slice(0, 300),
        duration,
        isProductScene: Boolean(s.isProductScene),
        voiceover: String(s.voiceover ?? "").slice(0, 500),
        role: validRoles.includes(String(s.role)) ? String(s.role) : i === 0 ? "hook" : "demo",
        startAt,
      };
      cumStart += duration;
      return scene;
    });

  return {
    hook: String(parsed.hook ?? "").slice(0, 500),
    structure: (parsed.structure ?? []).slice(0, 8).map((x) => String(x).slice(0, 60)),
    tone: String(parsed.tone ?? "").slice(0, 120),
    pacing: String(parsed.pacing ?? "").slice(0, 160),
    format: String(parsed.format ?? "").slice(0, 120),
    summary: String(parsed.summary ?? "").slice(0, 500),
    scenes,
  };
}
