"use client";

import { Slider } from "@/components/ui/slider";
import { Field } from "./field";

export function SliderField({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  format = (v) => `${Math.round(v * 100)}%`,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}) {
  return (
    <Field
      label={label}
      hint={hint}
      aside={<span className="tabular text-2xs font-medium text-foreground">{format(value)}</span>}
    >
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v ?? min)}
      />
    </Field>
  );
}
