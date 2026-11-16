"use client";

import { motion, useSpring } from "motion/react";
import { useRef } from "react";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { cn } from "@/lib/utils";

const spring = { stiffness: 260, damping: 18, mass: 0.6 };

/**
 * Pulls its child gently toward the pointer (desktop with a fine pointer only).
 * Motion owns this wrapper's transform, so don't animate it with GSAP.
 */
export function Magnetic({
  children,
  strength = 0.22,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { isLite } = useMotionPreferences();
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  function handleMove(event: React.PointerEvent) {
    if (isLite || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      ref={ref}
      style={{ x, y }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={cn("inline-flex", className)}
    >
      {children}
    </motion.span>
  );
}
