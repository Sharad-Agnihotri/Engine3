"use client";

import Link from "next/link";
import type { ActivityEvent } from "@/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/common/states";
import { Radio } from "lucide-react";

const LEVEL_STYLE: Record<ActivityEvent["level"], string> = {
  system: "text-muted-foreground",
  agent: "text-foreground",
  approval: "text-caution",
  error: "text-destructive",
};

const LEVEL_DOT: Record<ActivityEvent["level"], string> = {
  system: "bg-muted-foreground/40",
  agent: "bg-primary",
  approval: "bg-caution",
  error: "bg-destructive",
};

export function ActivityFeed({
  events,
  limit,
  className,
}: {
  events: ActivityEvent[];
  limit?: number;
  className?: string;
}) {
  const rows = limit ? events.slice(0, limit) : events;

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Radio}
        title="No activity yet"
        description="Agent actions, tool calls, approvals and system events land here as they happen."
        className={className}
      />
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <ul className="divide-y divide-border">
        {rows.map((e) => (
          <li key={e.id} className="flex gap-2.5 px-4 py-2.5">
            <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", LEVEL_DOT[e.level])} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {e.actor}
                </span>
                <span className="shrink-0 text-2xs text-muted-foreground">
                  {formatRelativeTime(e.ts)}
                </span>
              </div>
              <p className={cn("text-xs leading-snug", LEVEL_STYLE[e.level])}>{e.message}</p>
              <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                {e.toolName && <span>tool: {e.toolName}</span>}
                {e.simulationId && (
                  <Link href={`/simulations/${e.simulationId}`} className="hover:text-foreground hover:underline">
                    open simulation
                  </Link>
                )}
                {e.ticketId && (
                  <Link href={`/tickets?id=${e.ticketId}`} className="hover:text-foreground hover:underline">
                    open ticket
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
