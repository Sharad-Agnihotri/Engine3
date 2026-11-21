"use client";

import { use } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { ReportView } from "@/features/report/report-view";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <>
      <PageHeader title="Report" breadcrumb="Reports" />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <ReportView id={id} />
      </div>
    </>
  );
}
