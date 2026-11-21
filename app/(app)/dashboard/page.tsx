"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { useSimulationStore } from "@/store/simulation-store";
import { usePlatformStore } from "@/store/platform-store";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/common/metric-card";
import { SimulationList } from "@/features/simulation-list/simulation-list";
import { ActivityFeed } from "@/features/platform/activity-feed";
import { NewTaskDialog } from "@/features/platform/new-task-dialog";
import { LLMStatusBadge } from "@/components/common/llm-status-badge";
import { AgentStatusDot, AgentAvatar } from "@/components/common/agent-status";
import { cn, formatPct, formatRelativeTime } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function SectionTitle({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="font-display text-[26px] leading-none tracking-[-0.01em]">{title}</h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {linkLabel}
          <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
        </Link>
      )}
    </div>
  );
}

/** Single-series bar chart of total reach per completed simulation. */
function ReachBars({ data }: { data: { id: string; name: string; reach: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(100, ...data.map((d) => d.reach));
  const ticks = [0, 25, 50, 75, 100].filter((t) => t <= max);

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border-strong text-xs text-muted-foreground">
        Complete a simulation to see reach here.
      </div>
    );
  }

  return (
    <div className="relative flex h-full gap-3">
      <div className="flex flex-col justify-between pb-6 text-right font-mono text-[10px] text-muted-foreground/70">
        {[...ticks].reverse().map((t) => (
          <span key={t} className="tabular leading-none">
            {t}%
          </span>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between">
          {ticks.map((t) => (
            <div key={t} className="h-px w-full bg-border/70" />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-6 top-0 flex items-end gap-[2px]">
          {data.map((d, i) => (
            <div
              key={d.id}
              className="relative flex h-full flex-1 items-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <Link
                href={`/simulations/${d.id}`}
                aria-label={`${d.name}: ${formatPct(d.reach)} reach`}
                className={cn(
                  "mx-auto block w-full max-w-[44px] rounded-t-[4px] transition-colors duration-200",
                  hover === null || hover === i ? "bg-clay/80" : "bg-clay/30",
                )}
                style={{ height: `${Math.max(1.5, (d.reach / max) * 100)}%` }}
              />
              {hover === i && (
                <div
                  className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border-strong bg-popover px-3 py-2 shadow-xl shadow-black/40"
                  style={{ bottom: `calc(${(d.reach / max) * 100}% + 8px)` }}
                >
                  <p className="text-[11px] text-muted-foreground">{d.name}</p>
                  <p className="tabular text-sm text-foreground">{formatPct(d.reach)} reach</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono text-[10px] text-muted-foreground/70">
          <span>oldest</span>
          <span>latest</span>
        </div>
      </div>
    </div>
  );
}

const PIPELINE = ["Content", "Audience", "Simulation", "Agents", "Analysis", "Verdict", "Experiment", "Learning"];

export default function DashboardPage() {
  const summaries = useSimulationStore((s) => s.summaries);
  const loadSummaries = useSimulationStore((s) => s.loadSummaries);
  const hydrate = usePlatformStore((s) => s.hydrate);
  const agents = usePlatformStore((s) => s.agents);
  const tickets = usePlatformStore((s) => s.tickets);
  const experiments = usePlatformStore((s) => s.experiments);
  const activity = usePlatformStore((s) => s.activity);
  const reports = usePlatformStore((s) => s.reports);
  const [hello, setHello] = useState("Overview");

  useEffect(() => {
    setHello(greeting());
    void loadSummaries();
    hydrate();
    const t = setInterval(() => usePlatformStore.getState().refresh(), 2500);
    return () => clearInterval(t);
  }, [loadSummaries, hydrate]);

  const perf = useMemo(() => {
    const complete = summaries.filter((s) => s.status === "complete");
    const withMetrics = experiments.filter((e) => e.shareRatePct != null);
    const avgShare =
      withMetrics.length > 0
        ? withMetrics.reduce((s, e) => s + (e.shareRatePct ?? 0), 0) / withMetrics.length
        : null;
    const avgTarget =
      withMetrics.length > 0
        ? withMetrics.reduce((s, e) => s + (e.targetReachPct ?? 0), 0) / withMetrics.length
        : null;
    const best =
      [...withMetrics].sort((a, b) => (b.shareRatePct ?? 0) - (a.shareRatePct ?? 0))[0] ?? null;
    const bars = complete
      .filter((s) => s.totalReachPct != null)
      .slice(0, 16)
      .reverse()
      .map((s) => ({ id: s.id, name: s.name, reach: s.totalReachPct ?? 0 }));
    return {
      complete: complete.length,
      avgReach:
        complete.length > 0
          ? complete.reduce((s, x) => s + (x.totalReachPct ?? 0), 0) / complete.length
          : null,
      avgShare,
      avgTarget,
      best,
      bars,
    };
  }, [summaries, experiments]);

  const openTickets = tickets.filter((t) => t.status !== "done");
  const activeAgents = agents.filter((a) => a.status === "working" || a.status === "online");
  const running = summaries.filter((s) => s.status !== "complete" && s.status !== "draft").length;

  // How far along the loop the workspace has travelled, for the pipeline strip.
  const stageCounts = [
    summaries.length,
    summaries.length,
    perf.complete + running,
    activeAgents.length,
    reports.length,
    summaries.filter((s) => s.verdictLabel).length,
    experiments.length,
    experiments.filter((e) => e.shareRatePct != null).length,
  ];

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        title={hello}
        description="Every piece of content you test moves through the same loop. Here is where yours stands."
        actions={
          <>
            <LLMStatusBadge />
            <NewTaskDialog />
            <Button size="sm" asChild>
              <Link href="/simulations/new">
                <Plus className="h-3.5 w-3.5" />
                New simulation
              </Link>
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[1400px] space-y-12 px-8 py-8">
          {/* Hero: headline number + reach chart */}
          <section className="panel grain relative grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="flex flex-col justify-between gap-10 border-b border-border p-8 lg:border-b-0 lg:border-r">
              <div>
                <p className="eyebrow">Average total reach</p>
                <p className="tabular mt-5 font-display text-[96px] leading-[0.85] tracking-[-0.04em]">
                  {perf.avgReach != null ? (
                    <>
                      {perf.avgReach.toFixed(0)}
                      <span className="text-[48px] text-muted-foreground">%</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </p>
                <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                  The share of each simulated audience that saw the content, averaged across{" "}
                  <span className="text-foreground">{perf.complete}</span> completed{" "}
                  {perf.complete === 1 ? "run" : "runs"}.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6 border-t border-border pt-6">
                {[
                  ["Running", running],
                  ["Completed", perf.complete],
                  ["Reports", reports.length],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="tabular text-2xl tracking-[-0.02em]">{v}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{k}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col p-8">
              <div className="mb-6 flex items-baseline justify-between">
                <p className="eyebrow">Reach by simulation</p>
                <p className="text-[11px] text-muted-foreground">last {perf.bars.length} completed</p>
              </div>
              <div className="h-[260px]">
                <ReachBars data={perf.bars} />
              </div>
            </div>
          </section>

          {/* The loop */}
          <section>
            <SectionTitle title="The loop" />
            <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4 xl:grid-cols-8">
              {PIPELINE.map((stage, i) => (
                <li key={stage} className="bg-card p-4">
                  <p className="font-mono text-[10px] text-muted-foreground/70">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-6 text-[13px] text-foreground">{stage}</p>
                  <p className="tabular mt-0.5 text-xs text-muted-foreground">{stageCounts[i]}</p>
                  <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/50"
                      style={{ width: (stageCounts[i] ?? 0) > 0 ? "100%" : "0%" }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Metrics */}
          <section>
            <SectionTitle title="Signals" href="/experiments" linkLabel="Experiments" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                label="Target penetration"
                value={perf.avgTarget != null ? formatPct(perf.avgTarget) : "—"}
                hint="Average across experiments"
              />
              <MetricCard
                label="Share rate"
                value={perf.avgShare != null ? formatPct(perf.avgShare, 1) : "—"}
                hint="Of exposed personas who passed it on"
              />
              <MetricCard
                label="Agents active"
                value={
                  <>
                    {activeAgents.length}
                    <span className="text-muted-foreground">/{agents.length}</span>
                  </>
                }
                hint={`${openTickets.length} open of ${tickets.length} tickets`}
              />
              <MetricCard
                label="Best experiment"
                value={perf.best?.code ?? "—"}
                hint={
                  perf.best
                    ? `${formatPct(perf.best.shareRatePct ?? 0, 1)} share · ${perf.best.verdictLabel ?? ""}`
                    : "No results yet"
                }
                emphasis
              />
            </div>
          </section>

          <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-12">
              <section>
                <SectionTitle title="Recent simulations" href="/simulations" />
                <SimulationList limit={5} />
              </section>

              <div className="grid gap-12 lg:grid-cols-2">
                <section>
                  <SectionTitle title="Agents" href="/agents" linkLabel="Workspace" />
                  <div className="panel divide-y divide-border">
                    {agents.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                        <AgentAvatar avatar={a.avatar} size={30} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px]">{a.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {a.currentTask ?? "Idle"} · {formatRelativeTime(a.lastActiveAt)}
                          </p>
                        </div>
                        <AgentStatusDot status={a.status} />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle title="Reports" href="/reports" />
                  {reports.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border-strong px-5 py-10 text-center text-xs text-muted-foreground">
                      No reports yet — run an agent task or a simulation.
                    </div>
                  ) : (
                    <div className="panel divide-y divide-border">
                      {reports.slice(0, 5).map((r) => (
                        <Link
                          key={r.id}
                          href={`/reports/${r.simulationId}`}
                          className="group block px-5 py-3.5 transition-colors hover:bg-foreground/[0.025]"
                        >
                          <p className="flex items-center justify-between gap-2 text-[13px]">
                            <span className="truncate">{r.title}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {r.executiveSummary}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>

            <aside className="min-w-0">
              <SectionTitle title="Activity" href="/activity" />
              <div className="panel h-[640px] overflow-hidden">
                <ActivityFeed events={activity} limit={40} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
