import { cn } from "@/lib/utils";
import type { SimulationStatus } from "@/types";

const STATUS_STYLE: Record<
  SimulationStatus | "idle",
  { color: string; label: string; pulse?: boolean }
> = {
  idle: { color: "bg-muted-foreground/40", label: "Idle" },
  draft: { color: "bg-muted-foreground/50", label: "Draft" },
  analyzing: { color: "bg-info", label: "Analyzing", pulse: true },
  populating: { color: "bg-info", label: "Populating", pulse: true },
  networking: { color: "bg-info", label: "Networking", pulse: true },
  seeding: { color: "bg-plum", label: "Seeding", pulse: true },
  running: { color: "bg-plum", label: "Running", pulse: true },
  complete: { color: "bg-positive", label: "Complete" },
  cancelled: { color: "bg-caution", label: "Cancelled" },
  error: { color: "bg-destructive", label: "Error" },
};

export function StatusDot({
  status,
  showLabel = true,
  className,
}: {
  status: SimulationStatus | "idle";
  showLabel?: boolean;
  className?: string;
}) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative flex h-2 w-2">
        {s.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              s.color,
            )}
          />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", s.color)} />
      </span>
      {showLabel && (
        <span className="text-2xs uppercase tracking-wide text-muted-foreground">
          {s.label}
        </span>
      )}
    </span>
  );
}
