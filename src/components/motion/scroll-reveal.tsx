"use client";

import { useRef } from "react";

import { DURATION, GSAP_EASE, MEDIA, STAGGER } from "@/lib/animation/tokens";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Reusable GSAP scroll reveals for below-the-fold sections. Children stay
 * Server Components; mark elements with data attributes:
 *
 * - `data-split`            heading: words rise out of masked lines
 * - `data-fade`             fades and rises in
 * - `data-stagger`          group whose `data-stagger-item` children rise in one after another
 * - `data-speed="0.4"`      parallax drift while scrolling (desktop only; +/- for direction)
 *
 * Reveals play once. Nothing is hidden for reduced motion, and the hidden
 * start state is applied on hydration, which is invisible for content below
 * the fold. For content visible on load (top of a page), also add
 * `data-reveal` so CSS hides it until GSAP runs (no flash; see globals.css).
 * Don't put these attributes on elements that Motion animates; wrap the
 * Motion element instead.
 */
export function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motionOk, () => {
        const splits = q("[data-split]").map((el) =>
          SplitText.create(el, {
            type: "lines,words",
            mask: "lines",
            autoSplit: true,
            onSplit(self) {
              self.masks.forEach((mask) => mask.classList.add("split-line-mask"));
              gsap.set(el, { opacity: 1 });
              return gsap.from(self.words, {
                yPercent: 115,
                duration: DURATION.reveal,
                ease: GSAP_EASE.expo,
                stagger: STAGGER.tight * 1.6,
                scrollTrigger: { trigger: el, start: "top 88%", once: true },
              });
            },
          }),
        );

        q("[data-fade]").forEach((el) => {
          // fromTo (not from): elements with data-reveal start at opacity 0 in CSS.
          gsap.fromTo(
            el,
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: DURATION.slow,
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });

        q("[data-stagger]").forEach((group) => {
          gsap.fromTo(
            group.querySelectorAll("[data-stagger-item]"),
            { opacity: 0, y: 56 },
            {
              opacity: 1,
              y: 0,
              duration: DURATION.slow * 1.2,
              stagger: STAGGER.loose,
              scrollTrigger: { trigger: group, start: "top 85%", once: true },
            },
          );
        });

        return () => splits.forEach((split) => split.revert());
      });

      mm.add(MEDIA.desktop, () => {
        q<HTMLElement>("[data-speed]").forEach((el) => {
          const distance = Number(el.dataset.speed ?? 0) * 80;
          gsap.fromTo(
            el,
            { y: distance },
            {
              y: -distance,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
            },
          );
        });
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className={cn(className)}>
      {children}
    </div>
  );
}
