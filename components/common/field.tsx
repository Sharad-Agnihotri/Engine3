import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
  aside,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {aside}
      </div>
      {children}
      {hint && <p className="text-2xs leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionHeading({
  index,
  title,
  description,
  action,
}: {
  index: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2">
      <div className="flex items-baseline gap-2">
        <span className="tabular text-2xs font-semibold text-muted-foreground">
          {index}
        </span>
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
