"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { PersonaState } from "@/types";

export interface PersonaNodeData {
  label: string;
  state: PersonaState;
  isTarget: boolean;
  isSeed: boolean;
  influence: number;
  selected: boolean;
  [key: string]: unknown;
}

const STATE_RING: Record<PersonaState, string> = {
  neutral: "bg-node-neutral",
  target: "bg-node-target",
  exposed: "bg-node-target/60",
  watched: "bg-info",
  engaged: "bg-node-engaged",
  liked: "bg-info",
  commented: "bg-caution",
  shared: "bg-node-shared",
  saved: "bg-mist",
  followed: "bg-plum",
  ignored: "bg-node-neutral/40",
  seed: "bg-node-seed",
};

function PersonaNodeComponent({ data }: NodeProps) {
  const d = data as PersonaNodeData;
  const size = 10 + Math.round(d.influence * 12);

  return (
    <div
      className="group relative flex items-center justify-center"
      style={{ width: size, height: size }}
      title={d.label}
    >
      <Handle type="target" position={Position.Top} className="!h-0 !w-0 !min-w-0 !border-0 !bg-transparent" />
      <span
        className={cn(
          "block rounded-full transition-transform",
          STATE_RING[d.state],
          d.isSeed && "ring-2 ring-node-seed ring-offset-1 ring-offset-background",
          d.selected && "scale-150 ring-2 ring-primary ring-offset-2 ring-offset-background",
          !d.isSeed && d.isTarget && "ring-1 ring-node-target/40",
        )}
        style={{ width: size, height: size }}
      />
      <Handle type="source" position={Position.Bottom} className="!h-0 !w-0 !min-w-0 !border-0 !bg-transparent" />
    </div>
  );
}

export const PersonaNode = memo(PersonaNodeComponent);
