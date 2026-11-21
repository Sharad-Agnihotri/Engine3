"use client";

import type { AudienceConfig, AudienceSize, PersonaDimensionKey } from "@/types";
import { AUDIENCE_SIZES, PERSONA_DIMENSIONS } from "@/lib/simulation/constants";
import { Field } from "@/components/common/field";
import { SliderField } from "@/components/common/slider-field";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TargetDemographicProps {
  audience: AudienceConfig;
  onPatch: (patch: Partial<AudienceConfig>) => void;
  onDimension: (key: PersonaDimensionKey, value: number) => void;
}

export function TargetDemographic({
  audience,
  onPatch,
  onDimension,
}: TargetDemographicProps) {
  return (
    <div className="space-y-4">
      <Field
        label="Target description"
        htmlFor="target-description"
        hint='e.g. "Solo founders and small teams running tech businesses"'
      >
        <Textarea
          id="target-description"
          value={audience.targetDescription}
          onChange={(e) => onPatch({ targetDescription: e.target.value })}
          placeholder="Technical founders, indie hackers, developers and early-stage startup operators interested in AI productivity tools."
          rows={3}
        />
      </Field>

      <Field label="Audience size" hint="Configured target population for reach metrics.">
        <Select
          value={String(audience.audienceSize)}
          onValueChange={(v) =>
            onPatch({ audienceSize: Number(v) as AudienceSize })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUDIENCE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size.toLocaleString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          Persona dimensions
        </p>
        <p className="text-2xs text-muted-foreground">
          Each weight controls how tightly generated personas cluster around the
          described target on that dimension. Low = broad spread, high = anchored.
        </p>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {PERSONA_DIMENSIONS.map((dim) => (
            <SliderField
              key={dim.key}
              label={dim.label}
              hint={dim.help}
              value={audience.dimensionWeights[dim.key]}
              onChange={(v) => onDimension(dim.key, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
