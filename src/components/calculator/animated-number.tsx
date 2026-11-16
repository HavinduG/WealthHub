"use client";

import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { DURATION, EASE } from "@/lib/animation/tokens";
import { formatAed } from "@/lib/calculator/math";
import { cn } from "@/lib/utils";

export type NumberKind = "aed" | "percent" | "percent2" | "int";

const formatters: Record<NumberKind, (value: number) => string> = {
  aed: formatAed,
  percent: (value) => `${Math.round(value)}%`,
  percent2: (value) => `${value.toFixed(2)}%`,
  int: (value) => String(Math.round(value)),
};

/**
 * A number that counts to its new value when it changes. Text is written
 * straight to the DOM, so the count never re-renders React. The server renders
 * the final value, so the HTML is correct without JavaScript.
 */
export function AnimatedNumber({
  value,
  kind = "aed",
  className,
}: {
  value: number;
  kind?: NumberKind;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  // React only ever renders the first value; later changes are written by the effect.
  const [initialText] = useState(() => formatters[kind](value));
  const { reducedMotion } = useMotionPreferences();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const format = formatters[kind];

    if (reducedMotion || shown.current === value) {
      shown.current = value;
      node.textContent = format(value);
      return;
    }

    const controls = animate(shown.current, value, {
      duration: DURATION.base,
      ease: EASE.out,
      onUpdate: (latest) => {
        shown.current = latest;
        node.textContent = format(latest);
      },
    });
    return () => controls.stop();
  }, [value, kind, reducedMotion]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {initialText}
    </span>
  );
}
