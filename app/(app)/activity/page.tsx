"use client";

import { useEffect } from "react";
import { usePlatformStore } from "@/store/platform-store";
import { PageHeader } from "@/components/layout/app-shell";
import { ActivityFeed } from "@/features/platform/activity-feed";

export default function ActivityPage() {
  const hydrate = usePlatformStore((s) => s.hydrate);
  const activity = usePlatformStore((s) => s.activity);

  useEffect(() => {
    hydrate();
    const t = setInterval(() => usePlatformStore.getState().refresh(), 1500);
    return () => clearInterval(t);
  }, [hydrate]);

  return (
    <>
      <PageHeader
        title="Activity"
        description="Every agent action, tool call, approval gate and system event — stored and replayable."
        breadcrumb={`${activity.length} recent events`}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <ActivityFeed events={activity} />
      </div>
    </>
  );
}
