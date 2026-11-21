"use client";

import { Bot, Loader2, Pause, Play, RotateCcw, Square } from "lucide-react";
import type { PlaybackSpeed, PlaybackState, Simulation } from "@/types";
import type { BatchProgress } from "@/lib/agents/agent-batch-executor";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusDot } from "@/components/common/status-dot";

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 5];
const BUILD_STATES = new Set(["analyzing", "populating", "networking", "seeding"]);

interface StatusBarProps {
  simulation: Simulation;
  playback: PlaybackState;
  agentProgress: BatchProgress | null;
  onStart: () => void;
  onCancel: () => void;
  onReplay: () => void;
  onPlay: () => void;
  onPause: () => void;
  onSpeed: (speed: PlaybackSpeed) => void;
}

export function SimulationStatusBar({
  simulation,
  playback,
  agentProgress,
  onStart,
  onCancel,
  onReplay,
  onPlay,
  onPause,
  onSpeed,
}: StatusBarProps) {
  const { phase, status } = simulation;
  const hasFramesEarly = playback.maxRound > 0;
  const building = BUILD_STATES.has(status) || (status === "running" && !hasFramesEarly);
  const playing = status === "running" && hasFramesEarly;
  const complete = status === "complete";
  const cancelled = status === "cancelled";
  const errored = status === "error";
  const canStart = status === "draft" || errored;
  const hasFrames = playback.maxRound > 0;

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-subtle px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <StatusDot status={status} showLabel={false} />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{phase.message}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-muted-foreground">
              <span>{simulation.audience.audienceSize.toLocaleString()} audience</span>
              <span>·</span>
              <span>{simulation.config.rounds} max rounds</span>
              <span>·</span>
              <span>{simulation.config.seedCount} seeds</span>
              <span>·</span>
              <span>seed {simulation.config.randomSeed}</span>
              {simulation.contentProfile && (
                <>
                  <span>·</span>
                  <span className="capitalize">
                    {simulation.contentProfile.contentType.replace(/_/g, " ")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {canStart && (
            <Button size="sm" onClick={onStart}>
              <Play className="h-3 w-3" />
              Run simulation
            </Button>
          )}

          {building && (
            <>
              {agentProgress && (
                <span className="tabular flex items-center gap-1 text-2xs text-muted-foreground">
                  <Bot className="h-3 w-3" />
                  {agentProgress.completed}/{agentProgress.total}
                  {agentProgress.fallbacks > 0 && ` · ${agentProgress.fallbacks} fallback`}
                </span>
              )}
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <Button size="sm" variant="ghost" onClick={onCancel}>
                <Square className="h-3 w-3" />
                Cancel
              </Button>
            </>
          )}

          {(playing || complete || cancelled) && hasFrames && (
            <>
              <SpeedControl speed={playback.speed} onSpeed={onSpeed} />
              {playing && !playback.finished && playback.playing && (
                <Button size="sm" variant="outline" onClick={onPause}>
                  <Pause className="h-3 w-3" />
                  Pause
                </Button>
              )}
              {playing && !playback.finished && !playback.playing && (
                <Button size="sm" variant="outline" onClick={onPlay}>
                  <Play className="h-3 w-3" />
                  Resume
                </Button>
              )}
              <Button size="sm" variant={complete ? "outline" : "ghost"} onClick={onReplay}>
                <RotateCcw className="h-3 w-3" />
                Replay
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress
          value={Math.round(phase.progress * 100)}
          className={cn(
            "flex-1",
            cancelled && "[&>div]:bg-caution",
            errored && "[&>div]:bg-destructive",
          )}
        />
        {hasFrames && (
          <span className="tabular shrink-0 text-2xs text-muted-foreground">
            {playback.finished ? playback.maxRound : playback.round} / {playback.maxRound}
          </span>
        )}
        {building && agentProgress && agentProgress.total > 0 && (
          <span className="tabular shrink-0 text-2xs text-muted-foreground">
            {Math.round((agentProgress.completed / agentProgress.total) * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}

function SpeedControl({
  speed,
  onSpeed,
}: {
  speed: PlaybackSpeed;
  onSpeed: (s: PlaybackSpeed) => void;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-border">
      {SPEEDS.map((s) => (
        <button
          key={s}
          onClick={() => onSpeed(s)}
          className={cn(
            "px-1.5 py-1 text-2xs font-medium tabular transition-colors",
            s === speed
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}
