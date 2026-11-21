"use client";

import { useEffect } from "react";
import { usePlatformStore } from "@/store/platform-store";
import { PageHeader } from "@/components/layout/app-shell";
import { LLMStatusBadge } from "@/components/common/llm-status-badge";
import { AgentRoster } from "@/features/platform/agent-roster";
import { ActivityFeed } from "@/features/platform/activity-feed";
import { NewTaskDialog } from "@/features/platform/new-task-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentsPage() {
  const hydrate = usePlatformStore((s) => s.hydrate);
  const agents = usePlatformStore((s) => s.agents);
  const activity = usePlatformStore((s) => s.activity);
  const runningTicketId = usePlatformStore((s) => s.runningTicketId);
  const taskLog = usePlatformStore((s) => s.taskLog);

  useEffect(() => {
    hydrate();
    const t = setInterval(() => usePlatformStore.getState().refresh(), 2000);
    return () => clearInterval(t);
  }, [hydrate]);

  const online = agents.filter((a) => a.status !== "offline").length;

  return (
    <>
      <PageHeader
        title="Agent workspace"
        description="Autonomous agents that run the content → audience → simulation → analysis → report pipeline."
        breadcrumb={`${online} / ${agents.length} agents online`}
        actions={
          <>
            <LLMStatusBadge />
            <NewTaskDialog />
          </>
        }
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_360px]">
        <div className="min-h-0 overflow-auto p-6">
          {runningTicketId && (
            <Card className="mb-4 border-primary/40">
              <CardHeader>
                <CardTitle>Agent pipeline running</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {taskLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Starting…</p>
                ) : (
                  taskLog.slice(-8).map((line, i) => (
                    <p key={i} className="text-2xs text-muted-foreground">
                      <span className="text-foreground">→</span> {line}
                    </p>
                  ))
                )}
              </CardContent>
            </Card>
          )}
          <AgentRoster agents={agents} />
        </div>

        <aside className="flex min-h-0 flex-col border-l border-border bg-card">
          <div className="border-b border-border px-4 py-2">
            <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
              Activity
            </p>
          </div>
          <div className="min-h-0 flex-1">
            <ActivityFeed events={activity} />
          </div>
        </aside>
      </div>
    </>
  );
}
