"use client";

import { MotionConfig } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/tokens";

import { SmoothScrollProvider } from "./smooth-scroll-provider";

/**
 * App-wide client providers. Children stay Server Components; only the
 * providers themselves run on the client.
 *
 * MotionConfig gives every Motion animation the shared default transition and
 * `reducedMotion="user"`, which turns off transform animations (keeping opacity
 * fades) when the OS asks for reduced motion.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DURATION.base, ease: EASE.out }}>
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </MotionConfig>
  );
}
