"use client";

import { create } from "zustand";
import type {
  ActivityEvent,
  Agent,
  AgentStatus,
  AudienceSize,
  Experiment,
  KnowledgeItem,
  Report,
  Ticket,
  TicketStatus,
  VideoAsset,
} from "@/types";
import { Collection } from "@/services/persistence/collections";
import { defaultAgents } from "@/lib/platform/agents";
import { activityCollection, logActivity, recentActivity } from "@/lib/platform/activity";
import { knowledgeCollection } from "@/lib/platform/knowledge";
import { experimentCollection, listExperiments } from "@/lib/platform/experiments";
import { reportCollection, listReports } from "@/lib/platform/reports-store";
import {
  createTicket as createTicketRow,
  listTickets,
  ticketCollection,
  updateTicket as updateTicketRow,
} from "@/lib/platform/tickets";
import { runAgentTask } from "@/lib/platform/task-executor";

const agentCollection = new Collection<Agent>("agents");

function loadAgents(): Agent[] {
  const stored = agentCollection.all();
  if (stored.length > 0) return stored;
  const seeded = defaultAgents();
  agentCollection.upsertMany(seeded);
  return seeded;
}

interface PlatformStore {
  hydrated: boolean;
  agents: Agent[];
  tickets: Ticket[];
  activity: ActivityEvent[];
  experiments: Experiment[];
  reports: Report[];
  knowledge: KnowledgeItem[];

  runningTicketId: string | null;
  taskLog: string[];

  hydrate: () => void;
  refresh: () => void;

  setAgentStatus: (id: string, status: AgentStatus, task?: string | null) => void;

  createTicket: (input: {
    title: string;
    description: string;
    audienceDescription: string;
    audienceSize: AudienceSize;
    priority?: Ticket["priority"];
    type?: Ticket["type"];
    video?: VideoAsset | null;
    parentExperimentId?: string | null;
    changeNote?: string | null;
    autoRun?: boolean;
  }) => Promise<Ticket>;
  setTicketStatus: (id: string, status: TicketStatus) => void;
  runTicket: (id: string) => Promise<void>;
}

interface TicketRunMeta {
  audienceDescription: string;
  audienceSize: AudienceSize;
  video: VideoAsset | null;
  randomSeed: number;
  parentExperimentId: string | null;
  changeNote: string | null;
}

const runMeta = new Collection<{ id: string } & TicketRunMeta>("ticket-run-meta");

export const usePlatformStore = create<PlatformStore>((set, get) => ({
  hydrated: false,
  agents: [],
  tickets: [],
  activity: [],
  experiments: [],
  reports: [],
  knowledge: [],
  runningTicketId: null,
  taskLog: [],

  hydrate: () => {
    if (get().hydrated) {
      get().refresh();
      return;
    }
    set({
      hydrated: true,
      agents: loadAgents(),
      tickets: listTickets(),
      activity: recentActivity(),
      experiments: listExperiments(),
      reports: listReports(),
      knowledge: knowledgeCollection.all(),
    });
  },

  refresh: () =>
    set({
      agents: agentCollection.all(),
      tickets: listTickets(),
      activity: recentActivity(),
      experiments: listExperiments(),
      reports: listReports(),
      knowledge: knowledgeCollection
        .all()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }),

  setAgentStatus: (id, status, task) => {
    const agent = agentCollection.get(id);
    if (!agent) return;
    const updated: Agent = {
      ...agent,
      status,
      currentTask: task === undefined ? agent.currentTask : task,
      lastActiveAt: new Date().toISOString(),
    };
    agentCollection.upsert(updated);
    set({ agents: agentCollection.all() });
  },

  createTicket: async (input) => {
    const ticket = createTicketRow({
      title: input.title,
      description: input.description,
      priority: input.priority,
      type: input.type ?? "simulation",
      status: "open",
    });
    runMeta.upsert({
      id: ticket.id,
      audienceDescription: input.audienceDescription,
      audienceSize: input.audienceSize,
      video: input.video ?? null,
      randomSeed: 40 + get().tickets.length * 7,
      parentExperimentId: input.parentExperimentId ?? null,
      changeNote: input.changeNote ?? null,
    });
    logActivity({
      level: "system",
      actor: "System",
      message: `Ticket ${ticket.code} created: ${ticket.title}`,
      ticketId: ticket.id,
    });
    get().refresh();
    if (input.autoRun) {
      // fire and forget — UI observes via runningTicketId + activity
      void get().runTicket(ticket.id);
    }
    return ticket;
  },

  setTicketStatus: (id, status) => {
    updateTicketRow(id, { status });
    get().refresh();
  },

  runTicket: async (id) => {
    if (get().runningTicketId) return;
    const meta = runMeta.get(id);
    const ticket = ticketCollection.get(id);
    if (!meta || !ticket) return;

    set({ runningTicketId: id, taskLog: [] });
    const simAgent = get().agents.find((a) => a.role === "simulation-agent");
    if (simAgent) get().setAgentStatus(simAgent.id, "working", ticket.title);

    try {
      await runAgentTask(
        id,
        get().agents,
        {
          audienceDescription: meta.audienceDescription,
          audienceSize: meta.audienceSize,
          video: meta.video,
          randomSeed: meta.randomSeed,
          parentExperimentId: meta.parentExperimentId,
          changeNote: meta.changeNote,
        },
        (agentRole, message) => {
          set((s) => ({ taskLog: [...s.taskLog, `${agentRole}: ${message}`] }));
        },
      );
    } catch (err) {
      updateTicketRow(id, {
        status: "blocked",
        result: err instanceof Error ? err.message : "Task failed",
      });
      logActivity({
        level: "error",
        actor: "System",
        message: `Ticket ${ticket.code} blocked: ${
          err instanceof Error ? err.message : "task failed"
        }`,
        ticketId: id,
      });
    } finally {
      if (simAgent) get().setAgentStatus(simAgent.id, "online", null);
      set({ runningTicketId: null });
      get().refresh();
    }
  },
}));

// keep collections referenced (tree-shake guard for side-effect stores)
void activityCollection;
void reportCollection;
void experimentCollection;
