"use client";

import { MousePointerClick, X } from "lucide-react";
import type { DecisionFactors, Persona } from "@/types";
import { cn, formatPct, titleCase } from "@/lib/utils";
import { ARCHETYPES } from "@/lib/simulation/archetypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/common/states";

const ACTION_VARIANT: Record<
  string,
  "default" | "primary" | "success" | "warning" | "outline"
> = {
  like: "primary",
  save: "primary",
  follow: "primary",
  share: "success",
  comment: "warning",
  watch: "outline",
  ignore: "outline",
  seed: "default",
};

const FACTOR_LABELS: { key: keyof DecisionFactors; label: string; weight: number }[] = [
  { key: "audienceFit", label: "Audience fit", weight: 0.25 },
  { key: "interestMatch", label: "Interest match", weight: 0.2 },
  { key: "contentAffinity", label: "Content affinity", weight: 0.15 },
  { key: "contentUtility", label: "Content utility", weight: 0.15 },
  { key: "novelty", label: "Novelty", weight: 0.1 },
  { key: "socialActivity", label: "Social activity", weight: 0.1 },
  { key: "relationshipStrength", label: "Relationship strength", weight: 0.05 },
];

export function PersonaInspector({
  persona,
  personasById,
  onClose,
}: {
  persona: Persona | null;
  personasById: Map<string, Persona>;
  onClose: () => void;
}) {
  if (!persona) {
    return (
      <EmptyState
        icon={MousePointerClick}
        title="No persona selected"
        description="Click any node in the network to inspect that persona's profile, decision factors and reaction."
        className="h-full border-0 bg-transparent"
      />
    );
  }

  const archetype = ARCHETYPES[persona.archetype];
  const lastEvent = [...persona.engagementHistory]
    .reverse()
    .find((e) => e.action !== "exposed");
  const factors = lastEvent?.factors ?? null;
  const source = lastEvent?.sourcePersonaId
    ? personasById.get(lastEvent.sourcePersonaId)
    : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[13px] font-semibold uppercase tracking-wide">
              {persona.name}
            </h3>
            {persona.isSeed && <Badge variant="default">Seed</Badge>}
          </div>
          <p className="mt-0.5 text-2xs text-muted-foreground">
            {archetype.label} · {persona.isTarget ? "in-target" : "out-of-target"} ·{" "}
            {titleCase(persona.currentState)}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 px-4 py-3">
          <p className="text-2xs italic text-muted-foreground">{archetype.description}</p>

          <Row label="Location" value={persona.location} />
          <Row label="Profession" value={persona.profession} />
          <Row label="Age" value={String(persona.age)} />
          <div className="space-y-1">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-1">
              {persona.interests.map((i) => (
                <Badge key={i} variant="outline">
                  {i}
                </Badge>
              ))}
            </div>
          </div>

          <Section title="Traits">
            <Meter label="Technical level" value={persona.technicalLevel} />
            <Meter label="Social activity" value={persona.socialActivity} />
            <Meter label="Influence score" value={persona.influenceScore} />
            <Meter label="Skepticism" value={persona.skepticism} />
            <Meter label="Audience fit" value={persona.audienceFit} />
            <Meter label="Content affinity" value={persona.contentAffinity} />
          </Section>

          <Section title="Reaction">
            {lastEvent && lastEvent.action !== "seed" ? (
              <>
                <div className="flex items-center justify-between">
                  <Label>Action</Label>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        lastEvent.decidedBy === "agent"
                          ? "primary"
                          : lastEvent.decidedBy === "fallback"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {lastEvent.decidedBy === "agent"
                        ? "AI agent"
                        : lastEvent.decidedBy === "fallback"
                          ? "fallback"
                          : "deterministic"}
                    </Badge>
                    <Badge variant={ACTION_VARIANT[lastEvent.action] ?? "outline"}>
                      {lastEvent.action}
                    </Badge>
                  </div>
                </div>
                <BigStat label="Sentiment" value={lastEvent.sentiment} />
                <BigStat label="Watched" value={formatPct(lastEvent.watchedPct)} />
                <BigStat label="Engagement score" value={lastEvent.engagementScore.toFixed(2)} />
                <Meter label="Virality read" value={lastEvent.viralityScore / 100} />
                <Meter
                  label="Predicted share probability"
                  value={lastEvent.predictedShareProbability / 100}
                />
                {source && <Row label="Exposed via" value={source.name} />}
                <Row label="Exposure count" value={String(persona.exposureCount)} />
                <div className="space-y-1 border-t border-border pt-2">
                  <Label>Why</Label>
                  <p className="text-xs leading-relaxed text-foreground">{lastEvent.reason}</p>
                </div>
              </>
            ) : persona.isSeed ? (
              <p className="text-xs text-muted-foreground">
                Seeded with the content — this persona started the cascade.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                This persona was not reached by the content in this run.
              </p>
            )}
          </Section>

          {factors && (
            <Section title="Decision factors">
              <p className="mb-1 text-2xs text-muted-foreground">
                Weighted blend that produced the engagement score.
              </p>
              {FACTOR_LABELS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label>
                      {f.label}{" "}
                      <span className="normal-case text-muted-foreground/60">
                        ×{f.weight}
                      </span>
                    </Label>
                    <span className="tabular text-2xs font-medium">
                      {formatPct(factors[f.key])}
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round(factors[f.key] * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </Section>
          )}

          {persona.engagementHistory.length > 0 && (
            <Section title="Engagement history">
              <div className="space-y-1">
                {persona.engagementHistory.map((e, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b border-border/60 py-1 text-2xs"
                  >
                    <span className="text-muted-foreground">
                      {e.round === 0 ? "Round 0" : `Round ${e.round}`}
                    </span>
                    <span className="font-medium capitalize">{e.action}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Network">
            <Row
              label="Outbound connections"
              value={String(persona.networkConnections.length)}
            />
            <Row label="Outbound reach on share" value={formatPct(archetype.outboundReach)} />
          </Section>
        </div>
      </ScrollArea>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label>{label}</Label>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-t border-border pt-3">
      <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="tabular text-2xs font-medium">{formatPct(value)}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full bg-primary")}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <Label>{label}</Label>
      <span className="tabular text-base font-semibold">{value}</span>
    </div>
  );
}
