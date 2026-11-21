"use client";

import { Gauge } from "lucide-react";
import type {
  ClassDistribution,
  SimulationMetric,
  SimulationRound,
  Verdict,
  ViralityClass,
  ViralityProjection,
} from "@/types";
import { cn, formatPct } from "@/lib/utils";
import { MetricCard } from "@/components/common/metric-card";
import { EmptyState } from "@/components/common/states";

const VERDICT_STYLE: Record<
  Verdict["label"],
  { text: string; ring: string; bar: string }
> = {
  "NICHE HIT": { text: "text-plum dark:text-plum", ring: "ring-plum/30", bar: "bg-plum" },
  "BROAD REACH": { text: "text-positive dark:text-positive", ring: "ring-positive/30", bar: "bg-positive" },
  "WEAK SIGNAL": { text: "text-caution dark:text-caution", ring: "ring-caution/30", bar: "bg-caution" },
  "FAILED TO SPREAD": { text: "text-destructive", ring: "ring-destructive/30", bar: "bg-destructive" },
};

const CLASS_STYLE: Record<ViralityClass, { label: string; bar: string; text: string }> = {
  weak: { label: "Weak", bar: "bg-caution", text: "text-caution" },
  niche: { label: "Niche", bar: "bg-plum", text: "text-plum" },
  breakout: { label: "Breakout", bar: "bg-info", text: "text-info" },
  viral: { label: "Viral", bar: "bg-positive", text: "text-positive" },
};

function fmtViews(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(Math.round(v));
}

export function VerdictPanel({
  verdict,
  metrics,
  projection,
  rounds = [],
}: {
  verdict: Verdict | null;
  metrics: SimulationMetric | null;
  projection?: ViralityProjection | null;
  rounds?: SimulationRound[];
}) {
  if (!verdict || !metrics) {
    return (
      <EmptyState
        icon={Gauge}
        title="No verdict yet"
        description="The verdict, virality projection and metrics are generated once the simulation completes."
      />
    );
  }

  const style = VERDICT_STYLE[verdict.label];
  const dist = verdict.classDistribution;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* ---- verdict + probabilistic classification ---- */}
      <div className={cn("border border-border bg-card p-5 ring-1", style.ring)}>
        <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Verdict</p>
        <p className={cn("mt-1 text-3xl font-bold uppercase tracking-tight", style.text)}>
          {verdict.viralityClass ? CLASS_STYLE[verdict.viralityClass].label.toUpperCase() : verdict.label}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-foreground">{verdict.headline}</p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {verdict.explanation}
        </p>

        {dist && <ClassBars dist={dist} />}

        {verdict.drivers.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-border pt-3">
            {verdict.drivers.map((d, i) => (
              <li key={i} className="flex gap-2 text-2xs text-muted-foreground">
                <span className="text-foreground">→</span>
                {d}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", style.bar)}
              style={{ width: `${Math.round(verdict.confidence * 100)}%` }}
            />
          </div>
          <span className="tabular text-2xs text-muted-foreground">
            {formatPct(verdict.confidence)} calibrated confidence in the exact class
            {projection
              ? ` · ${formatPct(projection.breakoutProbability)} probability it breaks out`
              : ""}
            . The distribution and the p10–p90 interval carry the real uncertainty.
          </span>
        </div>
      </div>

      {/* ---- platform projection ---- */}
      {projection && <PlatformProjection p={projection} />}

      {/* ---- behavioural sample metrics (clearly labelled) ---- */}
      <div>
        <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          Behavioural sample — the persona Monte-Carlo (NOT platform reach)
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          <MetricCard
            label="Sample reach"
            value={formatPct(metrics.totalReachPct)}
            hint={`${metrics.reachedCount} of the simulated personas`}
          />
          <MetricCard
            label="In / out of target"
            value={`${metrics.inTargetReached} / ${metrics.outTargetReached}`}
            hint={`${formatPct(metrics.targetReachPct)} of in-target personas`}
          />
          <MetricCard
            label="Simulation action rate"
            value={formatPct(metrics.sampleActionRatePct)}
            hint="Personas that took any public action ÷ sample (not per-view engagement)"
          />
          <MetricCard
            label="Sample share of reactors"
            value={formatPct(metrics.sampleShareOfReactorsPct, 1)}
            hint={`shares ÷ personas who reacted (${metrics.actionTotals.share} shares)`}
          />
          <MetricCard
            label="Secondary exposures / share"
            value={metrics.secondaryExposuresPerShare.toFixed(2)}
            hint="Within the finite sample network — saturation-bounded"
          />
          <MetricCard
            label="Share-to-like ratio"
            value={metrics.shareToLikeRatio.toFixed(2)}
            hint="Sample only"
          />
          <MetricCard
            label="Cascade rounds"
            value={`${metrics.cascadeDepth}`}
            hint={`Peaked in round ${metrics.peakRound}`}
          />
          <MetricCard
            label="Seed amplification"
            value={`${metrics.seedAmplification}x`}
            hint="Non-seed sample reach per seed"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {(
          [
            ["like", "Likes"],
            ["comment", "Comments"],
            ["share", "Shares"],
            ["save", "Saves"],
            ["follow", "Follows"],
            ["watch", "Watches"],
            ["ignore", "Ignores"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="border border-border bg-card p-2 text-center">
            <p className="tabular text-sm font-semibold">{metrics.actionTotals[key]}</p>
            <p className="text-2xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {rounds.length > 0 && <ReachCurve rounds={rounds} metrics={metrics} />}
    </div>
  );
}

function ClassBars({ dist }: { dist: ClassDistribution }) {
  const entries: [ViralityClass, number][] = [
    ["weak", dist.weak],
    ["niche", dist.niche],
    ["breakout", dist.breakout],
    ["viral", dist.viral],
  ];
  return (
    <div className="mt-3 space-y-1.5 border-t border-border pt-3">
      <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
        Outcome distribution (Monte-Carlo)
      </p>
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className={cn("w-16 text-2xs font-medium", CLASS_STYLE[k].text)}>
            {CLASS_STYLE[k].label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", CLASS_STYLE[k].bar)} style={{ width: `${v * 100}%` }} />
          </div>
          <span className="tabular w-10 text-right text-2xs text-muted-foreground">
            {formatPct(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PlatformProjection({ p }: { p: ViralityProjection }) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
        Platform projection — from a {p.cohortViews.toLocaleString()}-view exposure cohort
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <MetricCard
          label="Projected views (median)"
          value={fmtViews(p.projectedViews.median)}
          hint={`${fmtViews(p.projectedViews.p10)} – ${fmtViews(p.projectedViews.p90)} (10th–90th pct)`}
          emphasis
        />
        <MetricCard
          label="Recommendation score"
          value={p.recommendation.score.toFixed(2)}
          hint={`→ algorithmic multiplier ~${Math.round(p.algorithmicMultiplier)}x`}
        />
        <MetricCard
          label="Breakout probability"
          value={formatPct(p.breakoutProbability)}
          hint={`viral probability ${formatPct(p.viralProbability)}`}
        />
        <MetricCard
          label="Cross-audience penetration"
          value={formatPct(p.crossAudiencePenetration)}
          hint={`${p.expectedCascadeGenerations} generations · saturates ~period ${p.saturationPeriod}`}
        />
      </div>

      <p className="mt-4 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
        Predicted actions per 10,000 views
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {(
          [
            ["Likes", p.per10k.likes],
            ["Comments", p.per10k.comments],
            ["Sends", p.per10k.shares],
            ["Saves", p.per10k.saves],
            ["Reposts", p.per10k.reposts],
          ] as const
        ).map(([label, v]) => (
          <div key={label} className="border border-border bg-subtle p-2 text-center">
            <p className="tabular text-sm font-semibold">{v}</p>
            <p className="text-2xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Diffusion (Bass)
          </p>
          <div className="mt-1 space-y-0.5 text-2xs text-muted-foreground">
            <p>
              <span className="tabular text-foreground">p = {p.bass.p.toFixed(3)}</span> — algorithmic push
            </p>
            <p>
              <span className="tabular text-foreground">q = {p.bass.q.toFixed(2)}</span> — friend sharing
            </p>
            <p>
              <span className="tabular text-foreground">M = {p.bass.marketPotentialMultiple}x</span> —
              addressable audience
            </p>
            <p>
              organic ~{p.organicMultiplier}x · algorithmic ~{Math.round(p.algorithmicMultiplier)}x
            </p>
          </div>
        </div>
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Audience tiers
          </p>
          <div className="mt-1 space-y-0.5 text-2xs text-muted-foreground">
            {p.audienceTiers.map((t) => (
              <p key={t.key} className="flex justify-between">
                <span>{t.label}</span>
                <span className="tabular">affinity {t.affinity.toFixed(2)}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <ul className="mt-3 space-y-1 border-t border-border pt-3">
        {p.assumptions.map((a, i) => (
          <li key={i} className="text-2xs text-muted-foreground">
            · {a}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReachCurve({
  rounds,
  metrics,
}: {
  rounds: SimulationRound[];
  metrics: SimulationMetric;
}) {
  const points = metrics.reachByRound;
  const max = Math.max(...points, 0.01);
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
        Sample cumulative reach by round
      </p>
      <div className="mt-3 flex gap-1.5">
        {points.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end">
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
                title={formatPct(v)}
              />
            </div>
            <span className="tabular text-[10px] text-muted-foreground">
              {i === 0 ? "seed" : `R${i}`} · {formatPct(v)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-2xs text-muted-foreground">
        {rounds[rounds.length - 1]?.terminationReason ?? "Ran to the round limit."}
      </p>
    </div>
  );
}
