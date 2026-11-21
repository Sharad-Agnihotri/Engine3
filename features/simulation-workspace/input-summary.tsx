"use client";

import type { Simulation } from "@/types";
import { cn, formatDuration, formatPct } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PERSONA_DIMENSIONS } from "@/lib/simulation/constants";
import {
  CONTENT_SIGNAL_KEYS,
  CONTENT_SIGNAL_LABELS,
} from "@/lib/simulation/estimation/content-signals";

export function InputSummary({ simulation }: { simulation: Simulation }) {
  const { video, contentProfile, audience, config } = simulation;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Content profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {video ? (
            <>
              <Row k="File" v={video.fileName} />
              <Row k="Duration" v={video.duration ? formatDuration(video.duration) : "—"} />
              <Row k="Format" v={video.mimeType} />
            </>
          ) : (
            <p className="text-muted-foreground">
              No video attached. The analyzer profiled the content from the target description.
            </p>
          )}

          {contentProfile ? (
            <div className="space-y-2 border-t border-border pt-2">
              <p className="text-foreground">{contentProfile.summary}</p>
              <p className="text-2xs text-muted-foreground">
                <span className="font-medium text-foreground">Hook:</span> {contentProfile.hook}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 sm:grid-cols-3">
                <Row k="Type" v={contentProfile.contentType.replace(/_/g, " ")} />
                <Row k="Tone" v={contentProfile.tone} />
                <Row k="Category" v={contentProfile.productCategory ?? "—"} />
                <Row k="Technical complexity" v={formatPct(contentProfile.technicalComplexity)} />
                <Row k="Novelty" v={formatPct(contentProfile.novelty)} />
                <Row k="Utility" v={formatPct(contentProfile.utility)} />
                <Row k="Credibility" v={formatPct(contentProfile.credibility)} />
                <Row k="Emotional intensity" v={formatPct(contentProfile.emotionalIntensity)} />
                <Row k="Visual quality" v={formatPct(contentProfile.visualQuality)} />
                <Row k="Call to action" v={formatPct(contentProfile.callToAction)} />
                <Row k="Est. watch-through" v={formatPct(contentProfile.estimatedWatchThrough)} />
                <Row k="Analyzed by" v={contentProfile.analyzedBy} />
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {contentProfile.topics.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>

              {contentProfile.signals && (
                <div className="space-y-1 border-t border-border pt-2">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Behavioural signals (Layer 1) — drive the response &amp; diffusion models
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                    {CONTENT_SIGNAL_KEYS.map((k) => {
                      const v = contentProfile.signals[k];
                      return (
                        <div key={k} className="flex items-center justify-between gap-2">
                          <span className="truncate text-2xs text-muted-foreground">
                            {CONTENT_SIGNAL_LABELS[k]}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="h-1 w-10 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  k === "shareability" || k === "broadAppeal"
                                    ? "bg-primary"
                                    : "bg-muted-foreground/60",
                                )}
                                style={{ width: `${Math.round(v * 100)}%` }}
                              />
                            </div>
                            <span className="tabular w-7 text-right text-2xs font-medium">
                              {Math.round(v * 100)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {contentProfile.targetAudienceSignals.length > 0 && (
                <p className="text-2xs text-muted-foreground">
                  <span className="font-medium text-foreground">Audience signals:</span>{" "}
                  {contentProfile.targetAudienceSignals.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <p className="border-t border-border pt-2 text-muted-foreground">
              Content is profiled when the simulation runs.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target demographic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="text-foreground">{audience.targetDescription}</p>
          <Row k="Audience size" v={audience.audienceSize.toLocaleString()} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-border pt-2">
            {PERSONA_DIMENSIONS.map((d) => (
              <Row key={d.key} k={d.label} v={formatPct(audience.dimensionWeights[d.key])} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulation configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
          <Row k="Seeds" v={String(config.seedCount)} />
          <Row k="Max rounds" v={String(config.rounds)} />
          <Row k="Random seed" v={String(config.randomSeed)} />
          <Row k="Network density" v={formatPct(config.networkDensity)} />
          <Row k="Content quality" v={formatPct(config.contentQuality)} />
          <Row k="Audience relevance" v={formatPct(config.audienceRelevance)} />
          <Row k="Initial engagement" v={formatPct(config.initialEngagementProbability)} />
          <Row k="Share prob." v={formatPct(config.shareProbability)} />
          <Row k="Comment prob." v={formatPct(config.commentProbability)} />
          <Row k="Like prob." v={formatPct(config.likeProbability)} />
          <Row k="Ignore prob." v={formatPct(config.ignoreProbability)} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-0.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium capitalize tabular">{v}</span>
    </div>
  );
}
