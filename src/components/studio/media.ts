"use client";

/**
 * Client-side media utilities — the first stage of the pipeline.
 * Frames + audio are extracted in the browser so we never upload the raw video.
 */

export interface ExtractedMedia {
  frames: string[];
  duration: number;
  audioBase64: string | null;
}

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("video_load_failed"));
  });
}

function seek(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = t;
  });
}

export async function extractFrames(file: File, count = 6): Promise<ExtractedMedia> {
  const video = await loadVideo(file);
  const duration = Math.min(600, Math.max(1, video.duration || 15));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unsupported");

  const vw = video.videoWidth || 720;
  const vh = video.videoHeight || 1280;
  const scale = Math.min(1, 640 / Math.max(vw, vh));
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);

  const frames: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = ((i + 0.5) / count) * duration;
    await seek(video, Math.min(t, duration - 0.05));
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.72));
    } catch {
      // skip tainted frame
    }
  }

  let audioBase64: string | null = null;
  try {
    audioBase64 = await extractAudio(file);
  } catch {
    audioBase64 = null;
  }

  return { frames, duration, audioBase64 };
}

async function extractAudio(file: File, maxSeconds = 60): Promise<string | null> {
  const AudioCtx = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!AudioCtx) return null;

  const arrayBuffer = await file.slice(0, 80 * 1024 * 1024).arrayBuffer();
  const ctx = new AudioCtx();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch {
    await ctx.close();
    return null;
  }

  const sampleRate = audioBuffer.sampleRate;
  const length = Math.min(audioBuffer.length, Math.floor(maxSeconds * sampleRate));
  // mono mixdown
  const mono = new Float32Array(length);
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) mono[i] += data[i] / audioBuffer.numberOfChannels;
  }

  // 16-bit PCM WAV
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const dataSize = length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  await ctx.close();

  // base64
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]);
  }
  return btoa(binary);
}

export async function downscaleImage(file: File, maxDim = 768, quality = 0.82): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => reject(new Error("image_load_failed"));
    image.src = url;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unsupported");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}
