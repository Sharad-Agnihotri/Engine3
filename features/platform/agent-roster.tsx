"use client";

import type { Agent } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { AGENT_ROLE_LABEL } from "@/lib/platform/agents";
import { TOOLS } from "@/lib/platform/tools";
import { PERMISSION_LABEL } from "@/lib/platform/permissions";
import { AgentAvatar, AgentStatusDot } from "@/components/common/agent-status";
import { Badge } from "@/components/ui/badge";

export function AgentRoster({ agents }: { agents: Agent[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {agents.map((agent) => (
        <div key={agent.id} className="border border-border bg-card p-3">
          <div className="flex items-start gap-3">
            <AgentAvatar avatar={agent.avatar} size={32} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium">{agent.name}</p>
                <AgentStatusDot status={agent.status} />
              </div>
              <p className="text-2xs uppercase tracking-wide text-muted-foreground">
                {AGENT_ROLE_LABEL[agent.role]}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{agent.description}</p>

              <div className="mt-2 flex flex-wrap gap-1">
                {agent.capabilities.map((c) => (
                  <Badge key={c} variant="outline">
                    {c}
                  </Badge>
                ))}
              </div>

              <div className="mt-2 border-t border-border pt-2 text-2xs">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Current task:</span>{" "}
                  {agent.currentTask ?? "idle"}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Last active:</span>{" "}
                  {formatRelativeTime(agent.lastActiveAt)}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {agent.tools.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-border px-1 py-0.5 text-[10px] text-muted-foreground"
                      title={`${TOOLS[t].description} · ${PERMISSION_LABEL[TOOLS[t].permission]}`}
                    >
                      {TOOLS[t].label}
                      {TOOLS[t].permission !== "safe" && " ⚠"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
