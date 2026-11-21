"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { SimulationList } from "@/features/simulation-list/simulation-list";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Completed simulations with a generated verdict and virality metrics."
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <SimulationList
          filter={(status) => status === "complete"}
          showNewButton={false}
          basePath="/reports"
        />
      </div>
    </>
  );
}
