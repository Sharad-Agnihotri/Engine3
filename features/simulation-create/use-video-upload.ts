"use client";

import { useCallback, useState } from "react";
import type { VideoAsset, VideoMimeType } from "@/types";
import { probeVideo, videoAudioCache, videoFrameCache, videoSheetCache } from "./video-probe";

const ACCEPTED: Record<string, VideoMimeType> = {
  "video/mp4": "video/mp4",
  "video/quicktime": "video/quicktime",
  "video/webm": "video/webm",
};

export const ACCEPTED_EXTENSIONS = ".mp4,.mov,.webm";
export const MAX_SIZE_BYTES = 300 * 1024 * 1024;

export function useVideoUpload(onChange: (asset: VideoAsset | null) => void) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      setError(null);
      if (!file) return;

      const mime = ACCEPTED[file.type];
      const extOk = /\.(mp4|mov|webm)$/i.test(file.name);
      if (!mime && !extOk) {
        setError("This file type isn't supported. Please use MP4, MOV or WebM.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError("This file is bigger than 300 MB.");
        return;
      }

      const base: VideoAsset = {
        id: `vid_${Math.random().toString(36).slice(2, 10)}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: mime ?? "video/mp4",
        duration: 0,
        thumbnailUrl: null,
        uploadStatus: "uploading",
        createdAt: new Date().toISOString(),
      };
      onChange(base);
      setBusy(true);
      setProgress(0);

      try {
        const probe = await probeVideo(file, setProgress);
        videoFrameCache.set(base.id, probe.frames);
        videoSheetCache.set(base.id, probe.sheets);
        if (probe.audioWav) videoAudioCache.set(base.id, probe.audioWav);
        onChange({
          ...base,
          duration: probe.duration,
          thumbnailUrl: probe.thumbnailUrl,
          metrics: probe.metrics,
          uploadStatus: "ready",
        });
      } catch (err) {
        onChange({
          ...base,
          uploadStatus: "error",
          uploadError: err instanceof Error ? err.message : "Upload failed",
        });
        setError("We couldn't read this video. Try exporting it again as MP4.");
      } finally {
        setBusy(false);
      }
    },
    [onChange],
  );

  return { handleFile, error, busy, progress };
}
