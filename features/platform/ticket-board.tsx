"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List as ListIcon, Loader2, Play } from "lucide-react";
import type { Ticket, TicketStatus } from "@/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  TICKET_PRIORITY_LABEL,
  TICKET_STATUSES,
  TICKET_STATUS_LABEL,
} from "@/lib/platform/tickets";
import { usePlatformStore } from "@/store/platform-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/states";
import { TicketCheck } from "lucide-react";

const PRIORITY_VARIANT = {
  low: "outline",
  medium: "default",
  high: "warning",
  urgent: "danger",
} as const;

const KANBAN_COLUMNS: TicketStatus[] = [
  "open",
  "in_progress",
  "review",
  "blocked",
  "done",
];

export function TicketBoard({ tickets }: { tickets: Ticket[] }) {
  const [view, setView] = useState<"kanban" | "list">("kanban");

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={TicketCheck}
        title="No tickets yet"
        description="Assign a task to the agents to open a ticket. The pipeline runs it end to end."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={view === "kanban" ? "subtle" : "ghost"}
          onClick={() => setView("kanban")}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Kanban
        </Button>
        <Button
          size="sm"
          variant={view === "list" ? "subtle" : "ghost"}
          onClick={() => setView("list")}
        >
          <ListIcon className="h-3.5 w-3.5" />
          List
        </Button>
      </div>

      {view === "kanban" ? <Kanban tickets={tickets} /> : <TicketList tickets={tickets} />}
    </div>
  );
}

function Kanban({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="grid min-h-0 flex-1 gap-3 overflow-x-auto lg:grid-cols-5">
      {KANBAN_COLUMNS.map((status) => {
        const rows = tickets.filter((t) => t.status === status);
        return (
          <div key={status} className="flex min-w-[220px] flex-col border border-border bg-subtle">
            <div className="flex items-center justify-between border-b border-border px-2.5 py-1.5">
              <span className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                {TICKET_STATUS_LABEL[status]}
              </span>
              <span className="tabular text-2xs text-muted-foreground">{rows.length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-auto p-2">
              {rows.map((t) => (
                <TicketCard key={t.id} ticket={t} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const runTicket = usePlatformStore((s) => s.runTicket);
  const running = usePlatformStore((s) => s.runningTicketId);
  const isRunning = running === ticket.id;

  return (
    <div className="border border-border bg-card p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="tabular text-2xs text-muted-foreground">{ticket.code}</span>
        <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
          {TICKET_PRIORITY_LABEL[ticket.priority]}
        </Badge>
      </div>
      <p className="mt-1 text-xs font-medium leading-snug">{ticket.title}</p>
      {ticket.result && (
        <p className="mt-1 text-2xs leading-snug text-muted-foreground">{ticket.result}</p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 text-2xs text-muted-foreground">
        <span>{formatRelativeTime(ticket.updatedAt)}</span>
        <div className="flex items-center gap-1.5">
          {ticket.simulationId && (
            <Link
              href={`/simulations/${ticket.simulationId}`}
              className="hover:text-foreground hover:underline"
            >
              sim
            </Link>
          )}
          {ticket.reportId && (
            <Link
              href={`/reports/${ticket.simulationId}`}
              className="hover:text-foreground hover:underline"
            >
              report
            </Link>
          )}
          {(ticket.status === "open" || ticket.status === "blocked") && (
            <Button
              size="sm"
              variant="outline"
              className="h-5 px-1.5"
              disabled={Boolean(running)}
              onClick={() => runTicket(ticket.id)}
            >
              {isRunning ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Play className="h-2.5 w-2.5" />
              )}
              Run
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketList({ tickets }: { tickets: Ticket[] }) {
  const setTicketStatus = usePlatformStore((s) => s.setTicketStatus);
  return (
    <div className="min-h-0 flex-1 overflow-auto border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-subtle">
          <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 font-medium">Code</th>
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Priority</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Result</th>
            <th className="px-3 py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/40">
              <td className="px-3 py-1.5 tabular text-muted-foreground">{t.code}</td>
              <td className="px-3 py-1.5 font-medium">{t.title}</td>
              <td className="px-3 py-1.5 capitalize text-muted-foreground">{t.type}</td>
              <td className="px-3 py-1.5">
                <Badge variant={PRIORITY_VARIANT[t.priority]}>
                  {TICKET_PRIORITY_LABEL[t.priority]}
                </Badge>
              </td>
              <td className="px-3 py-1.5">
                <select
                  value={t.status}
                  onChange={(e) => setTicketStatus(t.id, e.target.value as TicketStatus)}
                  className="rounded border border-border bg-background px-1 py-0.5 text-2xs"
                >
                  {TICKET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TICKET_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="max-w-[240px] truncate px-3 py-1.5 text-muted-foreground">
                {t.result ?? "—"}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">{formatRelativeTime(t.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
