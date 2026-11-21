"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { usePlatformStore } from "@/store/platform-store";
import { formatPct } from "@/lib/utils";
import { PageHeader } from "@/components/layout/app-shell";
import { NewTaskDialog } from "@/features/platform/new-task-dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/states";
import { Beaker } from "lucide-react";

const VERDICT_VARIANT = {
  "NICHE HIT": "primary",
  "BROAD REACH": "success",
  "WEAK SIGNAL": "warning",
  "FAILED TO SPREAD": "danger",
} as const;

export default function ExperimentsPage() {
  const hydrate = usePlatformStore((s) => s.hydrate);
  const experiments = usePlatformStore((s) => s.experiments);

  useEffect(() => {
    hydrate();
    const t = setInterval(() => usePlatformStore.getState().refresh(), 1500);
    return () => clearInterval(t);
  }, [hydrate]);

  const best = experiments
    .filter((e) => e.shareRatePct != null)
    .sort((a, b) => (b.shareRatePct ?? 0) - (a.shareRatePct ?? 0))[0];

  return (
    <>
      <PageHeader
        title="Experiments"
        description="Experiment → simulation → analysis → recommendation → next experiment. A continuous product-learning loop."
        breadcrumb={`${experiments.length} experiments`}
        actions={<NewTaskDialog triggerLabel="New experiment" />}
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {experiments.length === 0 ? (
          <EmptyState
            icon={Beaker}
            title="No experiments yet"
            description="Run a task from the Agents or Tickets view — each agent run is recorded here as an experiment."
          />
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {best && (
              <div className="border border-positive/30 bg-positive/5 p-3 text-xs">
                <span className="font-medium">Best performing:</span> {best.code} — {best.title} (
                {formatPct(best.shareRatePct ?? 0, 1)} share rate)
              </div>
            )}
            {experiments.map((exp, i) => (
              <div key={exp.id}>
                {i > 0 && (
                  <div className="flex justify-center py-1 text-muted-foreground">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="tabular text-2xs font-semibold text-muted-foreground">
                      {exp.code}
                    </span>
                    {exp.verdictLabel && (
                      <Badge variant={VERDICT_VARIANT[exp.verdictLabel]}>{exp.verdictLabel}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] font-medium">{exp.title}</p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">{exp.hypothesis}</p>
                  {exp.changeFromPrevious && (
                    <p className="mt-1 text-2xs">
                      <span className="font-medium">Change:</span> {exp.changeFromPrevious}
                    </p>
                  )}

                  {exp.shareRatePct != null && (
                    <div className="mt-2 flex gap-4 border-t border-border pt-2 text-2xs">
                      <span className="tabular">
                        <span className="text-muted-foreground">Share rate</span>{" "}
                        {formatPct(exp.shareRatePct, 1)}
                      </span>
                      <span className="tabular">
                        <span className="text-muted-foreground">Target reach</span>{" "}
                        {formatPct(exp.targetReachPct ?? 0)}
                      </span>
                    </div>
                  )}

                  {exp.recommendation && (
                    <p className="mt-2 text-2xs">
                      <span className="font-medium">Recommendation:</span> {exp.recommendation}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-3 text-2xs">
                    {exp.simulationId && (
                      <Link
                        href={`/simulations/${exp.simulationId}`}
                        className="text-primary hover:underline"
                      >
                        View simulation
                      </Link>
                    )}
                    {exp.simulationId && (
                      <Link
                        href={`/reports/${exp.simulationId}`}
                        className="text-primary hover:underline"
                      >
                        View report
                      </Link>
                    )}
                    {exp.status === "analyzed" && (
                      <NewTaskDialog parentExperimentId={exp.id} triggerLabel="Run next" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
