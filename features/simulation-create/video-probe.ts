"use client";

import type { VideoMetrics } from "@/types";

/**
 * Measures an uploaded video in the browser, from the actual pixels and audio.
 *
 *  - dense sampling of the first 3 seconds (the hook window)
 *  - paired samples across the rest of the video (t and t+0.2s) to estimate
 *    motion and cut frequency without decoding every frame
 *  - ~12 representative frames (JPEG) for the AI viewer, when one is configured
 *  - audio loudness / activity from the decoded soundtrack (small files only)
 */

export interface ProbeFrame {
  /** seconds */
  t: number;
  dataUrl: string;
  /** what the image shows, for the AI viewer (contact sheets) */
  label?: string;
}

export interface ProbeResult {
  duration: number;
  thumbnailUrl: string | null;
  metrics: VideoMetrics;
  frames: ProbeFrame[];
  /** frames combined into ≤2 labelled contact sheets (for models with image limits) */
  sheets: ProbeFrame[];
  /** 16 kHz mono WAV of the first minutes of audio, for speech-to-text */
  audioWav: Blob | null;
}

/** Media is kept in memory only (too large for local storage). */
export const videoFrameCache = new Map<string, ProbeFrame[]>();
export const videoSheetCache = new Map<string, ProbeFrame[]>();
export const videoAudioCache = new Map<string, Blob>();

/** speech-to-text input cap: the first 3 minutes */
const TRANSCRIBE_MAX_SECONDS = 180;

const SMALL_W = 64;
const HIST_BINS = 16;
const CUT_THRESHOLD = 0.38;
const AUDIO_MAX_BYTES = 80 * 1024 * 1024;

interface FrameStats {
  luma: Float32Array;
  hist: Float32Array;
  brightness: number;
  contrast: number;
  colorfulness: number;
}

function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    v.onloadeddata = () => resolve(v);
    v.onerror = () => reject(new Error("Could not read this video."));
  });
}

/**
 * Some files (notably WebM from browsers / screen recorders) carry no duration
 * header, so the element reports Infinity. Seeking far past the end forces the
 * browser to scan the file and report the real length.
 */
async function resolveDuration(v: HTMLVideoElement): Promise<number> {
  if (Number.isFinite(v.duration) && v.duration > 0) return v.duration;
  await new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      v.removeEventListener("durationchange", onChange);
      resolve();
    };
    const onChange = () => {
      if (Number.isFinite(v.duration)) done();
    };
    const timer = setTimeout(done, 8000);
    v.addEventListener("durationchange", onChange);
    v.currentTime = 1e7;
  });
  const d = Number.isFinite(v.duration) ? v.duration : 0;
  v.currentTime = 0;
  await new Promise((r) => setTimeout(r, 50));
  return d;
}

function seek(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const target = Math.max(0, Math.min(t, Math.max(0, v.duration - 0.05)));
    if (Math.abs(v.currentTime - target) < 0.01 && v.readyState >= 2) return resolve();
    const done = () => {
      clearTimeout(timer);
      v.removeEventListener("seeked", done);
      resolve();
    };
    const timer = setTimeout(done, 2500);
    v.addEventListener("seeked", done);
    v.currentTime = target;
  });
}

function statsOf(ctx: CanvasRenderingContext2D, w: number, h: number): FrameStats {
  const { data } = ctx.getImageData(0, 0, w, h);
  const n = w * h;
  const luma = new Float32Array(n);
  const hist = new Float32Array(HIST_BINS);
  let sum = 0;
  let sumSq = 0;
  let rgSum = 0;
  let ybSum = 0;
  let rgSq = 0;
  let ybSq = 0;
  for (let i = 0; i < n; i++) {
    const r = data[i * 4]!;
    const g = data[i * 4 + 1]!;
    const b = data[i * 4 + 2]!;
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    luma[i] = y;
    sum += y;
    sumSq += y * y;
    hist[Math.min(HIST_BINS - 1, Math.floor((y / 256) * HIST_BINS))]! += 1;
    // Hasler & Süsstrunk colourfulness
    const rg = r - g;
    const yb = 0.5 * (r + g) - b;
    rgSum += rg;
    ybSum += yb;
    rgSq += rg * rg;
    ybSq += yb * yb;
  }
  for (let i = 0; i < HIST_BINS; i++) hist[i]! /= n;
  const mean = sum / n;
  const std = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  const rgMean = rgSum / n;
  const ybMean = ybSum / n;
  const rgStd = Math.sqrt(Math.max(0, rgSq / n - rgMean * rgMean));
  const ybStd = Math.sqrt(Math.max(0, ybSq / n - ybMean * ybMean));
  const colorful =
    Math.sqrt(rgStd ** 2 + ybStd ** 2) + 0.3 * Math.sqrt(rgMean ** 2 + ybMean ** 2);
  return {
    luma,
    hist,
    brightness: mean / 255,
    contrast: Math.min(1, std / 80),
    colorfulness: Math.min(1, colorful / 110),
  };
}

/** mean absolute pixel change, 0..1 */
function pixelDiff(a: FrameStats, b: FrameStats): number {
  let d = 0;
  for (let i = 0; i < a.luma.length; i++) d += Math.abs(a.luma[i]! - b.luma[i]!);
  return Math.min(1, d / a.luma.length / 64);
}

/** histogram distance, 0..1 — robust indicator of a hard cut */
function histDiff(a: FrameStats, b: FrameStats): number {
  let d = 0;
  for (let i = 0; i < HIST_BINS; i++) d += Math.abs(a.hist[i]! - b.hist[i]!);
  return d / 2;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const str = (o: number, t: string) => [...t].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const x = Math.max(-1, Math.min(1, samples[i]!));
    view.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** Resample decoded audio to 16 kHz mono (what speech models expect). */
async function toSpeechWav(buf: AudioBuffer): Promise<Blob | null> {
  if (typeof OfflineAudioContext === "undefined") return null;
  const seconds = Math.min(buf.duration, TRANSCRIBE_MAX_SECONDS);
  if (seconds < 0.5) return null;
  const rate = 16_000;
  const off = new OfflineAudioContext(1, Math.ceil(seconds * rate), rate);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start(0, 0, seconds);
  const rendered = await off.startRendering();
  return encodeWav(rendered.getChannelData(0), rate);
}

let lastSpeechWav: Blob | null = null;

async function measureAudio(file: File): Promise<VideoMetrics["audio"]> {
  lastSpeechWav = null;
  if (file.size > AUDIO_MAX_BYTES || typeof window.AudioContext === "undefined") return null;
  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioContext();
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    try {
      lastSpeechWav = await toSpeechWav(buf);
    } catch {
      lastSpeechWav = null;
    }
    const ch = buf.getChannelData(0);
    const win = Math.max(1, Math.floor(buf.sampleRate * 0.05));
    let windows = 0;
    let active = 0;
    let rmsSum = 0;
    for (let i = 0; i + win <= ch.length; i += win) {
      let s = 0;
      for (let j = i; j < i + win; j++) s += ch[j]! * ch[j]!;
      const rms = Math.sqrt(s / win);
      rmsSum += rms;
      if (rms > 0.02) active++;
      windows++;
    }
    if (windows === 0) return { present: false, loudness: 0, activeRatio: 0 };
    const activeRatio = active / windows;
    return {
      present: activeRatio > 0.05,
      loudness: Math.min(1, (rmsSum / windows) * 5),
      activeRatio,
    };
  } catch {
    // Most commonly: the file has no audio track. We can't tell that apart from
    // an unsupported codec, so report "unknown" rather than guessing.
    return null;
  } finally {
    void ctx?.close();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("frame decode failed"));
    img.src = src;
  });
}

/** Draw frames into one labelled grid image. */
async function contactSheet(frames: ProbeFrame[], cols: number, cellLong: number): Promise<string> {
  const imgs = await Promise.all(frames.map((f) => loadImage(f.dataUrl)));
  const ar = imgs[0]!.naturalWidth / imgs[0]!.naturalHeight;
  const cw = Math.round(ar >= 1 ? cellLong : cellLong * ar);
  const ch = Math.round(ar >= 1 ? cellLong / ar : cellLong);
  const rows = Math.ceil(frames.length / cols);
  const gap = 6;
  const c = document.createElement("canvas");
  c.width = cols * cw + (cols - 1) * gap;
  c.height = rows * ch + (rows - 1) * gap;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  imgs.forEach((img, i) => {
    const x = (i % cols) * (cw + gap);
    const y = Math.floor(i / cols) * (ch + gap);
    ctx.drawImage(img, x, y, cw, ch);
    const label = `${frames[i]!.t.toFixed(1)}s`;
    ctx.font = "bold 18px sans-serif";
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(x + 6, y + 6, tw + 12, 26);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, x + 12, y + 25);
  });
  return c.toDataURL("image/jpeg", 0.78);
}

/** ≤2 images: the opening (first 3 s) and a grid of the rest, in time order. */
export async function buildSheets(frames: ProbeFrame[]): Promise<ProbeFrame[]> {
  const sorted = [...frames].sort((a, b) => a.t - b.t);
  const opening = sorted.filter((f) => f.t <= 3).slice(0, 3);
  const rest = sorted.filter((f) => !opening.includes(f)).slice(0, 9);
  const out: ProbeFrame[] = [];
  if (opening.length) {
    out.push({
      t: 0,
      dataUrl: await contactSheet(opening, opening.length, 420),
      label: `The opening: frames at ${opening.map((f) => f.t.toFixed(1) + "s").join(", ")}, left to right.`,
    });
  }
  if (rest.length) {
    out.push({
      t: rest[0]!.t,
      dataUrl: await contactSheet(rest, Math.min(3, rest.length), 300),
      label: `The rest of the video: ${rest.length} frames in reading order (left to right, top to bottom), from ${rest[0]!.t.toFixed(1)}s to ${rest[rest.length - 1]!.t.toFixed(1)}s. Each frame is labelled with its time.`,
    });
  }
  return out;
}

export async function probeVideo(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<ProbeResult> {
  const url = URL.createObjectURL(file);
  try {
    const v = await loadVideo(url);
    const duration = await resolveDuration(v);
    const vw = v.videoWidth || 640;
    const vh = v.videoHeight || 360;
    const ratio = vw / vh;
    const orientation: VideoMetrics["orientation"] =
      ratio < 0.9 ? "vertical" : ratio > 1.1 ? "horizontal" : "square";

    const small = document.createElement("canvas");
    small.width = SMALL_W;
    small.height = Math.max(8, Math.round((SMALL_W * vh) / vw));
    const sctx = small.getContext("2d", { willReadFrequently: true })!;
    const grab = async (t: number) => {
      await seek(v, t);
      sctx.drawImage(v, 0, 0, small.width, small.height);
      return statsOf(sctx, small.width, small.height);
    };

    // ---- plan the samples --------------------------------------------
    const hookEnd = Math.min(3, duration);
    const hookTimes: number[] = [];
    for (let t = 0; t <= hookEnd + 1e-6; t += 0.25) hookTimes.push(Number(t.toFixed(2)));
    const restStart = hookEnd;
    const pairCount =
      duration > restStart + 0.5 ? Math.max(6, Math.min(36, Math.round((duration - restStart) * 1.2))) : 0;
    const pairTimes: number[] = [];
    for (let i = 0; i < pairCount; i++) {
      pairTimes.push(restStart + ((i + 0.5) / pairCount) * (duration - restStart - 0.25));
    }
    const total = hookTimes.length + pairTimes.length * 2 + 12;
    let done = 0;
    const tick = () => onProgress?.(Math.min(0.97, ++done / total));

    // ---- hook window: dense ------------------------------------------
    const hook: FrameStats[] = [];
    for (const t of hookTimes) {
      hook.push(await grab(t));
      tick();
    }

    let denseSeconds = 0;
    let cuts = 0;
    let firstCutAt = duration;
    const motions: number[] = [];
    const hookMotions: number[] = [];
    for (let i = 1; i < hook.length; i++) {
      const m = pixelDiff(hook[i - 1]!, hook[i]!);
      hookMotions.push(m);
      motions.push(m);
      denseSeconds += hookTimes[i]! - hookTimes[i - 1]!;
      if (histDiff(hook[i - 1]!, hook[i]!) > CUT_THRESHOLD) {
        cuts++;
        firstCutAt = Math.min(firstCutAt, hookTimes[i]!);
      }
    }

    // ---- the rest: paired samples ------------------------------------
    const all: FrameStats[] = [...hook];
    for (const t of pairTimes) {
      const a = await grab(t);
      tick();
      const b = await grab(t + 0.2);
      tick();
      all.push(a);
      motions.push(pixelDiff(a, b));
      denseSeconds += 0.2;
      if (histDiff(a, b) > CUT_THRESHOLD) {
        cuts++;
        firstCutAt = Math.min(firstCutAt, t);
      }
    }

    const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
    const openingChange =
      hook.length > 1 ? Math.max(histDiff(hook[0]!, hook[hook.length - 1]!), pixelDiff(hook[0]!, hook[hook.length - 1]!)) : 0;

    // ---- representative frames for the AI viewer ----------------------
    const big = document.createElement("canvas");
    const scale = Math.min(1, 512 / Math.max(vw, vh));
    big.width = Math.round(vw * scale);
    big.height = Math.round(vh * scale);
    const bctx = big.getContext("2d")!;
    const frameTimes = [0, Math.min(1, duration * 0.1), Math.min(2.5, duration * 0.2)];
    const remaining = 12 - frameTimes.length;
    for (let i = 0; i < remaining; i++) {
      frameTimes.push(Math.min(duration - 0.1, 3 + ((i + 0.5) / remaining) * Math.max(0, duration - 3)));
    }
    const frames: ProbeFrame[] = [];
    const seen = new Set<number>();
    for (const raw of frameTimes) {
      const t = Math.max(0, Number(raw.toFixed(1)));
      if (seen.has(t)) {
        tick();
        continue;
      }
      seen.add(t);
      await seek(v, t);
      bctx.drawImage(v, 0, 0, big.width, big.height);
      frames.push({ t, dataUrl: big.toDataURL("image/jpeg", 0.72) });
      tick();
    }

    // poster thumbnail (≈1s in, like before)
    const thumb = document.createElement("canvas");
    thumb.width = 240;
    thumb.height = Math.round((240 * vh) / vw);
    await seek(v, Math.min(1, duration / 2 || 0));
    thumb.getContext("2d")!.drawImage(v, 0, 0, thumb.width, thumb.height);
    const thumbnailUrl = thumb.toDataURL("image/jpeg", 0.6);

    const audio = await measureAudio(file);
    const audioWav = audio?.present ? lastSpeechWav : null;
    let sheets: ProbeFrame[] = [];
    try {
      sheets = await buildSheets(frames);
    } catch {
      sheets = [];
    }
    onProgress?.(1);

    const metrics: VideoMetrics = {
      width: vw,
      height: vh,
      orientation,
      duration,
      sampledFrames: all.length + pairTimes.length,
      cutsPerMinute: denseSeconds > 0 ? (cuts / denseSeconds) * 60 : 0,
      firstCutAt,
      motion: mean(motions),
      hookMotion: mean(hookMotions),
      openingChange,
      brightness: mean(all.map((f) => f.brightness)),
      contrast: mean(all.map((f) => f.contrast)),
      colorfulness: mean(all.map((f) => f.colorfulness)),
      audio,
    };
    return { duration, thumbnailUrl, metrics, frames, sheets, audioWav };
  } finally {
    URL.revokeObjectURL(url);
  }
}
