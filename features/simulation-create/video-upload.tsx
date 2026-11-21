"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Loader2, RefreshCw, Sparkles, UploadCloud, X } from "lucide-react";
import type { ContentProfile, VideoAsset } from "@/types";
import { cn, formatBytes, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ACCEPTED_EXTENSIONS, useVideoUpload } from "./use-video-upload";
import { videoAudioCache, videoFrameCache, videoSheetCache } from "./video-probe";

interface VideoUploadProps {
  video: VideoAsset | null;
  profile: ContentProfile | null;
  /** what the creator told us about their audience — sent with the analysis */
  audienceHint: { interests: string[]; ageRange?: [number, number] };
  /** the title the creator will post with — used for the trend check */
  title?: string;
  onChange: (video: VideoAsset | null) => void;
  onProfile: (profile: ContentProfile | null) => void;
  onBusyChange?: (busy: boolean) => void;
}

export function VideoUpload({ video, profile, audienceHint, title = "", onChange, onProfile, onBusyChange }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [stage, setStage] = useState<"listening" | "understanding">("understanding");
  const [checkingTrend, setCheckingTrend] = useState(false);
  const titleRef = useRef(title);
  titleRef.current = title;
  /** transcripts per video id, so re-analysis doesn't re-transcribe */
  const transcripts = useRef(new Map<string, string>());
  const { handleFile, error, busy, progress } = useVideoUpload((v) => {
    onChange(v);
    if (!v || v.uploadStatus !== "ready") onProfile(null);
  });

  useEffect(() => onBusyChange?.(busy || analyzing), [busy, analyzing, onBusyChange]);

  const hintKey = JSON.stringify(audienceHint);
  const runAnalysis = useCallback(
    async (asset: VideoAsset) => {
      if (!asset.metrics) return;
      setAnalyzing(true);
      setAnalyzeError(null);
      try {
        // 1) what's said — speech-to-text (skipped silently if unavailable)
        let transcript = transcripts.current.get(asset.id);
        const wav = videoAudioCache.get(asset.id);
        if (transcript === undefined && wav) {
          setStage("listening");
          try {
            const form = new FormData();
            form.append("file", wav, "audio.wav");
            const tr = await fetch("/api/transcribe", { method: "POST", body: form });
            const tj = (await tr.json()) as { text?: string; available?: boolean; failed?: boolean };
            if (tj.available && !tj.failed) {
              transcript = tj.text ?? "";
              transcripts.current.set(asset.id, transcript);
            }
          } catch {
            /* analysis continues without speech */
          }
        }
        // 2) what's shown + measured
        setStage("understanding");
        const res = await fetch("/api/analyze-video", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            video: { fileName: asset.fileName, duration: asset.duration, mimeType: asset.mimeType },
            metrics: asset.metrics,
            frames: videoFrameCache.get(asset.id) ?? [],
            sheets: videoSheetCache.get(asset.id) ?? [],
            transcript,
            title: titleRef.current.trim() || undefined,
            audience: JSON.parse(hintKey),
          }),
        });
        if (!res.ok) throw new Error("Analysis request failed");
        onProfile((await res.json()) as ContentProfile);
      } catch {
        setAnalyzeError("We couldn't finish checking the video. You can try again, or still run the test.");
      } finally {
        setAnalyzing(false);
      }
    },
    [hintKey, onProfile],
  );

  // Analyse as soon as the video has been measured.
  const lastAnalyzed = useRef<string | null>(null);
  useEffect(() => {
    if (video?.uploadStatus === "ready" && video.metrics && lastAnalyzed.current !== video.id) {
      lastAnalyzed.current = video.id;
      void runAnalysis(video);
    }
  }, [video, runAnalysis]);

  // Measurement-only results depend on the typed interests/age — refresh them (cheap).
  // AI results describe the video itself, so they are not re-requested.
  useEffect(() => {
    if (!video?.metrics || !profile || profile.analyzedBy !== "measured") return;
    const t = setTimeout(() => void runAnalysis(video), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintKey]);

  // Title typed/changed after the analysis: re-check only the trend (cheap, cached).
  const analyzedTitle = useRef<string | null>(null);
  useEffect(() => {
    if (profile && analyzedTitle.current === null) analyzedTitle.current = profile.trend?.title ?? title.trim();
  }, [profile, title]);
  useEffect(() => {
    const t = title.trim();
    if (!profile || analyzing || busy || t === (analyzedTitle.current ?? "")) return;
    const timer = setTimeout(async () => {
      analyzedTitle.current = t;
      if (!t) {
        const { trend: _drop, ...rest } = profile;
        onProfile(rest);
        return;
      }
      setCheckingTrend(true);
      try {
        const res = await fetch("/api/trend", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: t }),
        });
        const { trend } = (await res.json()) as { trend: ContentProfile["trend"] | null };
        onProfile(trend ? { ...profile, trend } : profile);
      } catch {
        /* keep the current profile */
      } finally {
        setCheckingTrend(false);
      }
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, profile, analyzing, busy]);

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {!video ? (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-strong bg-subtle px-6 py-12 text-center transition-colors hover:border-foreground/30 hover:bg-foreground/[0.03]",
            dragging && "border-foreground/50 bg-foreground/[0.05]",
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card">
            <UploadCloud className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Drag your video here, or click to choose one</p>
            <p className="text-2xs text-muted-foreground">MP4, MOV or WebM · up to 300 MB</p>
          </div>
        </button>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex gap-3">
            <div className="relative h-[72px] w-[128px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Film className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm">{video.fileName}</p>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openPicker} title="Choose another video">
                    <RefreshCw />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      onChange(null);
                      onProfile(null);
                      lastAnalyzed.current = null;
                    }}
                    title="Remove"
                  >
                    <X />
                  </Button>
                </div>
              </div>
              <p className="tabular mt-0.5 text-xs text-muted-foreground">
                {formatBytes(video.fileSize)} · {video.duration ? formatDuration(video.duration) : "—"}
                {video.metrics ? ` · ${video.metrics.orientation}` : ""}
              </p>

              {busy ? (
                <Status label={`Watching your video… ${Math.round(progress * 100)}%`} progress={progress} />
              ) : analyzing ? (
                <Status
                  label={
                    stage === "listening"
                      ? "Listening to what's said…"
                      : title.trim()
                        ? "Checking the trend and understanding the video…"
                        : "Understanding what it's about…"
                  }
                />
              ) : profile ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-positive">
                  <Sparkles className="h-3 w-3" />
                  {profile.analyzedBy.startsWith("vision") ? "AI watched your video" : "Measured from your video"}
                </p>
              ) : null}
            </div>
          </div>

          {profile && !busy && !analyzing && <ProfileSummary profile={profile} checkingTrend={checkingTrend} />}
        </div>
      )}

      {(error || analyzeError) && (
        <div className="flex items-center gap-3 text-xs text-destructive">
          <span>{error ?? analyzeError}</span>
          {analyzeError && video && (
            <button className="underline" onClick={() => void runAnalysis(video)}>
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Status({ label, progress }: { label: string; progress?: number }) {
  return (
    <div className="mt-2 space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {label}
      </p>
      {progress !== undefined && (
        <div className="h-[3px] overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground/60 transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function ProfileSummary({ profile, checkingTrend }: { profile: ContentProfile; checkingTrend?: boolean }) {
  const s = profile.signals;
  const rows: [string, number][] = [
    ["Grabs attention", s.hookStrength],
    ["Keeps people watching", profile.estimatedWatchThrough],
    ["Worth sharing", s.shareability],
    ["Looks good", profile.visualQuality],
  ];
  const vision = profile.analyzedBy.startsWith("vision");
  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      {vision && <p className="text-sm leading-relaxed text-foreground/90">{profile.summary}</p>}
      {profile.transcript && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="text-foreground">We heard: </span>“{profile.transcript.slice(0, 160)}
          {profile.transcript.length > 160 ? "…" : ""}”
        </p>
      )}
      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, v]) => (
          <div key={label}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="tabular text-foreground">{Math.round(v * 10)}/10</span>
            </div>
            <div className="h-[3px] overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground/60" style={{ width: `${v * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      {checkingTrend ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking if this topic is trending…
        </p>
      ) : (
        profile.trend && <TrendLine trend={profile.trend} />
      )}
      {profile.audience && profile.audience.interests.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">Made for people into</span>
          {profile.audience.interests.slice(0, 5).map((i) => (
            <span key={i} className="rounded-full border border-border px-2.5 py-0.5 text-xs">
              {i}
            </span>
          ))}
        </div>
      )}
      {!vision && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          We measured the opening, pace, length, picture and sound. To also understand what the video is about
          (topic, humour, usefulness), add an AI key (Groq or Anthropic) in your .env.local file.
        </p>
      )}
    </div>
  );
}

const TREND_WORD: Record<string, string> = {
  rising: "Trending now",
  peak: "At its peak",
  declining: "Fading trend",
  evergreen: "Always popular",
  not_trending: "Not trending",
  unknown: "Trend unclear",
};

function TrendLine({ trend }: { trend: NonNullable<ContentProfile["trend"]> }) {
  const hot = trend.status === "rising" || trend.status === "peak";
  return (
    <div className="rounded-xl border border-border bg-subtle/60 px-3.5 py-3">
      <p className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em]",
            hot ? "border-clay/40 bg-clay/10 text-clay" : "border-border text-muted-foreground",
          )}
        >
          {TREND_WORD[trend.status] ?? "Trend"}
        </span>
        <span className="text-foreground">{trend.trendName}</span>
      </p>
      {trend.region && <p className="mt-1 text-[11px] text-muted-foreground">Where: {trend.region}</p>}
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{trend.summary}</p>
    </div>
  );
}
