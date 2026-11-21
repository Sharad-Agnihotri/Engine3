import { PageHeader } from "@/components/layout/app-shell";
import { NewSimulationForm } from "@/features/simulation-create/new-simulation-form";

export default function NewSimulationPage() {
  return (
    <>
      <PageHeader
        title="Test a video"
        description="Three quick steps. We'll show it to AI viewers and tell you if it's likely to go viral."
        breadcrumb="Simulations / New"
      />
      <div className="min-h-0 flex-1 overflow-auto px-8 pt-10">
        <NewSimulationForm />
      </div>
    </>
  );
}
