"use client";

import { useEffect } from "react";
import { usePlatformStore } from "@/store/platform-store";
import { PageHeader } from "@/components/layout/app-shell";
import { NewTaskDialog } from "@/features/platform/new-task-dialog";
import { TicketBoard } from "@/features/platform/ticket-board";

export default function TicketsPage() {
  const hydrate = usePlatformStore((s) => s.hydrate);
  const tickets = usePlatformStore((s) => s.tickets);
  const running = usePlatformStore((s) => s.runningTicketId);

  useEffect(() => {
    hydrate();
    const t = setInterval(() => usePlatformStore.getState().refresh(), 1500);
    return () => clearInterval(t);
  }, [hydrate]);

  const open = tickets.filter((t) => t.status !== "done").length;

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Work items the agents pick up and run through the pipeline."
        breadcrumb={`${open} open${running ? " · pipeline running" : ""}`}
        actions={<NewTaskDialog />}
      />
      <div className="flex min-h-0 flex-1 flex-col p-6">
        <TicketBoard tickets={tickets} />
      </div>
    </>
  );
}
