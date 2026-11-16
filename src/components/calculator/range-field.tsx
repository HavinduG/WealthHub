"use client";

import { useId } from "react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/**
 * A labelled slider with its value in a pill and the range ends underneath.
 * The value updates instantly while dragging (direct manipulation); results
 * elsewhere animate.
 */
export function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  spokenValue,
  minLabel,
  maxLabel,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Text in the value pill, e.g. "20% · AED 640,000". */
  display: string;
  /** What screen readers announce for the value; defaults to `display`. */
  spokenValue?: string;
  minLabel: string;
  maxLabel: string;
  className?: string;
}) {
  const labelId = useId();

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between gap-3">
        <span id={labelId} className="text-sm text-foreground/80">
          {label}
        </span>
        <span
          aria-hidden
          className="rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold whitespace-nowrap tabular-nums sm:text-[0.95rem]"
        >
          {display}
        </span>
      </div>

      <Slider
        value={[Math.min(max, Math.max(min, value))]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
        getAriaLabel={() => label}
        getAriaValueText={() => spokenValue ?? display}
        className={cn(
          "mt-4 py-2",
          "**:data-[slot=slider-track]:h-1.5 **:data-[slot=slider-track]:bg-[oklch(0.93_0.025_80)]",
          "**:data-[slot=slider-range]:bg-primary",
          // Thumb: white disc, emerald ring, gold centre. Grows while held (transform only).
          "**:data-[slot=slider-thumb]:size-5 **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-primary **:data-[slot=slider-thumb]:bg-card **:data-[slot=slider-thumb]:shadow-soft",
          "**:data-[slot=slider-thumb]:transition-transform **:data-[slot=slider-thumb]:duration-200 **:data-[slot=slider-thumb]:active:scale-125 **:data-[slot=slider-thumb]:hover:ring-0 **:data-[slot=slider-thumb]:focus-visible:ring-4 **:data-[slot=slider-thumb]:focus-visible:ring-ring/30",
          "**:data-[slot=slider-thumb]:before:absolute **:data-[slot=slider-thumb]:before:inset-[4px] **:data-[slot=slider-thumb]:before:rounded-full **:data-[slot=slider-thumb]:before:bg-gold",
        )}
        aria-labelledby={labelId}
      />

      <div aria-hidden className="mt-1.5 flex justify-between text-[0.7rem] text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
