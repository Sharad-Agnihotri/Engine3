import type {
  AudienceConfig,
  ContentProfile,
  PersonaDimensionKey,
  Simulation,
  SimulationConfig,
  VideoAsset,
} from "@/types";
import { DEFAULT_AUDIENCE, DEFAULT_SIM_CONFIG } from "@/lib/simulation/constants";

export interface DraftState {
  name: string;
  video: VideoAsset | null;
  contentProfile: ContentProfile | null;
  audience: AudienceConfig;
  config: SimulationConfig;
}

export function createEmptyDraft(): DraftState {
  return {
    name: "",
    video: null,
    contentProfile: null,
    audience: structuredClone(DEFAULT_AUDIENCE),
    config: { ...DEFAULT_SIM_CONFIG },
  };
}

/** Fold an analysed content profile into config defaults without clobbering user edits. */
export function applyProfileToConfig(
  config: SimulationConfig,
  profile: ContentProfile,
): SimulationConfig {
  return {
    ...config,
    contentQuality: Number(
      ((profile.visualQuality + profile.estimatedWatchThrough) / 2).toFixed(2),
    ),
    audienceRelevance: Number(
      (profile.utility * 0.5 + profile.credibility * 0.3 + profile.novelty * 0.2).toFixed(2),
    ),
  };
}

export function draftToSimulation(draft: DraftState, id: string): Simulation {
  const now = new Date().toISOString();
  return {
    id,
    name: draft.name.trim() || "Untitled simulation",
    createdAt: now,
    updatedAt: now,
    status: "draft",
    video: draft.video,
    contentProfile: draft.contentProfile,
    audience: structuredClone(draft.audience),
    config: { ...draft.config },
    personas: [],
    network: null,
    seedIds: [],
    rounds: [],
    events: [],
    metrics: null,
    verdict: null,
    projection: null,
    agentRun: null,
    phase: {
      status: "draft",
      message: "Not started",
      currentRound: 0,
      totalRounds: draft.config.rounds,
      progress: 0,
    },
  };
}

export type DimensionWeightPatch = {
  key: PersonaDimensionKey;
  value: number;
};
