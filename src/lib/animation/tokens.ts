/**
 * Shared motion tokens: the single source of truth for GSAP and Motion so
 * every animation on the site uses the same timing and feel.
 *
 * Rules:
 * - Animate only `transform` (x, y, scale, rotate) and `opacity`.
 * - Never animate the same element with both GSAP and Motion.
 * - GSAP: scroll-driven work (ScrollTrigger, pinning, parallax, SplitText, Flip).
 * - Motion: hover, layout, page transitions, enter/exit.
 */

type Bezier = readonly [number, number, number, number];

/** Cubic-bezier curves. Motion takes these arrays directly as `ease`. */
export const EASE = {
  /** Default for most UI: quick start, soft landing. */
  out: [0.16, 1, 0.3, 1],
  /** Symmetric moves: pinned sections, horizontal scroll, Flip. */
  inOut: [0.65, 0, 0.35, 1],
  /** Exits only. */
  in: [0.7, 0, 0.84, 0],
  /** Big hero and text reveals. */
  expo: [0.87, 0, 0.13, 1],
} as const satisfies Record<string, Bezier>;

export type EaseName = keyof typeof EASE;

/** The same curves registered with GSAP CustomEase (see `@/lib/gsap`). */
export const GSAP_EASE = {
  out: "wh-out",
  inOut: "wh-inOut",
  in: "wh-in",
  expo: "wh-expo",
} as const satisfies Record<EaseName, string>;

/** Durations in seconds (GSAP and Motion both use seconds). */
export const DURATION = {
  fast: 0.25,
  base: 0.5,
  slow: 0.8,
  reveal: 1.2,
} as const;

/** Stagger between items, in seconds. */
export const STAGGER = {
  tight: 0.03,
  base: 0.08,
  loose: 0.15,
} as const;

/** Spring presets for Motion hover and layout animations. */
export const SPRING = {
  snappy: { type: "spring", stiffness: 420, damping: 32, mass: 0.8 },
  soft: { type: "spring", stiffness: 180, damping: 24 },
  layout: { type: "spring", stiffness: 300, damping: 34 },
} as const;

/** Media queries for `gsap.matchMedia()` and the motion-preference hook. */
export const MEDIA = {
  reducedMotion: "(prefers-reduced-motion: reduce)",
  motionOk: "(prefers-reduced-motion: no-preference)",
  touch: "(hover: none), (pointer: coarse)",
  mobile: "(max-width: 767px)",
  /** Full effects: motion allowed, wide screen, precise pointer. */
  desktop:
    "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (hover: hover) and (pointer: fine)",
} as const;
