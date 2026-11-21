"use client";

import { useEffect, useState } from "react";
import { useSimulationStore } from "@/store/simulation-store";
import { persistence } from "@/services/persistence";
import { DEFAULT_SIM_CONFIG } from "@/lib/simulation/constants";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLLMStatus } from "@/components/common/llm-status-badge";

interface AuditEntry {
  ts: string;
  action: string;
  resource: string;
  detail: string;
}

export default function SettingsPage() {
  const summaries = useSimulationStore((s) => s.summaries);
  const loadSummaries = useSimulationStore((s) => s.loadSummaries);
  const llm = useLLMStatus();
  const [cleared, setCleared] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  useEffect(() => {
    void loadSummaries();
    void fetch("/api/audit")
      .then((r) => r.json())
      .then((rows: AuditEntry[]) => setAudit(rows))
      .catch(() => setAudit([]));
  }, [loadSummaries]);

  const clearAll = async () => {
    await Promise.all(summaries.map((s) => persistence.remove(s.id)));
    await loadSummaries();
    setCleared(true);
  };

  return (
    <>
      <PageHeader title="Settings" description="Environment, defaults and data management." />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Persistence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Row
                k="Active adapter"
                v={<Badge variant="outline">{persistence.id}</Badge>}
              />
              <p className="text-muted-foreground">
                Phase 1 stores simulations in the browser via localStorage. Set{" "}
                <code className="rounded bg-muted px-1">DATABASE_URL</code> and{" "}
                <code className="rounded bg-muted px-1">NEXT_PUBLIC_PERSISTENCE=api</code> to
                use the PostgreSQL-backed API store.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI / LLM provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Row
                k="Status"
                v={
                  <Badge variant={llm?.configured ? "success" : "outline"}>
                    {llm?.configured ? "configured" : "not configured"}
                  </Badge>
                }
              />
              <Row k="Provider" v={<span className="tabular">{llm?.provider ?? "…"}</span>} />
              <Row k="Model" v={<span className="tabular">{llm?.model ?? "…"}</span>} />
              <Row k="Parallel requests" v={<span className="tabular">{llm?.concurrency ?? "…"}</span>} />
              <Row k="Call cap / run" v={<span className="tabular">{llm?.maxCallsPerRun ?? "…"}</span>} />
              <p className="text-muted-foreground">
                Set <code className="rounded bg-muted px-1">LLM_PROVIDER</code> (
                <code>openai</code> / <code>anthropic</code> / <code>local</code>),{" "}
                <code className="rounded bg-muted px-1">MODEL_NAME</code> and an API key to enable AI
                agent mode. Keys stay server-side; when unset, AI mode falls back to the deterministic
                engine.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-2xs">
              {audit.length === 0 ? (
                <p className="text-muted-foreground">No server-side actions recorded yet.</p>
              ) : (
                audit.slice(0, 20).map((e, i) => (
                  <div key={i} className="flex gap-2 border-b border-border/50 py-0.5">
                    <span className="tabular shrink-0 text-muted-foreground">
                      {new Date(e.ts).toLocaleTimeString()}
                    </span>
                    <span className="font-medium">{e.action}</span>
                    <span className="truncate text-muted-foreground">
                      {e.resource} — {e.detail}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default simulation config</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
              {Object.entries(DEFAULT_SIM_CONFIG).map(([k, v]) => (
                <Row key={k} k={k} v={<span className="tabular">{String(v)}</span>} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                {summaries.length} stored simulation(s).
              </p>
              <Button variant="destructive" size="sm" onClick={clearAll}>
                Delete all simulations
              </Button>
              {cleared && (
                <p className="text-2xs text-muted-foreground">All simulations removed.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
