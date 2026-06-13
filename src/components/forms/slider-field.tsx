"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SliderFieldProps {
  id: string;
  label: string;
  value: number[];
  onChange: (value: number[]) => void;
  low?: string;
  high?: string;
  invalid?: boolean;
  errorId?: string;
}

export function SliderField({
  id,
  label,
  value,
  onChange,
  low = "1",
  high = "10",
  invalid,
  errorId,
}: SliderFieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-sm font-semibold text-violet-600" aria-hidden="true">
          {value[0]}/10
        </span>
      </div>
      <Slider
        id={id}
        min={1}
        max={10}
        step={1}
        value={value}
        onValueChange={onChange}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value[0]}
        aria-label={`${label}: ${value[0]} out of 10`}
        aria-describedby={invalid && errorId ? errorId : undefined}
        aria-invalid={invalid || undefined}
      />
      <div className="mt-1 flex justify-between text-xs text-zinc-400">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
