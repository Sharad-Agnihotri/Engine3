"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSimulationStore } from "@/store/simulation-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NetworkGraph } from "@/features/network-graph/network-graph";
import { PersonaInspector } from "@/features/persona-inspector/persona-inspector";
import { VerdictPanel } from "@/features/verdict/verdict-panel";
import { SimulationStatusBar } from "@/features/status/simulation-status-bar";
import { EventStream } from "@/features/event-stream/event-stream";
import { InputSummary } from "./input-summary";
import { SimpleResults } from "@/features/results/simple-results";

export function SimulationWorkspace({ simulationId }: { simulationId: string }) {
  const params = useSearchParams();
  const active = useSimulationStore((s) => s.active);
  const activeStatus = useSimulationStore((s) => s.activeStatus);
  const frames = useSimulationStore((s) => s.frames);
  const playback = useSimulationStore((s) => s.playback);
  const agentProgress = useSimulationStore((s) => s.agentProgress);
  const loadSimulation = useSimulationStore((s) => s.loadSimulation);
  const startRun = useSimulationStore((s) => s.startRun);
  const cancelRun = useSimulationStore((s) => s.cancelRun);
  const replayRun = useSimulationStore((s) => s.replayRun);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const selectedPersonaId = useSimulationStore((s) => s.selectedPersonaId);
  const selectPersona = useSimulationStore((s) => s.selectPersona);
  const saveActive = useSimulationStore((s) => s.saveActive);

  const [tab, setTab] = useState("spread");
  // "simple" = the plain answer; "details" = the full analyst workspace.
  const [view, setView] = useState<"simple" | "details">("simple");
  const announcedVerdict = useRef(false);

  useEffect(() => {
    if (useSimulationStore.getState().active?.id !== simulationId) {
      void loadSimulation(simulationId);
    }
  }, [simulationId, loadSimulation]);

  useEffect(() => {
    if (
      params.get("run") === "1" &&
      active?.id === simulationId &&
      active.status === "draft"
    ) {
      startRun();
    }
  }, [params, active?.id, active?.status, simulationId, startRun]);

  // Jump to the verdict once, the first time a run finishes. Replays stay on the
  // current tab so the cascade can be re-watched.
  useEffect(() => {
    if (playback.finished && !announcedVerdict.current) {
      announcedVerdict.current = true;
      setTab("verdict");
      setView("simple");
    }
  }, [playback.finished]);

  // A fresh build resets the "announced" latch.
  useEffect(() => {
    if (active?.status === "analyzing") announcedVerdict.current = false;
  }, [active?.status]);

  const personasById = useMemo(
    () => new Map((active?.personas ?? []).map((p) => [p.id, p])),
    [active?.personas],
  );

  const frame = useMemo(() => {
    if (frames.length === 0) return null;
    const idx = Math.min(playback.round, frames.length - 1);
    return frames[idx] ?? null;
  }, [frames, playback.round]);

  if (activeStatus === "loading" || (!active && activeStatus === "idle")) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
        Loading simulation...
      </div>
    );
  }

  if (activeStatus === "error" || !active) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
        <p className="text-[13px] font-medium text-foreground">Simulation not found</p>
        <p>It may have been deleted or created in another browser.</p>
      </div>
    );
  }

  const resultsReady =
    active.status === "complete" && Boolean(active.verdict) && (playback.finished || !playback.playing);
  if (resultsReady && view === "simple") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <SimpleResults
          simulation={active}
          onWatchSpread={() => {
            setTab("spread");
            setView("details");
            replayRun();
          }}
          onDetails={() => {
            setTab("verdict");
            setView("details");
          }}
        />
      </div>
    );
  }

  const selectedPersona = selectedPersonaId
    ? personasById.get(selectedPersonaId) ?? null
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SimulationStatusBar
        simulation={active}
        playback={playback}
        agentProgress={agentProgress}
        onStart={startRun}
        onCancel={cancelRun}
        onReplay={replayRun}
        onPlay={play}
        onPause={pause}
        onSpeed={setSpeed}
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-border px-6">
              <TabsList className="border-0">
                <TabsTrigger value="input">Video</TabsTrigger>
                <TabsTrigger value="spread">Spread</TabsTrigger>
                <TabsTrigger value="verdict">Details</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-4">
                {resultsReady && (
                  <button
                    onClick={() => setView("simple")}
                    className="text-xs text-foreground underline-offset-4 hover:underline"
                  >
                    ← Simple result
                  </button>
                )}
                <button
                  onClick={() => void saveActive()}
                  className="text-2xs text-muted-foreground hover:text-foreground"
                >
                  Save
                </button>
              </div>
            </div>

            <TabsContent value="input" className="min-h-0 flex-1 overflow-auto p-6">
              <InputSummary simulation={active} />
            </TabsContent>

            <TabsContent value="spread" className="relative min-h-0 flex-1">
              <NetworkGraph
                personas={active.personas}
                network={active.network}
                frame={frame}
                selectedPersonaId={selectedPersonaId}
                onSelect={selectPersona}
              />
            </TabsContent>

            <TabsContent value="verdict" className="min-h-0 flex-1 overflow-auto p-6">
              <VerdictPanel verdict={active.verdict} metrics={active.metrics} projection={active.projection} rounds={active.rounds} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="flex w-[340px] shrink-0 flex-col border-l border-border bg-card">
          <div className="border-b border-border px-4 py-2">
            <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
              {selectedPersona ? "Persona inspector" : "Event stream"}
            </p>
          </div>
          <div className="min-h-0 flex-1">
            {selectedPersona ? (
              <PersonaInspector
                persona={selectedPersona}
                personasById={personasById}
                onClose={() => selectPersona(null)}
              />
            ) : (
              <EventStream
                events={active.events}
                rounds={active.rounds}
                personasById={personasById}
                currentRound={playback.round}
                finished={playback.finished}
                onSelectPersona={selectPersona}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
