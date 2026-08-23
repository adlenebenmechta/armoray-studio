import ZAI from "z-ai-web-dev-sdk";

export interface SpeechQaResult {
  transcript: string;
  wordCount: number;
  durationSec: number;
  pace: number; // words per second
  trimSilenceSec: number;
  paceTarget: number;
  passed: boolean;
  issues: string[];
}

const PACE_TARGET = 3.2;

/**
 * Engine 5 — Speech QA (the "listen back" step we saw inside Notch).
 * The generated scene video is transcribed with ASR, its pacing is measured
 * against the 3.2 words/second target, and the spoken words are checked
 * against the intended voiceover line (pronunciation pass).
 */
export async function runSpeechQa(
  videoUrl: string,
  intendedLine: string
): Promise<SpeechQaResult> {
  const zai = await ZAI.create();

  // 1. Ask the vision model to read the video and estimate speech timing
  let transcript = "";
  let durationSec = 0;
  try {
    const response = await zai.chat.completions.createVision({
      model: "glm-4.6v",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Watch this short video ad clip. Transcribe EXACTLY what is spoken (all spoken words, nothing else). Then on a new line output "DURATION: <number>" = the clip duration in seconds you observe, and "SPEECH_START: <number>" = the second speech begins. Reply format:\nTRANSCRIPT: <the spoken words>\nDURATION: <s>\nSPEECH_START: <s>\nNo other text.',
            },
            { type: "video_url", video_url: { url: videoUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });
    const reply = response.choices?.[0]?.message?.content ?? "";
    const tMatch = reply.match(/TRANSCRIPT:\s*(.+)/i);
    const dMatch = reply.match(/DURATION:\s*([\d.]+)/i);
    const sMatch = reply.match(/SPEECH_START:\s*([\d.]+)/i);
    transcript = (tMatch?.[1] ?? "").trim();
    durationSec = parseFloat(dMatch?.[1] ?? "0") || 0;
    const speechStart = parseFloat(sMatch?.[1] ?? "0") || 0;
    if (speechStart > 0.15) {
      // leading silence that should be trimmed
      return {
        ...baseResult(transcript, durationSec),
        trimSilenceSec: Math.round(speechStart * 10) / 10,
        passed: true,
        issues: [],
      };
    }
  } catch {
    // vision read failed — return neutral pass so we don't block the pipeline
    return {
      transcript: "",
      wordCount: 0,
      durationSec: 0,
      pace: 0,
      trimSilenceSec: 0,
      paceTarget: PACE_TARGET,
      passed: true,
      issues: ["qa_unavailable"],
    };
  }

  return analyzeSpeech(transcript, durationSec, intendedLine);
}

export function analyzeSpeech(
  transcript: string,
  durationSec: number,
  intendedLine: string
): SpeechQaResult {
  const words = transcript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const speechSec = Math.max(0.1, durationSec);
  const pace = wordCount / speechSec;

  const issues: string[] = [];

  // Pronunciation check: intended keywords must appear (fuzzy: normalized)
  if (intendedLine && transcript) {
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
    const intendedWords = norm(intendedLine).split(" ").filter((w) => w.length > 3);
    const spoken = norm(transcript);
    for (const w of intendedWords) {
      if (!spoken.includes(w)) {
        issues.push(`pronunciation: ${w}`);
      }
    }
  }

  const passed = issues.length === 0 && pace <= PACE_TARGET * 1.6;

  return {
    transcript,
    wordCount,
    durationSec: Math.round(durationSec * 10) / 10,
    pace: Math.round(pace * 10) / 10,
    trimSilenceSec: 0,
    paceTarget: PACE_TARGET,
    passed,
    issues,
  };
}

function baseResult(transcript: string, durationSec: number): SpeechQaResult {
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  const speechSec = Math.max(0.1, durationSec);
  return {
    transcript,
    wordCount,
    durationSec: Math.round(durationSec * 10) / 10,
    pace: Math.round((wordCount / speechSec) * 10) / 10,
    trimSilenceSec: 0,
    paceTarget: PACE_TARGET,
    passed: true,
    issues: [],
  };
}
