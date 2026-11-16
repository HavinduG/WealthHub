"use client";

import { Check, MapPin } from "lucide-react";
import { animate, motion, useSpring } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { DURATION, EASE, SPRING, STAGGER } from "@/lib/animation/tokens";
import type { SiteImage } from "@/lib/content/home";
import { heroLocation, heroPlan, heroPrequalified } from "@/lib/content/hero-extras";
import { cn } from "@/lib/utils";

/** Delay (s) before the floating cards enter, so they land after the image wipe. */
const CARDS_DELAY = 0.9;
const TILT_DEGREES = 6;

export function HeroVisual({ image }: { image: SiteImage | null }) {
  const { isLite } = useMotionPreferences();
  const rotateX = useSpring(0, SPRING.soft);
  const rotateY = useSpring(0, SPRING.soft);

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (isLite || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * TILT_DEGREES);
    rotateX.set(-py * TILT_DEGREES);
  }

  function resetTilt() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div className="relative mx-auto w-full max-w-[22rem] perspective-[1400px] sm:max-w-[26rem] lg:mr-0 lg:ml-auto lg:max-w-[27rem]">
      {/* Motion owns this element's transform (pointer tilt). */}
      <motion.div
        style={{ rotateX, rotateY }}
        onPointerMove={handleMove}
        onPointerLeave={resetTilt}
        className="relative"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-mint shadow-float ring-1 ring-black/5 sm:rounded-[2.25rem]">
          {image ? (
            // GSAP owns this wrapper: intro scale + scroll drift. Pre-scaled so drift never shows edges.
            <div data-hero-image className="absolute inset-0 scale-[1.12] will-change-transform">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                preload
                sizes="(min-width: 1024px) 27rem, (min-width: 640px) 26rem, 22rem"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-mint to-secondary" />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

          {/* Wipe panel revealed by GSAP on load. Hidden for reduced motion via CSS. */}
          <div data-hero-cover aria-hidden className="absolute inset-0 bg-mint" />

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: CARDS_DELAY + 0.35, duration: DURATION.base, ease: EASE.out }}
            className="absolute top-3.5 right-3.5 flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-xs font-medium shadow-soft backdrop-blur sm:top-4 sm:right-4"
          >
            <MapPin className="size-3.5 text-primary" aria-hidden />
            {heroLocation}
          </motion.div>
        </div>

        <FloatingCard
          depth={1.4}
          delay={CARDS_DELAY}
          floatDuration={6}
          className="top-[13%] -left-3 sm:-left-14 lg:-left-24"
        >
          <div className="flex items-center gap-3 pr-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint text-primary">
              <Check className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{heroPrequalified.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{heroPrequalified.text}</p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard
          depth={0.8}
          delay={CARDS_DELAY + 0.15}
          floatDuration={7.5}
          className="-right-3 bottom-[7%] w-[13.5rem] sm:-right-10 sm:w-[15rem]"
        >
          <PlanCard />
        </FloatingCard>
      </motion.div>
    </div>
  );
}

function FloatingCard({
  children,
  className,
  depth,
  delay,
  floatDuration,
}: {
  children: React.ReactNode;
  className?: string;
  depth: number;
  delay: number;
  floatDuration: number;
}) {
  const { isLite } = useMotionPreferences();

  return (
    // GSAP owns this wrapper (scroll parallax by depth).
    <div data-depth={depth} className={cn("absolute z-10", className)}>
      {/* Motion: gentle idle float, full-motion desktops only. */}
      <motion.div
        animate={isLite ? { y: 0 } : { y: [0, -7, 0] }}
        transition={isLite ? { duration: 0 } : { duration: floatDuration, ease: "easeInOut", repeat: Infinity }}
      >
        {/* Motion: entrance + hover lift. */}
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ delay, duration: DURATION.slow, ease: EASE.out }}
          className="rounded-2xl bg-card/95 p-3 shadow-float ring-1 ring-black/5 backdrop-blur-md sm:p-3.5"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

const RING_RADIUS = 15;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function PlanCard() {
  const dayRef = useRef<HTMLSpanElement>(null);
  const { reducedMotion } = useMotionPreferences();
  const progress = heroPlan.day / heroPlan.totalDays;

  // Count the day number up once the card has landed (text only, no layout animation).
  useEffect(() => {
    const node = dayRef.current;
    if (!node || reducedMotion) return;
    const controls = animate(0, heroPlan.day, {
      delay: CARDS_DELAY + 0.4,
      duration: DURATION.reveal,
      ease: EASE.out,
      onUpdate: (value) => {
        node.textContent = String(Math.round(value));
      },
    });
    return () => controls.stop();
  }, [reducedMotion]);

  return (
    <div className="p-0.5">
      <div className="flex items-center gap-3">
        <div className="relative grid size-11 shrink-0 place-items-center">
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r={RING_RADIUS} fill="none" strokeWidth="3" className="stroke-mint" />
            <circle
              cx="18"
              cy="18"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className="stroke-gold"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.max(progress, 0.08))}
            />
          </svg>
          <span ref={dayRef} className="relative text-sm font-semibold tabular-nums">
            {heroPlan.day}
          </span>
        </div>
        <div className="leading-tight">
          <p className="text-[0.7rem] text-muted-foreground">{heroPlan.eyebrow}</p>
          <p className="mt-0.5 text-base font-semibold tracking-tight">
            Day {heroPlan.day} of {heroPlan.totalDays}
          </p>
        </div>
      </div>

      <motion.ul
        className="mt-3 space-y-2"
        initial="hidden"
        animate="show"
        variants={{
          show: { transition: { staggerChildren: STAGGER.loose, delayChildren: CARDS_DELAY + 0.45 } },
        }}
      >
        {heroPlan.steps.map((step) => (
          <motion.li
            key={step.label}
            variants={{
              hidden: { opacity: 0, x: -10 },
              show: { opacity: 1, x: 0, transition: { duration: DURATION.base, ease: EASE.out } },
            }}
            className={cn("flex items-center gap-2.5 text-[0.8rem]", !step.done && "text-muted-foreground")}
          >
            {step.done ? (
              <span className="grid size-[1.125rem] place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
            ) : (
              <span className="size-[1.125rem] rounded-full border-[1.5px] border-dashed border-gold" aria-hidden />
            )}
            <span>
              {step.label}
              <span className="sr-only">{step.done ? " (done)" : " (next)"}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
