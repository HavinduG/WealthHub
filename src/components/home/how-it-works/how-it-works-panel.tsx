"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { DURATION, EASE, MEDIA, SPRING } from "@/lib/animation/tokens";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export interface PanelStep {
  title: string;
  description: string;
  timing?: string;
}

type StepState = "done" | "active" | "upcoming";

/** Which card is active for a 0–1 progress value: the line is split evenly between cards. */
function indexForProgress(progress: number, total: number) {
  return Math.min(total - 1, Math.floor(progress * total + 1e-4));
}

/**
 * The white "How it works" panel with the 90-day progress line and step cards.
 *
 * - Desktop: GSAP pins the panel and scrolling fills the line from Day 1 to
 *   Day 90; the active card follows.
 * - Phones/tablets: same progress, scrubbed while the cards scroll past, no pin.
 * - Reduced motion: a still snapshot (step 2 active), as in the design.
 *
 * GSAP owns the panel (pin), the fill and the thumb. Motion owns the cards.
 */
export function HowItWorksPanel({
  header,
  steps,
  marks,
}: {
  header: React.ReactNode;
  steps: PanelStep[];
  marks: string[];
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const total = steps.length;
  const restingIndex = Math.min(1, total - 1);
  const restingProgress = total > 1 ? (restingIndex + 0.6) / total : 1;
  const [active, setActive] = useState(restingIndex);

  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;
      const q = gsap.utils.selector(panel);
      const mm = gsap.matchMedia();

      mm.add({ motionOk: MEDIA.motionOk, desktop: MEDIA.desktop }, (context) => {
        const { motionOk, desktop } = context.conditions ?? {};
        if (!motionOk) return;

        const scrollTrigger: ScrollTrigger.Vars = desktop
          ? {
              trigger: panel,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              // Centre the panel while pinned if it fits, otherwise pin it under the header.
              start: () => (panel.offsetHeight < window.innerHeight - 140 ? "center center" : "top top+=96"),
              end: () => `+=${Math.round(window.innerHeight * 0.45 * total)}`,
              scrub: 0.6,
            }
          : { trigger: q("[data-steps]")[0], start: "top 80%", end: "bottom 50%", scrub: 0.6 };

        // The fill runs from time 0 to 1; HOLD keeps the finished state on screen briefly
        // before the panel unpins (and lets the line finish even when the page ends soon after).
        const HOLD = 0.12;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger,
          onUpdate: () => setActive(indexForProgress(Math.min(tl.time(), 1), total)),
        });
        tl.fromTo(q("[data-progress-fill]"), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
          // x: 0 clears the server-rendered resting offset so only xPercent moves the thumb.
          .fromTo(q("[data-progress-thumb]"), { x: 0, xPercent: 0 }, { x: 0, xPercent: 100, duration: 1 }, 0)
          .to({}, { duration: HOLD });

        return () => setActive(restingIndex);
      });

      return () => mm.revert();
    },
    { scope: panelRef, dependencies: [total] },
  );

  // Timeline labels light up as the active step passes them.
  const litUpTo = active === total - 1 ? 1 : (active + 0.5) / total;

  return (
    <div
      ref={panelRef}
      className="rounded-[2rem] bg-card p-5 shadow-soft ring-1 ring-black/5 sm:rounded-[2.5rem] sm:p-8 lg:p-12"
    >
      {header}

      <div className="mt-10 lg:mt-14">
        {/* Clip box: the thumb track is translated across the line and must not widen the page. */}
        <div className="-mx-3 overflow-hidden px-3 py-3">
          <div className="relative h-1 rounded-full bg-[oklch(0.93_0.025_80)]">
            <div
              data-progress-fill
              className="absolute inset-0 origin-left rounded-full bg-linear-to-r from-primary via-[oklch(0.5_0.06_120)] to-gold"
              style={{ transform: `scaleX(${restingProgress})` }}
            />
            <div
              data-progress-thumb
              aria-hidden
              className="absolute inset-0"
              style={{ transform: `translateX(${restingProgress * 100}%)` }}
            >
              <span className="absolute top-1/2 left-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold ring-4 ring-gold/25" />
            </div>
          </div>
        </div>

        {marks.length > 0 && (
          <ol aria-hidden className="mt-1 flex justify-between text-[0.68rem] sm:text-xs">
            {marks.map((mark, index) => {
              const position = marks.length > 1 ? index / (marks.length - 1) : 0;
              return (
                <li
                  key={mark}
                  className={cn(
                    "text-muted-foreground transition-opacity duration-500",
                    position <= litUpTo ? "opacity-100" : "opacity-45",
                  )}
                >
                  {mark}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <ol
        data-stagger
        data-steps
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:gap-4"
      >
        {steps.map((step, index) => (
          <li key={`${step.title}-${index}`} data-stagger-item className="min-w-0">
            <StepTile
              step={step}
              index={index}
              state={index < active ? "done" : index === active ? "active" : "upcoming"}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepTile({ step, index, state }: { step: PanelStep; index: number; state: StepState }) {
  const { isLite } = useMotionPreferences();
  const isActive = state === "active";

  return (
    <motion.article
      aria-current={isActive ? "step" : undefined}
      initial={false}
      animate={{ y: isActive ? -6 : 0, scale: isActive ? 1.015 : 1 }}
      whileHover={!isActive && !isLite ? { y: -4 } : undefined}
      transition={SPRING.soft}
      className="relative isolate h-full overflow-hidden rounded-[1.25rem] bg-muted"
    >
      <TileContent step={step} index={index} state={state} tone="light" />

      {/* Active look: an opaque dark layer cross-faded with opacity (no colour animation). */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: DURATION.base, ease: EASE.out }}
        className="absolute inset-0 bg-primary shadow-[0_18px_40px_-18px_oklch(0.33_0.058_166/0.8)]"
      >
        <TileContent step={step} index={index} state="active" tone="dark" />
      </motion.div>
    </motion.article>
  );
}

function TileContent({
  step,
  index,
  state,
  tone,
}: {
  step: PanelStep;
  index: number;
  state: StepState;
  tone: "light" | "dark";
}) {
  const dark = tone === "dark";
  const number = String(index + 1).padStart(2, "0");

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "relative grid size-8 place-items-center overflow-hidden rounded-full text-xs font-semibold",
            dark ? "bg-gold text-primary" : state === "done" ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
          )}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {state === "done" && !dark ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={SPRING.snappy}
              >
                <Check className="size-4" strokeWidth={2.75} aria-hidden />
                <span className="sr-only">Step {number}, done</span>
              </motion.span>
            ) : (
              <motion.span
                key="number"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={SPRING.snappy}
              >
                {number}
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        {step.timing && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.68rem] font-medium",
              dark ? "bg-white/10 text-primary-foreground/80" : "bg-card text-muted-foreground",
            )}
          >
            {step.timing}
          </span>
        )}
      </div>

      <h3
        className={cn(
          "mt-6 text-lg font-semibold tracking-tight lg:mt-8",
          dark ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {step.title}
      </h3>
      {step.description && (
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed",
            dark ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          {step.description}
        </p>
      )}
    </div>
  );
}
