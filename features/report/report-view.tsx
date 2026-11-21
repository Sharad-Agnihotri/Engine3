"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FileBarChart, FileText } from "lucide-react";
import type { Report } from "@/types";
import { useSimulationStore } from "@/store/simulation-store";
import { buildReport } from "@/lib/platform/report";
import { reportForSimulation, saveReport } from "@/lib/platform/reports-store";
import { captureReportKnowledge } from "@/lib/platform/knowledge";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/states";
import { VerdictPanel } from "@/features/verdict/verdict-panel";
import { FullReport } from "./full-report";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InputSummary } from "@/features/simulation-workspace/input-summary";

export function ReportView({ id }: { id: string }) {
  const active = useSimulationStore((s) => s.active);
  const activeStatus = useSimulationStore((s) => s.activeStatus);
  const loadSimulation = useSimulationStore((s) => s.loadSimulation);
  const clearActive = useSimulationStore((s) => s.clearActive);
  const [report, setReport] = useState<Report | null>(null);
  const [tab, setTab] = useState("report");

  useEffect(() => {
    void loadSimulation(id);
    return () => clearActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (active?.id === id) setReport(reportForSimulation(id));
  }, [active?.id, id]);

  if (activeStatus === "loading") return <LoadingState label="Loading report" />;
  if (activeStatus === "error" || !active)
    return <ErrorState title="Report not found" description="This simulation no longer exists." />;

  if (active.status !== "complete" || !active.verdict) {
    return (
      <EmptyState
        icon={FileBarChart}
        title="Simulation not complete"
        description="This simulation hasn't finished running, so there's no report yet."
        action={
          <Link href={`/simulations/${active.id}`} className="text-2xs text-primary hover:underline">
            Open workspace
          </Link>
        }
      />
    );
  }

  const generate = () => {
    const built = buildReport(active);
    saveReport(built);
    captureReportKnowledge(built);
    setReport(built);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{active.name}</h2>
          <p className="text-2xs text-muted-foreground">
            {active.agentRun?.mode === "ai"
              ? `AI agents — ${active.agentRun.provider} / ${active.agentRun.model} · ${active.agentRun.llmCalls} calls · ${active.agentRun.fallbacks} fallbacks`
              : `Deterministic engine · seed ${active.config.randomSeed}`}
          </p>
        </div>
        <Link
          href={`/simulations/${active.id}`}
          className="inline-flex items-center gap-1 text-2xs text-primary hover:underline"
        >
          Open workspace <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="input">Input</TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="pt-4">
          {report ? (
            <FullReport report={report} />
          ) : (
            <EmptyState
              icon={FileText}
              title="No compiled report"
              description="Generate the full executive report — content analysis, penetration, cascade, risks, recommendations and the next experiment."
              action={
                <Button size="sm" onClick={generate}>
                  Generate report
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="metrics" className="pt-4">
          <VerdictPanel verdict={active.verdict} metrics={active.metrics} projection={active.projection} rounds={active.rounds} />
        </TabsContent>

        <TabsContent value="input" className="pt-4">
          <InputSummary simulation={active} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
