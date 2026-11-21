"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { CalibrationReport } from "@/features/calibration/calibration-report";

export default function CalibrationPage() {
  return (
    <>
      <PageHeader
        title="Calibration"
        description="Model accuracy against ground truth — regression error per predicted metric, classification quality, and the false-negative rate on content that actually went viral."
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <CalibrationReport />
      </div>
    </>
  );
}
