"use client";

/**
 * GSAP setup. Always import GSAP from here, never from "gsap" directly, so
 * plugins and the shared eases are registered exactly once:
 *
 *   import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
 *
 * Inside `useGSAP(() => { ... }, { scope: ref })`, every tween, timeline,
 * ScrollTrigger and SplitText created is reverted automatically on unmount.
 * Use `gsap.matchMedia()` with `MEDIA` from `@/lib/animation/tokens` to give
 * reduced-motion and touch users lighter (or no) effects.
 */

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

import { DURATION, EASE, GSAP_EASE, type EaseName } from "@/lib/animation/tokens";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, CustomEase);

if (typeof window !== "undefined") {
  for (const name of Object.keys(EASE) as EaseName[]) {
    CustomEase.create(GSAP_EASE[name], EASE[name].join(","));
  }

  gsap.defaults({ duration: DURATION.base, ease: GSAP_EASE.out });

  // Don't recalculate every trigger when the mobile address bar shows/hides.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip, CustomEase };
