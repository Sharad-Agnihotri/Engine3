"use client";

import { cn } from "@/lib/utils";
import { useInView } from "./hooks";

export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "p" | "h2" | "h3" | "li" | "span";
}) {
  const [ref, shown] = useInView<HTMLElement>(0.15);
  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      data-shown={shown}
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
