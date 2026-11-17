"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin gold bar at the top of the viewport that fills as you read the page (scaleX only). */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-primary to-gold"
    />
  );
}
