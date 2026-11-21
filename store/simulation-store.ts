"use client";

import { create } from "zustand";
import type {
  AudienceConfig,
  ContentProfile,
  PersonaDimensionKey,
  PlaybackSpeed,
  PlaybackState,
  Simulation,
  SimulationConfig,
  SimulationFrame,
  SimulationPhaseState,
  SimulationSummary,
  VideoAsset,
} from "@/types";
import { persistence } from "@/services/persistence";
import { runSimulationBuild, type BuildControls } from "@/lib/simulation/runner";
import { runAiSimulation } from "@/lib/simulation/ai-run-client";
import type { SimulationOutput } from "@/lib/simulation/engine";
import { buildFrames, maxRoundOf } from "@/lib/simulation/frames";
import { PlaybackController } from "@/lib/simulation/playback";
import type { BatchProgress } from "@/lib/agents/agent-batch-executor";
import { captureSimulationKnowledge } from "@/lib/platform/knowledge";
import { logActivity } from "@/lib/platform/activity";
import {
  applyProfileToConfig,
  createEmptyDraft,
  draftToSimulation,
  type DraftState,
} from "./draft";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const idlePlayback: PlaybackState = {
  round: 0,
  maxRound: 0,
  playing: false,
  finished: false,
  speed: 1,
};

interface SimulationStore {
  // ---- list -----------------------------------------------------------
  summaries: SimulationSummary[];
  listStatus: "idle" | "loading" | "ready" | "error";
  loadSummaries: () => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;

  // ---- draft ---------------------------------------------------------
  draft: DraftState;
  setDraftName: (name: string) => void;
  setDraftVideo: (video: VideoAsset | null) => void;
  setContentProfile: (profile: ContentProfile | null) => void;
  patchAudience: (patch: Partial<AudienceConfig>) => void;
  setDimensionWeight: (key: PersonaDimensionKey, value: number) => void;
  patchConfig: (patch: Partial<SimulationConfig>) => void;
  resetDraft: () => void;

  // ---- active simulation ------------------------------------------
  active: Simulation | null;
  activeStatus: "idle" | "loading" | "ready" | "error";
  frames: SimulationFrame[];
  loadSimulation: (id: string) => Promise<void>;
  createDraftSimulation: () => Promise<Simulation>;
  clearActive: () => void;
  saveActive: () => Promise<void>;

  // ---- build + playback -----------------------------------------
  build: BuildControls | null;
  playback: PlaybackState;
  agentProgress: BatchProgress | null;
  startRun: () => void;
  cancelRun: () => void;
  replayRun: () => void;
  play: () => void;
  pause: () => void;
  seekRound: (round: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;

  // ---- inspector -----------------------------------------------
  selectedPersonaId: string | null;
  selectPersona: (id: string | null) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => {
  // One playback controller for the store's lifetime.
  const playback = new PlaybackController((tick) => {
    set((s) => ({
      playback: { ...s.playback, ...tick },
      active: s.active
        ? {
            ...s.active,
            phase: {
              ...s.active.phase,
              status: tick.finished ? "complete" : "running",
              message: tick.finished
                ? "Simulation complete"
                : `Round ${tick.round} / ${s.playback.maxRound}`,
              currentRound: tick.round,
              totalRounds: s.playback.maxRound,
              progress: s.playback.maxRound ? tick.round / s.playback.maxRound : 1,
            },
            status: tick.finished ? "complete" : "running",
          }
        : s.active,
    }));
    if (tick.finished) {
      void get().saveActive();
      const done = get().active;
      if (done && done.metrics && done.verdict) {
        try {
          captureSimulationKnowledge(done);
          logActivity({
            level: "system",
            actor: "System",
            message: `Simulation "${done.name}" complete — verdict ${done.verdict.label}`,
            simulationId: done.id,
          });
        } catch {
          /* platform layer is best-effort */
        }
      }
    }
  });

  const mutateActive = (fn: (sim: Simulation) => Simulation) => {
    const active = get().active;
    if (!active) return;
    set({ active: fn(active) });
  };

  const applyOutput = (runId: string, out: SimulationOutput) => {
    if (get().active?.id !== runId) return;
    const maxRound = maxRoundOf(out.events);
    mutateActive((s) => ({
      ...s,
      status: "running",
      contentProfile: out.contentProfile,
      personas: out.personas,
      network: out.network,
      seedIds: out.seedIds,
      rounds: out.rounds,
      events: out.events,
      metrics: out.metrics,
      verdict: out.verdict,
      projection: out.projection,
      instagram: out.instagram,
      agentRun: out.agentRun,
      updatedAt: new Date().toISOString(),
      phase: {
        status: "running",
        message: maxRound ? `Round 0 / ${maxRound}` : "Simulation complete",
        currentRound: 0,
        totalRounds: maxRound,
        progress: 0,
      },
    }));
    const frames = buildFrames(out.personas, out.network, out.events, maxRound);
    set({
      frames,
      agentProgress: null,
      playback: { ...idlePlayback, maxRound, speed: get().playback.speed },
    });
    playback.load(maxRound, { autoplay: true, speed: get().playback.speed });
  };

  const beginAiBuild = (sim: Simulation) => {
    get().build?.cancel();
    playback.pause();
    const runId = sim.id;
    logActivity({
      level: "system",
      actor: "System",
      message: `AI-agent simulation started for "${sim.name}"`,
      simulationId: sim.id,
    });
    const controls = runAiSimulation(
      {
        audience: sim.audience,
        config: sim.config,
        video: sim.video,
        contentProfile: sim.contentProfile,
        simulationId: sim.id,
      },
      {
        onPhase: (phase) => {
          if (get().active?.id !== runId) return;
          mutateActive((s) => ({
            ...s,
            status: phase.status,
            phase: {
              status: phase.status,
              message: phase.message,
              currentRound: 0,
              totalRounds: s.config.rounds,
              progress: phase.progress,
            },
          }));
        },
        onAgentProgress: (p) => {
          if (get().active?.id !== runId) return;
          set({ agentProgress: p });
          mutateActive((s) => ({
            ...s,
            phase: {
              ...s.phase,
              status: "running",
              message: p.label,
              progress: 0.55 + (p.total ? (p.completed / p.total) * 0.35 : 0),
            },
          }));
        },
        onResult: (output) => applyOutput(runId, output),
        onError: (message) => {
          if (get().active?.id !== runId) return;
          set({ agentProgress: null });
          mutateActive((s) => ({
            ...s,
            status: "error",
            phase: { ...s.phase, status: "error", message },
          }));
        },
      },
    );
    set({ build: controls, agentProgress: null });
  };

  const beginBuild = (sim: Simulation) => {
    get().build?.cancel();
    playback.pause();
    const runId = sim.id;
    const controls = runSimulationBuild(
      { audience: sim.audience, config: sim.config, video: sim.video, contentProfile: sim.contentProfile },
      {
        onPhase: (phase) => {
          if (get().active?.id !== runId) return;
          mutateActive((s) => ({ ...s, phase, status: phase.status }));
        },
        onResult: (output) => applyOutput(runId, output),
        onCancelled: () => {
          if (get().active?.id !== runId) return;
          mutateActive((s) => ({
            ...s,
            status: "cancelled",
            phase: { ...s.phase, status: "cancelled", message: "Simulation cancelled" },
          }));
        },
        onError: (message) => {
          if (get().active?.id !== runId) return;
          mutateActive((s) => ({
            ...s,
            status: "error",
            phase: { ...s.phase, status: "error", message },
          }));
        },
      },
    );
    set({ build: controls });
  };

  const rebuildFramesFor = (sim: Simulation) => {
    const maxRound = maxRoundOf(sim.events);
    const frames =
      sim.events.length > 0
        ? buildFrames(sim.personas, sim.network, sim.events, maxRound)
        : [];
    const finished = sim.status === "complete";
    set({
      frames,
      playback: {
        round: finished ? maxRound : 0,
        maxRound,
        playing: false,
        finished,
        speed: get().playback.speed,
      },
    });
    playback.load(maxRound, { autoplay: false, speed: get().playback.speed });
    if (finished) playback.seek(maxRound);
  };

  return {
    summaries: [],
    listStatus: "idle",
    async loadSummaries() {
      set({ listStatus: "loading" });
      try {
        set({ summaries: await persistence.list(), listStatus: "ready" });
      } catch {
        set({ listStatus: "error" });
      }
    },
    async deleteSimulation(id) {
      await persistence.remove(id);
      set((s) => ({
        summaries: s.summaries.filter((x) => x.id !== id),
        active: s.active?.id === id ? null : s.active,
      }));
    },

    draft: createEmptyDraft(),
    setDraftName: (name) => set((s) => ({ draft: { ...s.draft, name } })),
    setDraftVideo: (video) => set((s) => ({ draft: { ...s.draft, video } })),
    setContentProfile: (profile) =>
      set((s) => ({
        draft: {
          ...s.draft,
          contentProfile: profile,
          config: profile ? applyProfileToConfig(s.draft.config, profile) : s.draft.config,
        },
      })),
    patchAudience: (patch) =>
      set((s) => ({ draft: { ...s.draft, audience: { ...s.draft.audience, ...patch } } })),
    setDimensionWeight: (key, value) =>
      set((s) => ({
        draft: {
          ...s.draft,
          audience: {
            ...s.draft.audience,
            dimensionWeights: { ...s.draft.audience.dimensionWeights, [key]: value },
          },
        },
      })),
    patchConfig: (patch) =>
      set((s) => ({ draft: { ...s.draft, config: { ...s.draft.config, ...patch } } })),
    resetDraft: () => set({ draft: createEmptyDraft() }),

    active: null,
    activeStatus: "idle",
    frames: [],

    async loadSimulation(id) {
      if (get().active?.id !== id) {
        get().build?.cancel();
        playback.pause();
        set({ build: null, frames: [], playback: { ...idlePlayback } });
      }
      set({ activeStatus: "loading", selectedPersonaId: null });
      try {
        const sim = await persistence.get(id);
        if (!sim) {
          set({ activeStatus: "error", active: null });
          return;
        }
        // Keep a live in-memory run rather than a stale persisted copy.
        if (get().active?.id === id && get().active?.status !== "draft") {
          set({ activeStatus: "ready" });
          return;
        }
        set({ active: normalize(sim), activeStatus: "ready" });
        rebuildFramesFor(get().active!);
      } catch {
        set({ activeStatus: "error" });
      }
    },

    async createDraftSimulation() {
      const sim = draftToSimulation(get().draft, uid("sim"));
      await persistence.save(sim);
      set((s) => ({
        active: sim,
        activeStatus: "ready",
        frames: [],
        playback: { ...idlePlayback },
        summaries: [summaryOf(sim), ...s.summaries.filter((x) => x.id !== sim.id)],
      }));
      return sim;
    },

    clearActive: () => {
      get().build?.cancel();
      playback.pause();
      set({
        active: null,
        build: null,
        frames: [],
        playback: { ...idlePlayback },
        selectedPersonaId: null,
        activeStatus: "idle",
      });
    },

    async saveActive() {
      const active = get().active;
      if (!active) return;
      const stamped = { ...active, updatedAt: new Date().toISOString() };
      set((s) => ({
        summaries: [summaryOf(stamped), ...s.summaries.filter((x) => x.id !== stamped.id)],
        active: s.active?.id === stamped.id ? { ...s.active, updatedAt: stamped.updatedAt } : s.active,
      }));
      await persistence.save({ ...(get().active ?? stamped) });
    },

    // ---- build + playback -------------------------------------
    build: null,
    playback: { ...idlePlayback },
    agentProgress: null,

    startRun: () => {
      const active = get().active;
      if (!active) return;
      set({ selectedPersonaId: null, frames: [], agentProgress: null });
      mutateActive((s) => ({
        ...s,
        personas: [],
        network: null,
        rounds: [],
        events: [],
        metrics: null,
        verdict: null,
        projection: null,
        instagram: null,
        agentRun: null,
        status: "analyzing",
        phase: {
          status: "analyzing",
          message: active.config.aiMode
            ? "Starting AI-agent simulation..."
            : "Starting simulation...",
          currentRound: 0,
          totalRounds: s.config.rounds,
          progress: 0,
        },
      }));
      if (get().active!.config.aiMode) beginAiBuild(get().active!);
      else beginBuild(get().active!);
    },

    cancelRun: () => {
      get().build?.cancel();
      playback.pause();
    },

    replayRun: () => {
      const active = get().active;
      if (!active) return;
      set({ selectedPersonaId: null });
      if (get().frames.length > 0 && active.events.length > 0) {
        // Replay the cascade animation without recomputing.
        mutateActive((s) => ({ ...s, status: "running" }));
        playback.replay();
      } else {
        get().startRun();
      }
    },

    play: () => playback.play(),
    pause: () => playback.pause(),
    seekRound: (round) => playback.seek(round),
    setSpeed: (speed) => {
      playback.setSpeed(speed);
      set((s) => ({ playback: { ...s.playback, speed } }));
    },

    selectedPersonaId: null,
    selectPersona: (id) => set({ selectedPersonaId: id }),
  };
});

// ---------------------------------------------------------------------------

function summaryOf(sim: Simulation): SimulationSummary {
  return {
    id: sim.id,
    name: sim.name,
    createdAt: sim.createdAt,
    updatedAt: sim.updatedAt,
    status: sim.status,
    audienceSize: sim.audience.audienceSize,
    verdictLabel: sim.verdict?.label ?? null,
    totalReachPct: sim.metrics?.totalReachPct ?? null,
  };
}

/** Tolerate simulations persisted by an earlier build. */
function normalize(sim: Simulation): Simulation {
  return {
    ...sim,
    seedIds: sim.seedIds ?? [],
    events: sim.events ?? [],
    contentProfile: sim.contentProfile ?? null,
    personas: sim.personas ?? [],
    rounds: sim.rounds ?? [],
    agentRun: sim.agentRun ?? null,
    projection: sim.projection ?? null,
    config: Object.assign(
      { aiMode: false, maxAgents: 120, maxLlmCalls: 300 },
      sim.config,
    ),
  };
}
