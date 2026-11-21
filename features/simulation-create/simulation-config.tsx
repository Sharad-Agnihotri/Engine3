"use client";

import { Bot, RotateCcw } from "lucide-react";
import type { SimulationConfig } from "@/types";
import { DEFAULT_SIM_CONFIG, TOKENS_PER_AGENT_CALL } from "@/lib/simulation/constants";
import { Field } from "@/components/common/field";
import { SliderField } from "@/components/common/slider-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLLMStatus } from "@/components/common/llm-status-badge";
import { cn } from "@/lib/utils";

interface SimulationConfigFormProps {
  config: SimulationConfig;
  onPatch: (patch: Partial<SimulationConfig>) => void;
  /** rough population size for the AI cost estimate */
  audienceSize?: number;
}

export function SimulationConfigForm({
  config,
  onPatch,
  audienceSize = 100,
}: SimulationConfigFormProps) {
  const llm = useLLMStatus();
  const engagementSum =
    config.likeProbability +
    config.commentProbability +
    config.shareProbability +
    config.ignoreProbability;

  const agentCount = Math.min(config.maxAgents, audienceSize, 300);
  const estCalls = Math.min(Math.round(agentCount * 0.65), config.maxLlmCalls);
  const estTokens = estCalls * TOKENS_PER_AGENT_CALL;
  const rate = llm?.provider === "anthropic" ? 0.0009 : llm?.provider === "openai" ? 0.0004 : 0;
  const estCost = ((estTokens / 1000) * rate).toFixed(3);
  const bigRun = estCalls > 150;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "space-y-3 border p-3",
          config.aiMode ? "border-primary/40 bg-primary/5" : "border-border bg-subtle",
        )}
      >
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={config.aiMode}
            onChange={(e) => onPatch({ aiMode: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            <span className="flex items-center gap-1.5 text-[13px] font-medium">
              <Bot className="h-3.5 w-3.5" />
              AI agent mode
              {llm && (
                <Badge variant={llm.configured ? "success" : "outline"}>
                  {llm.configured ? `${llm.provider} · ${llm.model}` : "no provider — deterministic"}
                </Badge>
              )}
            </span>
            <span className="mt-0.5 block text-2xs text-muted-foreground">
              Each persona reacts as an autonomous LLM agent (structured JSON, validated, with a
              deterministic fallback). Runs server-side; the provider key is never sent to the browser.
            </span>
          </span>
        </label>

        {config.aiMode && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-3 sm:grid-cols-3">
            <Field label="Max agents" hint="Population cap for AI runs (hard cap 300).">
              <Input
                type="number"
                min={10}
                max={300}
                value={config.maxAgents}
                onChange={(e) => onPatch({ maxAgents: clampInt(e.target.value, 10, 300) })}
              />
            </Field>
            <Field label="Max LLM calls" hint="Hard ceiling on total model calls this run.">
              <Input
                type="number"
                min={10}
                max={800}
                value={config.maxLlmCalls}
                onChange={(e) => onPatch({ maxLlmCalls: clampInt(e.target.value, 10, 800) })}
              />
            </Field>
            <Field label="Estimated cost" hint={`~${estCalls} calls · ~${estTokens.toLocaleString()} tokens`}>
              <div className="flex h-8 items-center text-[13px] font-medium tabular">
                {llm?.configured && rate > 0 ? `$${estCost}` : "$0.00 (local / none)"}
              </div>
            </Field>
            {bigRun && (
              <p className="col-span-full text-2xs text-caution">
                Large run — ~{estCalls} model calls. Consider lowering the audience size or Max agents
                to keep latency and cost down.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        <Field label="Seed count" hint="Initial agents that receive the content.">
          <Input
            type="number"
            min={1}
            max={Math.max(1, Math.floor(config.rounds * 20))}
            value={config.seedCount}
            onChange={(e) => onPatch({ seedCount: clampInt(e.target.value, 1, 200) })}
          />
        </Field>
        <Field label="Simulation rounds" hint="Propagation waves to simulate.">
          <Input
            type="number"
            min={1}
            max={8}
            value={config.rounds}
            onChange={(e) => onPatch({ rounds: clampInt(e.target.value, 1, 8) })}
          />
        </Field>
        <Field label="Random seed" hint="Deterministic reproduction key.">
          <Input
            type="number"
            value={config.randomSeed}
            onChange={(e) => onPatch({ randomSeed: clampInt(e.target.value, 0, 10_000_000) })}
          />
        </Field>
      </div>

      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <SliderField
          label="Network density"
          hint="Probability compatible personas are connected."
          value={config.networkDensity}
          min={0.02}
          max={0.5}
          onChange={(v) => onPatch({ networkDensity: v })}
        />
        <SliderField
          label="Content quality"
          hint="Overall production and message quality."
          value={config.contentQuality}
          onChange={(v) => onPatch({ contentQuality: v })}
        />
        <SliderField
          label="Audience relevance"
          hint="How well the content matches the described audience."
          value={config.audienceRelevance}
          onChange={(v) => onPatch({ audienceRelevance: v })}
        />
        <SliderField
          label="Initial engagement probability"
          hint="Baseline chance an exposed persona engages at all."
          value={config.initialEngagementProbability}
          onChange={(v) => onPatch({ initialEngagementProbability: v })}
        />
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Action propensities
          </p>
          <span
            className={
              "text-2xs tabular " +
              (engagementSum > 1.4 ? "text-caution" : "text-muted-foreground")
            }
          >
            Σ {engagementSum.toFixed(2)}
          </span>
        </div>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <SliderField
            label="Share probability"
            value={config.shareProbability}
            onChange={(v) => onPatch({ shareProbability: v })}
          />
          <SliderField
            label="Comment probability"
            value={config.commentProbability}
            onChange={(v) => onPatch({ commentProbability: v })}
          />
          <SliderField
            label="Like probability"
            value={config.likeProbability}
            onChange={(v) => onPatch({ likeProbability: v })}
          />
          <SliderField
            label="Ignore probability"
            value={config.ignoreProbability}
            onChange={(v) => onPatch({ ignoreProbability: v })}
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => onPatch({ ...DEFAULT_SIM_CONFIG })}
      >
        <RotateCcw className="h-3 w-3" />
        Reset to defaults
      </Button>
    </div>
  );
}

function clampInt(raw: string, min: number, max: number): number {
  const n = Math.round(Number(raw));
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
