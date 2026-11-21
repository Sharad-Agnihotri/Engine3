"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import type { Simulation } from "@/types";
import { persistence } from "@/services/persistence";
import { useSimulationStore } from "@/store/simulation-store";
import { formatPct, titleCase } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/common/states";
import { PersonaInspector } from "@/features/persona-inspector/persona-inspector";

type SegmentFilter = "all" | "target" | "out" | "seed" | "engaged";

export function PersonaExplorer() {
  const summaries = useSimulationStore((s) => s.summaries);
  const loadSummaries = useSimulationStore((s) => s.loadSummaries);
  const [simId, setSimId] = useState<string | null>(null);
  const [sim, setSim] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<SegmentFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  const populated = useMemo(
    () => summaries.filter((s) => s.status === "complete" || s.status === "cancelled"),
    [summaries],
  );

  useEffect(() => {
    if (!simId && populated.length > 0) setSimId(populated[0]!.id);
  }, [populated, simId]);

  useEffect(() => {
    if (!simId) return;
    setLoading(true);
    setSelectedId(null);
    void persistence.get(simId).then((s) => {
      setSim(s);
      setLoading(false);
    });
  }, [simId]);

  const personasById = useMemo(
    () => new Map((sim?.personas ?? []).map((p) => [p.id, p])),
    [sim?.personas],
  );

  const filtered = useMemo(() => {
    const list = sim?.personas ?? [];
    return list.filter((p) => {
      if (segment === "target" && !p.isTarget) return false;
      if (segment === "out" && p.isTarget) return false;
      if (segment === "seed" && !p.isSeed) return false;
      if (
        segment === "engaged" &&
        !["liked", "shared", "commented", "saved", "followed", "engaged"].includes(
          p.currentState,
        )
      )
        return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.profession.toLowerCase().includes(q) ||
          p.interests.some((i) => i.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [sim?.personas, segment, query]);

  if (populated.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No persona populations yet"
        description="Personas are synthesised when a simulation runs. Run one to explore its audience here."
        action={
          <Link href="/simulations/new" className="text-2xs text-primary hover:underline">
            New simulation
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={simId ?? undefined} onValueChange={setSimId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a simulation" />
            </SelectTrigger>
            <SelectContent>
              {populated.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={segment} onValueChange={(v) => setSegment(v as SegmentFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All personas</SelectItem>
              <SelectItem value="target">In-target</SelectItem>
              <SelectItem value="out">Out-of-target</SelectItem>
              <SelectItem value="seed">Seeds</SelectItem>
              <SelectItem value="engaged">Engaged</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search name, profession, interest"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-56"
          />
          <span className="text-2xs text-muted-foreground tabular">
            {filtered.length} / {sim?.personas.length ?? 0}
          </span>
        </div>

        {loading ? (
          <LoadingState label="Loading personas" />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-subtle">
                <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Profession</th>
                  <th className="px-3 py-2 font-medium">Segment</th>
                  <th className="px-3 py-2 font-medium">State</th>
                  <th className="px-3 py-2 font-medium">Influence</th>
                  <th className="px-3 py-2 font-medium">Fit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={
                      "cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 " +
                      (selectedId === p.id ? "bg-primary/5" : "")
                    }
                  >
                    <td className="px-3 py-1.5 font-medium">{p.name}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{p.profession}</td>
                    <td className="px-3 py-1.5">
                      {p.isSeed ? (
                        <Badge>Seed</Badge>
                      ) : p.isTarget ? (
                        <Badge variant="primary">Target</Badge>
                      ) : (
                        <Badge variant="warning">Out</Badge>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {titleCase(p.currentState)}
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted-foreground">
                      {formatPct(p.influenceScore)}
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted-foreground">
                      {formatPct(p.audienceFit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="w-[320px] shrink-0 border border-border bg-card">
        <PersonaInspector
          persona={selectedId ? personasById.get(selectedId) ?? null : null}
          personasById={personasById}
          onClose={() => setSelectedId(null)}
        />
      </aside>
    </div>
  );
}
