"use client";

import { useSyncExternalStore } from "react";

import { MEDIA } from "@/lib/animation/tokens";

export interface MotionPreferences {
  /** User asked the OS for reduced motion. */
  reducedMotion: boolean;
  /** Touch-first device (no hover or coarse pointer). */
  isTouch: boolean;
  /** Narrow viewport. */
  isMobile: boolean;
  /** Use lighter effects: any of the above is true. */
  isLite: boolean;
}

function subscribe(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

const subscribers = {
  reducedMotion: subscribe(MEDIA.reducedMotion),
  touch: subscribe(MEDIA.touch),
  mobile: subscribe(MEDIA.mobile),
};

function useMediaQuery(query: string, sub: (onChange: () => void) => () => void) {
  return useSyncExternalStore(
    sub,
    () => window.matchMedia(query).matches,
    // On the server, assume a full-motion desktop; the client corrects on hydration.
    () => false,
  );
}

/**
 * Live motion and device preferences for React components. In GSAP code,
 * prefer `gsap.matchMedia()` with the same `MEDIA` queries.
 */
export function useMotionPreferences(): MotionPreferences {
  const reducedMotion = useMediaQuery(MEDIA.reducedMotion, subscribers.reducedMotion);
  const isTouch = useMediaQuery(MEDIA.touch, subscribers.touch);
  const isMobile = useMediaQuery(MEDIA.mobile, subscribers.mobile);

  return { reducedMotion, isTouch, isMobile, isLite: reducedMotion || isTouch || isMobile };
}
