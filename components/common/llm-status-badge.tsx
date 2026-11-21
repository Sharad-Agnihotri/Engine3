"use client";

import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LLMStatus {
  configured: boolean;
  provider: string;
  model: string;
  maxCallsPerRun: number;
  concurrency: number;
}

let cached: LLMStatus | null = null;

export function useLLMStatus(): LLMStatus | null {
  const [status, setStatus] = useState<LLMStatus | null>(cached);
  useEffect(() => {
    if (cached) return;
    void fetch("/api/llm/status")
      .then((r) => r.json())
      .then((s: LLMStatus) => {
        cached = s;
        setStatus(s);
      })
      .catch(() => setStatus({ configured: false, provider: "none", model: "deterministic", maxCallsPerRun: 0, concurrency: 0 }));
  }, []);
  return status;
}

export function LLMStatusBadge({ className }: { className?: string }) {
  const status = useLLMStatus();
  if (!status) return null;
  return (
    <Badge
      variant={status.configured ? "success" : "outline"}
      className={className}
      title={
        status.configured
          ? `LLM provider: ${status.provider} · model ${status.model} · ${status.concurrency} parallel · ${status.maxCallsPerRun} call cap`
          : "No LLM provider configured — AI mode falls back to the deterministic engine"
      }
    >
      <Cpu className="h-3 w-3" />
      {status.configured ? `${status.provider} · ${status.model}` : "deterministic"}
    </Badge>
  );
}
