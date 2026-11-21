"use client";

import type { SimulationRound } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

export function RoundLog({ rounds }: { rounds: SimulationRound[] }) {
  if (rounds.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-2xs text-muted-foreground">
        Round-by-round activity will appear here as the cascade runs.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {rounds.map((round) => (
          <div key={round.index} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-2xs font-semibold uppercase tracking-wide">
                {round.label}
              </p>
              <span className="text-2xs text-muted-foreground tabular">
                +{round.newlyExposed} exposed
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
              <Stat label="Likes" value={round.likes} />
              <Stat label="Comments" value={round.comments} />
              <Stat label="Shares" value={round.shares} accent />
              <Stat label="Saves" value={round.saves} />
              <Stat label="Follows" value={round.follows} />
              <Stat label="Ignored" value={round.ignores} muted />
            </div>
            {round.terminationReason && (
              <p className="mt-1.5 text-[10px] italic text-muted-foreground">
                Cascade stopped: {round.terminationReason}
              </p>
            )}
            {round.interactions.slice(0, 4).map((i) => (
              <p
                key={i.id}
                className="mt-1.5 border-l-2 border-border pl-2 text-2xs leading-snug text-muted-foreground"
              >
                <span className="font-medium capitalize text-foreground">{i.action}</span>{" "}
                — {i.reason}
              </p>
            ))}
            {round.interactions.length > 4 && (
              <p className="mt-1 pl-2 text-2xs text-muted-foreground">
                +{round.interactions.length - 4} more interactions
              </p>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function Stat({
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
    <div
      className={
        "border border-border py-1 " +
        (accent ? "bg-node-shared/10" : muted ? "bg-muted/50" : "bg-card")
      }
    >
      <p className="tabular text-xs font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
