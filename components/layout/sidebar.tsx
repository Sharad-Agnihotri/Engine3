"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  FileBarChart,
  Users,
  Bot,
  Settings,
  TicketCheck,
  Radio,
  Beaker,
  PanelLeftClose,
  PanelLeft,
  ArrowUpLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

const GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Simulate",
    items: [
      { href: "/simulations", label: "Simulations", icon: FlaskConical },
      { href: "/personas", label: "Personas", icon: Users },
      { href: "/experiments", label: "Experiments", icon: Beaker },
      { href: "/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    label: "Operate",
    items: [
      { href: "/agents", label: "Agents", icon: Bot },
      { href: "/tickets", label: "Tickets", icon: TicketCheck },
      { href: "/activity", label: "Activity", icon: Radio },
    ],
  },
];

export function Mark({ className }: { className?: string }) {
  // Three nodes, two ties — the product in one glyph.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="6" cy="17" r="2.6" fill="currentColor" />
      <circle cx="12.5" cy="7" r="2" fill="currentColor" opacity="0.75" />
      <circle cx="19" cy="15" r="1.6" fill="currentColor" opacity="0.5" />
      <path d="M7.6 15.2 11.3 8.8M14.3 8.1l3.6 5.4" stroke="currentColor" strokeWidth="1.1" opacity="0.6" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-subtle transition-[width] duration-300 ease-out",
        collapsed ? "w-[64px]" : "w-[232px]",
      )}
    >
      <Link
        href="/"
        className="group flex h-16 items-center gap-2.5 px-5"
        title="Back to the story"
      >
        <Mark className="h-6 w-6 shrink-0 text-foreground" />
        {!collapsed && (
          <span className="truncate font-display text-[19px] leading-none tracking-[-0.01em]">
            Virality<span className="italic text-muted-foreground"> Intel</span>
          </span>
        )}
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pt-2">
        {GROUPS.map((g) => (
          <div key={g.label} className="space-y-0.5">
            {!collapsed && <p className="eyebrow mb-2 px-2.5 text-[10px]">{g.label}</p>}
            {g.items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                    collapsed && "justify-center",
                    active
                      ? "bg-foreground/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute -left-3 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-clay" />
                  )}
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-border p-3">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
            collapsed && "justify-center",
            pathname.startsWith("/settings")
              ? "bg-foreground/[0.06] text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Settings className="h-4 w-4 shrink-0" strokeWidth={1.6} />
          {!collapsed && <span>Settings</span>}
        </Link>
        {!collapsed && (
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowUpLeft className="h-4 w-4 shrink-0" strokeWidth={1.6} />
            <span>Home</span>
          </Link>
        )}
        <button
          onClick={toggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" strokeWidth={1.6} />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.6} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
