import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  emphasis = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "panel relative flex flex-col justify-between gap-5 p-5",
        emphasis && "border-clay/25 bg-clay/[0.04]",
        className,
      )}
    >
      <span className="eyebrow text-[10px]">{label}</span>
      <div className="space-y-1.5">
        <span
          className={cn(
            "tabular block font-display leading-none tracking-[-0.02em] text-foreground",
            emphasis ? "text-[34px]" : "text-[40px]",
          )}
        >
          {value}
        </span>
        {hint && (
          <span className="block text-xs leading-snug text-muted-foreground">{hint}</span>
        )}
      </div>
    </div>
  );
}
