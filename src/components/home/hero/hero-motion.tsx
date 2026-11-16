"use client";

import { useRef } from "react";

import { DURATION, GSAP_EASE, MEDIA, STAGGER } from "@/lib/animation/tokens";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

/**
 * GSAP choreography for the hero. Children stay server-rendered; this only
 * targets data attributes inside its scope:
 *
 * - `[data-reveal]`          fade/rise in on load (title is split into words)
 * - `[data-hero-cover]`      panel that wipes up to reveal the image
 * - `[data-hero-image]`      image settles in scale, then drifts on scroll
 * - `[data-depth]`           floating cards, parallax by depth (desktop)
 * - `[data-bg-blob]`         background light, parallax by data-speed (desktop)
 * - `[data-hero-copy]`       text column drifts up on scroll (desktop)
 *
 * Motion components inside these elements animate their own children only.
 * Everything is reverted on unmount by useGSAP / matchMedia.
 */
export function HeroMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      // Intro + light image parallax: any device where motion is allowed.
      mm.add(MEDIA.motionOk, () => {
        const tl = gsap.timeline({ defaults: { ease: GSAP_EASE.out, duration: DURATION.slow } });

        tl.to(q("[data-hero-cover]"), { yPercent: -101, duration: DURATION.reveal, ease: GSAP_EASE.expo }, 0.05)
          .fromTo(
            q("[data-hero-image]"),
            { scale: 1.32 },
            { scale: 1.12, duration: DURATION.reveal * 1.5 },
            0.05,
          )
          .fromTo(
            q("[data-reveal]:not([data-hero-title])"),
            { opacity: 0, y: 26 },
            { opacity: 1, y: 0, stagger: STAGGER.base },
            0.35,
          );

        const title = q<HTMLElement>("[data-hero-title]")[0];
        let split: SplitText | undefined;
        if (title) {
          split = SplitText.create(title, {
            type: "lines,words",
            mask: "lines",
            linesClass: "split-line",
            autoSplit: true,
            onSplit(self) {
              self.masks.forEach((mask) => mask.classList.add("split-line-mask"));
              gsap.set(title, { opacity: 1 });
              // Returned so SplitText keeps progress in sync when it re-splits on resize.
              return gsap.from(self.words, {
                yPercent: 115,
                duration: DURATION.reveal,
                ease: GSAP_EASE.expo,
                stagger: STAGGER.tight * 1.6,
                delay: 0.15,
              });
            },
          });
        }

        gsap.to(q("[data-hero-image]"), {
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });

        return () => split?.revert();
      });

      // Depth parallax: wide screens with a mouse only.
      mm.add(MEDIA.desktop, () => {
        const scroll = { trigger: root, start: "top top", end: "bottom top", scrub: 0.6 };

        q<HTMLElement>("[data-depth]").forEach((el) => {
          gsap.to(el, { y: -Number(el.dataset.depth ?? 1) * 110, ease: "none", scrollTrigger: scroll });
        });
        q<HTMLElement>("[data-bg-blob]").forEach((el) => {
          gsap.to(el, { y: Number(el.dataset.speed ?? 0.3) * 260, ease: "none", scrollTrigger: scroll });
        });
        gsap.to(q("[data-hero-copy]"), { y: -70, ease: "none", scrollTrigger: scroll });
      });

      // Fonts and the image can shift layout after hydration.
      const refresh = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(refresh);

      return () => mm.revert();
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
