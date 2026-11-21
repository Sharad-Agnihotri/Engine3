"use client";

import { useCallback, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Network } from "lucide-react";
import type {
  NetworkGraph as NetworkGraphModel,
  Persona,
  PersonaState,
  SimulationFrame,
} from "@/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/states";
import { GraphLegend } from "./graph-legend";
import { PersonaNode, type PersonaNodeData } from "./persona-node";

const nodeTypes = { persona: PersonaNode };

interface NetworkGraphProps {
  personas: Persona[];
  network: NetworkGraphModel | null;
  /** current playback frame; when null the graph shows only structure */
  frame: SimulationFrame | null;
  selectedPersonaId: string | null;
  onSelect: (id: string | null) => void;
}

const REACHED = new Set<PersonaState>([
  "exposed",
  "watched",
  "engaged",
  "liked",
  "commented",
  "shared",
  "saved",
  "followed",
  "ignored",
  "seed",
]);

function InnerGraph({
  personas,
  network,
  frame,
  selectedPersonaId,
  onSelect,
}: NetworkGraphProps) {
  const { fitView } = useReactFlow();

  const stateById = useMemo(() => {
    const map = new Map<string, PersonaState>();
    for (const p of personas) {
      map.set(p.id, frame ? frame.states[p.id] ?? p.currentState : p.currentState);
    }
    return map;
  }, [personas, frame]);

  const activeEdges = useMemo(
    () => new Set(frame?.activeEdgeIds ?? []),
    [frame],
  );

  const nodes = useMemo<Node<PersonaNodeData>[]>(() => {
    if (!network) return [];
    const posById = new Map(network.nodes.map((n) => [n.id, n]));
    return personas.map((p) => {
      const pos = posById.get(p.id);
      return {
        id: p.id,
        type: "persona",
        position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
        draggable: false,
        connectable: false,
        data: {
          label: `${p.name} · ${p.profession}`,
          state: stateById.get(p.id) ?? "neutral",
          isTarget: p.isTarget,
          isSeed: p.isSeed,
          influence: p.influenceScore,
          selected: p.id === selectedPersonaId,
        },
      };
    });
  }, [personas, network, stateById, selectedPersonaId]);

  const edges = useMemo<Edge[]>(() => {
    if (!network) return [];
    return network.connections
      .filter((c) => c.createdRound == null || (frame ? c.createdRound <= frame.round : true))
      .map((c) => {
        const active = activeEdges.has(c.id);
        const targetReached = REACHED.has(stateById.get(c.targetId) ?? "neutral");
        const isFollow = c.type === "follows" && c.createdRound != null;
        return {
          id: c.id,
          source: c.sourceId,
          target: c.targetId,
          style: {
            stroke: active
              ? isFollow
                ? "hsl(var(--plum))"
                : "hsl(var(--node-shared))"
              : targetReached
                ? "hsl(var(--muted-foreground))"
                : "hsl(var(--border))",
            strokeWidth: active ? 1.5 : 0.6,
            strokeDasharray: active ? undefined : "2 2",
            opacity: active ? 0.95 : targetReached ? 0.45 : 0.28,
          },
          animated: false,
        };
      });
  }, [network, activeEdges, stateById, frame]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => onSelect(node.id),
    [onSelect],
  );

  if (!network) {
    return (
      <EmptyState
        icon={Network}
        title="No network yet"
        description="Run the simulation to synthesise the persona population and generate the social graph."
        className="h-full"
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={() => onSelect(null)}
        minZoom={0.05}
        maxZoom={4}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="hsl(var(--border))" />
        <Controls showInteractive={false} position="top-left" />
      </ReactFlow>

      <div className="absolute right-3 top-3 z-10 flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 bg-card"
          onClick={() => fitView({ duration: 300, padding: 0.15 })}
        >
          <Maximize2 className="h-3 w-3" />
          Reset view
        </Button>
      </div>

      <GraphLegend />
    </div>
  );
}

export function NetworkGraph(props: NetworkGraphProps) {
  return (
    <ReactFlowProvider>
      <InnerGraph {...props} />
    </ReactFlowProvider>
  );
}
