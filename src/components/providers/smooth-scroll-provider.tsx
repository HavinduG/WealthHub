"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { createContext, useContext, useEffect, useRef, type RefObject } from "react";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<RefObject<Lenis | null> | null>(null);

/**
 * Ref to the active Lenis instance (null when smooth scrolling is off).
 * Read it in handlers or effects, e.g. `lenis.current?.scrollTo("#contact")`.
 * Add `data-lenis-prevent` to elements that should keep native scrolling
 * (modals, scrollable panels).
 */
export function useLenis() {
  const ref = useContext(LenisContext);
  if (!ref) throw new Error("useLenis must be used inside <SmoothScrollProvider>");
  return ref;
}

/**
 * Lenis smooth scrolling driven by GSAP's ticker, so Lenis and ScrollTrigger
 * share one requestAnimationFrame loop and stay in sync.
 *
 * - Off entirely for prefers-reduced-motion (native scrolling).
 * - Touch devices keep native touch scrolling (`syncTouch: false`), which is
 *   lighter and feels right on phones; wheel/trackpad input is smoothed.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const { reducedMotion } = useMotionPreferences();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      wheelMultiplier: 1,
      syncTouch: false,
      anchors: true,
    });
    lenisRef.current = lenis;

    const offScroll = lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      offScroll();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}
