"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { useSimulationStore } from "@/store/simulation-store";
import { formatPct, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/common/status-dot";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/states";

const VERDICT_VARIANT = {
  "NICHE HIT": "primary",
  "BROAD REACH": "success",
  "WEAK SIGNAL": "warning",
  "FAILED TO SPREAD": "danger",
} as const;

export function SimulationList({
  limit,
  showNewButton = true,
  filter,
  basePath = "/simulations",
}: {
  limit?: number;
  showNewButton?: boolean;
  filter?: (status: string) => boolean;
  basePath?: string;
}) {
  const summaries = useSimulationStore((s) => s.summaries);
  const listStatus = useSimulationStore((s) => s.listStatus);
  const loadSummaries = useSimulationStore((s) => s.loadSummaries);
  const deleteSimulation = useSimulationStore((s) => s.deleteSimulation);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  if (listStatus === "loading" && summaries.length === 0) {
    return <LoadingState label="Loading simulations" />;
  }
  if (listStatus === "error") {
    return (
      <ErrorState
        description="Could not read stored simulations."
        retry={
          <Button size="sm" variant="outline" onClick={() => loadSummaries()}>
            Retry
          </Button>
        }
      />
    );
  }

  let rows = filter ? summaries.filter((s) => filter(s.status)) : summaries;
  if (limit) rows = rows.slice(0, limit);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No simulations yet"
        description="Create your first simulation to generate a synthetic audience and test how content spreads."
        action={
          showNewButton ? (
            <Button size="sm" asChild>
              <Link href="/simulations/new">
                <Plus className="h-3.5 w-3.5" />
                New simulation
              </Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <th className="px-5 py-3.5 font-medium">Name</th>
            <th className="px-5 py-3.5 font-medium">Status</th>
            <th className="px-5 py-3.5 font-medium">Audience</th>
            <th className="px-5 py-3.5 font-medium">Reach</th>
            <th className="px-5 py-3.5 font-medium">Verdict</th>
            <th className="px-5 py-3.5 font-medium">Updated</th>
            <th className="px-5 py-3.5" />
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="group border-b border-border last:border-0 transition-colors hover:bg-foreground/[0.025]">
              <td className="px-5 py-3.5">
                <Link href={`${basePath}/${s.id}`} className="font-medium hover:underline">
                  {s.name}
                </Link>
              </td>
              <td className="px-5 py-3.5">
                <StatusDot status={s.status} />
              </td>
              <td className="px-5 py-3.5 tabular text-muted-foreground">
                {s.audienceSize.toLocaleString()}
              </td>
              <td className="px-5 py-3.5 tabular text-muted-foreground">
                {s.totalReachPct != null ? formatPct(s.totalReachPct) : "—"}
              </td>
              <td className="px-5 py-3.5">
                {s.verdictLabel ? (
                  <Badge variant={VERDICT_VARIANT[s.verdictLabel]}>{s.verdictLabel}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-5 py-3.5 text-muted-foreground">
                {formatRelativeTime(s.updatedAt)}
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => deleteSimulation(s.id)}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  title="Delete simulation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
