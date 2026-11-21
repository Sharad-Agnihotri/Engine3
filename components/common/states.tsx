import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border-strong bg-subtle/60 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-display text-xl text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 px-6 py-12 text-xs text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      {label}...
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  retry,
  className,
}: {
  title?: string;
  description?: string;
  retry?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-[13px] font-medium text-destructive">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {retry}
    </div>
  );
}
