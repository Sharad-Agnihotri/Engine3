import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { SimulationList } from "@/features/simulation-list/simulation-list";

export default function SimulationsPage() {
  return (
    <>
      <PageHeader
        title="Simulations"
        description="Every virality simulation you've configured or run."
        actions={
          <Button size="sm" asChild>
            <Link href="/simulations/new">
              <Plus className="h-3.5 w-3.5" />
              New simulation
            </Link>
          </Button>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <SimulationList />
      </div>
    </>
  );
}
