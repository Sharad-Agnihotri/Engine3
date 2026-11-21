"use client";

import { use } from "react";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { SimulationWorkspace } from "@/features/simulation-workspace/simulation-workspace";
import { useSimulationStore } from "@/store/simulation-store";

export default function SimulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const name = useSimulationStore((s) => (s.active?.id === id ? s.active.name : null));
  return (
    <>
      <PageHeader title={name || "Your test"} breadcrumb="Simulations / Result" />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            Loading...
          </div>
        }
      >
        <SimulationWorkspace simulationId={id} />
      </Suspense>
    </>
  );
}
