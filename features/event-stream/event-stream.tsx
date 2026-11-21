"use client";

import { useMemo } from "react";
import type { Persona, SimulationEvent, SimulationRound } from "@/types";
import { cn, titleCase } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const ACTION_VARIANT: Record<
  string,
  "default" | "primary" | "success" | "warning" | "danger" | "outline"
> = {
  seed: "default",
  watch: "outline",
  like: "primary",
  comment: "warning",
  share: "success",
  save: "primary",
  follow: "primary",
  ignore: "outline",
  exposed: "outline",
};

interface EventStreamProps {
  events: SimulationEvent[];
  rounds: SimulationRound[];
  personasById: Map<string, Persona>;
  /** events with round <= this are visible; ignored when finished */
  currentRound: number;
  finished: boolean;
  onSelectPersona: (id: string) => void;
}

export function EventStream({
  events,
  rounds,
  personasById,
  currentRound,
  finished,
  onSelectPersona,
}: EventStreamProps) {
  const grouped = useMemo(() => {
    const cutoff = finished ? Infinity : currentRound;
    const visible = events.filter(
      (e) => e.round <= cutoff && e.action !== "exposed",
    );
    const byRound = new Map<number, SimulationEvent[]>();
    for (const e of visible) {
      const list = byRound.get(e.round) ?? [];
      list.push(e);
      byRound.set(e.round, list);
    }
    return [...byRound.entries()].sort((a, b) => b[0] - a[0]);
  }, [events, currentRound, finished]);

  if (events.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-2xs text-muted-foreground">
        The event stream fills in as the cascade propagates round by round.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {grouped.map(([round, roundEvents]) => {
          const summary = rounds.find((r) => r.index === round);
          return (
            <section key={round} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-2xs font-semibold uppercase tracking-wide">
                  {round === 0 ? "Round 0 · seeding" : `Round ${round}`}
                </p>
                {summary && (
                  <span className="tabular text-2xs text-muted-foreground">
                    +{summary.newlyExposed} exposed
                  </span>
                )}
              </div>

              {summary && round > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1 text-2xs text-muted-foreground">
                  <Tally label="likes" value={summary.likes} />
                  <Tally label="comments" value={summary.comments} />
                  <Tally label="shares" value={summary.shares} accent />
                  <Tally label="saves" value={summary.saves} />
                  <Tally label="follows" value={summary.follows} />
                  <Tally label="ignored" value={summary.ignores} muted />
                </div>
              )}

              <ul className="mt-2 space-y-2">
                {roundEvents.map((e) => {
                  const persona = personasById.get(e.personaId);
                  return (
                    <li key={e.id} className="border-l-2 border-border pl-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectPersona(e.personaId)}
                          className="text-xs font-medium hover:underline"
                        >
                          {persona?.name ?? e.personaId}
                        </button>
                        <Badge variant={ACTION_VARIANT[e.action] ?? "outline"}>
                          {titleCase(e.action)}
                        </Badge>
                        {e.action !== "seed" && (
                          <span className="tabular text-[10px] text-muted-foreground">
                            p={e.probability.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">
                        {e.reason}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function Tally({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: number;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded border border-border px-1 py-0.5 tabular",
        accent && "border-node-shared/30 bg-node-shared/10 text-node-shared",
        muted && "text-muted-foreground/70",
      )}
    >
      {value} {label}
    </span>
  );
}
