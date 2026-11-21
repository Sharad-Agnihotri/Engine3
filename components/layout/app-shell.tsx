"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />
        <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          {/* faint warm light from the top edge — gives depth without colour */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,hsl(var(--foreground)/0.035),transparent)]"
          />
          <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-border px-8 pb-6 pt-8">
      <div className="min-w-0">
        {breadcrumb ? (
          <div className="eyebrow mb-3">{breadcrumb}</div>
        ) : eyebrow ? (
          <div className="eyebrow mb-3">{eyebrow}</div>
        ) : null}
        <h1 className="truncate font-display text-[40px] leading-[1.05] tracking-[-0.015em] text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
