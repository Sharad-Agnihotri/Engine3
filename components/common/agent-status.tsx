import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/types";

const STATUS: Record<AgentStatus, { color: string; label: string; pulse?: boolean }> = {
  online: { color: "bg-positive", label: "Online" },
  working: { color: "bg-plum", label: "Working", pulse: true },
  waiting: { color: "bg-caution", label: "Waiting" },
  blocked: { color: "bg-destructive", label: "Blocked" },
  error: { color: "bg-destructive", label: "Error" },
  offline: { color: "bg-muted-foreground/40", label: "Offline" },
};

export function AgentStatusDot({
  status,
  showLabel = true,
  className,
}: {
  status: AgentStatus;
  showLabel?: boolean;
  className?: string;
}) {
  const s = STATUS[status];
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

export function AgentAvatar({
  avatar,
  size = 28,
}: {
  avatar: string;
  size?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border border-border bg-elevated"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {avatar}
    </span>
  );
}
