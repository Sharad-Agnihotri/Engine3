"use client";

import { useMemo } from "react";
import type { ViralityClass } from "@/types";
import { cn, formatPct } from "@/lib/utils";
import {
  evaluateDataset,
  GROUND_TRUTH,
  type GroundTruthCase,
} from "@/lib/simulation/estimation/calibration";
import { CLASS_THRESHOLDS } from "@/lib/simulation/estimation/calibration-constants";
import { MetricCard } from "@/components/common/metric-card";
import { Badge } from "@/components/ui/badge";

const CLASSES: ViralityClass[] = ["weak", "niche", "breakout", "viral"];

const CLASS_LABEL: Record<ViralityClass, string> = {
  weak: "Weak",
  niche: "Niche",
  breakout: "Breakout",
  viral: "Viral",
};

const CLASS_TEXT: Record<ViralityClass, string> = {
  weak: "text-caution",
  niche: "text-plum",
  breakout: "text-info",
  viral: "text-positive",
};

function fmtViews(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(Math.round(v));
}

/** Relative error, coloured — green under 25%, amber under 100%, red beyond. */
function ErrCell({ actual, predicted }: { actual: number; predicted: number }) {
  const err = actual > 0 ? Math.abs(predicted - actual) / actual : 0;
  const tone =
    err <= 0.25 ? "text-positive" : err <= 1 ? "text-caution" : "text-destructive";
  return (
    <span className="tabular">
      <span className="text-muted-foreground">{actual}</span>
      <span className="mx-1 text-muted-foreground/50">→</span>
      <span className={tone}>{predicted}</span>
    </span>
  );
}

export function CalibrationReport() {
  const evaluation = useMemo(() => evaluateDataset(), []);
  const byId = useMemo(
    () => new Map(GROUND_TRUTH.map((g) => [g.id, g] as [string, GroundTruthCase])),
    [],
  );

  const metricRows = [
    ["likes", "Likes / 10k"],
    ["comments", "Comments / 10k"],
    ["shares", "Sends / 10k"],
    ["saves", "Saves / 10k"],
    ["reposts", "Reposts / 10k"],
  ] as const;

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-12">
      <p className="border border-border bg-subtle p-3 text-xs leading-relaxed text-muted-foreground">
        The model is evaluated against a ground-truth set, never fitted to it. The two Instagram
        Reels are <span className="font-medium text-foreground">validation cases</span>; the
        remaining rows are clearly-labelled synthetic anchors that stop the evaluation from being a
        two-point line. Recalibrate by editing{" "}
        <code className="rounded bg-muted px-1">calibration-constants.ts</code> and re-running — never
        by special-casing a video.
      </p>

      {/* ---- headline ---- */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <MetricCard
          label="Class accuracy"
          value={formatPct(evaluation.classAccuracy)}
          hint={`${evaluation.cases.length} ground-truth cases`}
          emphasis
        />
        <MetricCard
          label="False negatives > 1M"
          value={formatPct(evaluation.falseNegativeOver1M)}
          hint="Actually viral, predicted weak/niche"
        />
        <MetricCard
          label="False negatives > 10M"
          value={formatPct(evaluation.falseNegativeOver10M)}
          hint="Actually >10M, not predicted viral"
        />
        <MetricCard
          label="Projected-views MAPE"
          value={evaluation.viewsMape.toFixed(2)}
          hint="Mean abs. % error on reach"
        />
      </div>

      {/* ---- per case ---- */}
      <section className="space-y-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          Per-case predictions
        </h3>
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-subtle text-left text-2xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Case</th>
                <th className="px-3 py-2 font-medium">Class</th>
                <th className="px-3 py-2 font-medium">Views</th>
                <th className="px-3 py-2 font-medium">Likes</th>
                <th className="px-3 py-2 font-medium">Comments</th>
                <th className="px-3 py-2 font-medium">Sends</th>
                <th className="px-3 py-2 font-medium">Saves</th>
                <th className="px-3 py-2 font-medium">Reposts</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.cases.map((c) => {
                const gt = byId.get(c.id);
                const correct = c.actualClass === c.predictedClass;
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-3 py-2">
                      <p className="font-medium">{c.id}</p>
                      <Badge variant={gt?.kind === "validation" ? "primary" : "outline"}>
                        {gt?.kind === "validation" ? "validation" : "synthetic anchor"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("font-medium", CLASS_TEXT[c.actualClass])}>
                        {CLASS_LABEL[c.actualClass]}
                      </span>
                      <span className="mx-1 text-muted-foreground/50">→</span>
                      <span className={cn("font-medium", CLASS_TEXT[c.predictedClass])}>
                        {CLASS_LABEL[c.predictedClass]}
                      </span>
                      <span className={cn("ml-1", correct ? "text-positive" : "text-destructive")}>
                        {correct ? "✓" : "✕"}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular">
                      <span className="text-muted-foreground">{fmtViews(c.actualViews)}</span>
                      <span className="mx-1 text-muted-foreground/50">→</span>
                      <span>{fmtViews(c.predictedViews)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <ErrCell actual={c.per10k.likes} predicted={c.predictedPer10k.likes} />
                    </td>
                    <td className="px-3 py-2">
                      <ErrCell actual={c.per10k.comments} predicted={c.predictedPer10k.comments} />
                    </td>
                    <td className="px-3 py-2">
                      <ErrCell actual={c.per10k.shares} predicted={c.predictedPer10k.shares} />
                    </td>
                    <td className="px-3 py-2">
                      <ErrCell actual={c.per10k.saves} predicted={c.predictedPer10k.saves} />
                    </td>
                    <td className="px-3 py-2">
                      <ErrCell actual={c.per10k.reposts} predicted={c.predictedPer10k.reposts} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-2xs text-muted-foreground">
          Each cell shows <span className="text-muted-foreground">actual</span> →{" "}
          <span className="text-positive">predicted</span>, coloured by relative error (green
          ≤25%, amber ≤100%, red beyond).
        </p>
      </section>

      {/* ---- regression error ---- */}
      <section className="space-y-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          Per-metric error (per 10,000 views)
        </h3>
        <div className="border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-subtle text-left text-2xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Metric</th>
                <th className="px-3 py-2 font-medium">MAE</th>
                <th className="px-3 py-2 font-medium">MAPE</th>
                <th className="px-3 py-2 font-medium">RMSE</th>
              </tr>
            </thead>
            <tbody>
              {metricRows.map(([key, label]) => {
                const m = evaluation.perMetric[key];
                return (
                  <tr key={key} className="border-b border-border last:border-0">
                    <td className="px-3 py-1.5 font-medium">{label}</td>
                    <td className="px-3 py-1.5 tabular">{m.mae}</td>
                    <td
                      className={cn(
                        "px-3 py-1.5 tabular",
                        m.mape <= 0.4
                          ? "text-positive"
                          : m.mape <= 1.2
                            ? "text-caution"
                            : "text-destructive",
                      )}
                    >
                      {m.mape.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 tabular">{m.rmse}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- classification ---- */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Confusion matrix
          </h3>
          <div className="border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-subtle text-2xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2 text-left font-medium">Actual ╲ Pred</th>
                  {CLASSES.map((c) => (
                    <th key={c} className="px-2 py-2 text-center font-medium">
                      {CLASS_LABEL[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CLASSES.map((actual) => (
                  <tr key={actual} className="border-b border-border last:border-0">
                    <td className={cn("px-2 py-1.5 font-medium", CLASS_TEXT[actual])}>
                      {CLASS_LABEL[actual]}
                    </td>
                    {CLASSES.map((pred) => {
                      const n = evaluation.confusion[actual][pred];
                      const diag = actual === pred;
                      return (
                        <td
                          key={pred}
                          className={cn(
                            "px-2 py-1.5 text-center tabular",
                            n === 0 && "text-muted-foreground/40",
                            n > 0 && diag && "bg-positive/10 font-semibold text-positive",
                            n > 0 && !diag && "bg-destructive/10 font-semibold text-destructive",
                          )}
                        >
                          {n}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Precision / recall / F1
          </h3>
          <div className="border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-subtle text-left text-2xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Class</th>
                  <th className="px-3 py-2 font-medium">Precision</th>
                  <th className="px-3 py-2 font-medium">Recall</th>
                  <th className="px-3 py-2 font-medium">F1</th>
                </tr>
              </thead>
              <tbody>
                {CLASSES.map((c) => (
                  <tr key={c} className="border-b border-border last:border-0">
                    <td className={cn("px-3 py-1.5 font-medium", CLASS_TEXT[c])}>
                      {CLASS_LABEL[c]}
                    </td>
                    <td className="px-3 py-1.5 tabular">{evaluation.precision[c].toFixed(2)}</td>
                    <td className="px-3 py-1.5 tabular">{evaluation.recall[c].toFixed(2)}</td>
                    <td className="px-3 py-1.5 tabular">{evaluation.f1[c].toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---- thresholds ---- */}
      <section className="space-y-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          Class thresholds (projected views)
        </h3>
        <div className="flex flex-wrap gap-2 text-2xs">
          <span className="border border-border bg-card px-2 py-1">
            <span className="text-caution">Weak</span> &lt;{" "}
            {CLASS_THRESHOLDS.niche.toLocaleString()}
          </span>
          <span className="border border-border bg-card px-2 py-1">
            <span className="text-plum">Niche</span> &lt;{" "}
            {CLASS_THRESHOLDS.breakout.toLocaleString()}
          </span>
          <span className="border border-border bg-card px-2 py-1">
            <span className="text-info">Breakout</span> &lt;{" "}
            {CLASS_THRESHOLDS.viral.toLocaleString()}
          </span>
          <span className="border border-border bg-card px-2 py-1">
            <span className="text-positive">Viral</span> ≥{" "}
            {CLASS_THRESHOLDS.viral.toLocaleString()}
          </span>
          <span className="border border-border bg-card px-2 py-1 text-muted-foreground">
            Failed to spread &lt; {CLASS_THRESHOLDS.failed.toLocaleString()}
          </span>
        </div>
      </section>
    </div>
  );
}
