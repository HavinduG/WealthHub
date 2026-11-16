"use client";

import { motion, useMotionValue, useSpring } from "motion/react";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { DURATION, EASE, SPRING } from "@/lib/animation/tokens";

const SPOTLIGHT_SIZE = 320;

/**
 * One "Start where you are" option. Motion owns every transform in here
 * (hover lift, cursor spotlight, icon turn, underline). GSAP reveals and
 * parallaxes the wrappers around it, never this element.
 */
export function StepCard({
  index,
  total,
  icon,
  title,
  description,
}: {
  index: number;
  total: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const { isLite } = useMotionPreferences();
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const x = useSpring(spotX, { stiffness: 300, damping: 30 });
  const y = useSpring(spotY, { stiffness: 300, damping: 30 });

  function handleMove(event: React.PointerEvent<HTMLElement>) {
    if (isLite || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    spotX.set(event.clientX - rect.left - SPOTLIGHT_SIZE / 2);
    spotY.set(event.clientY - rect.top - SPOTLIGHT_SIZE / 2);
  }

  const number = String(index + 1).padStart(2, "0");

  return (
    <motion.article
      initial="rest"
      animate="rest"
      whileHover={isLite ? undefined : "hover"}
      variants={{ rest: { y: 0 }, hover: { y: -8 } }}
      transition={SPRING.soft}
      onPointerMove={handleMove}
      className="group relative isolate flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-card p-6 shadow-soft ring-1 ring-black/5 transition-shadow duration-500 hover:shadow-float sm:p-7 lg:p-8"
    >
      {/* Cursor spotlight: moved with transforms, faded with opacity. */}
      <motion.span
        aria-hidden
        style={{ x, y, width: SPOTLIGHT_SIZE, height: SPOTLIGHT_SIZE }}
        variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
        transition={{ duration: DURATION.base, ease: EASE.out }}
        className="pointer-events-none absolute top-0 left-0 -z-10 rounded-full bg-[radial-gradient(closest-side,oklch(0.93_0.035_160),transparent)]"
      />

      <div className="flex items-start justify-between gap-4">
        <motion.span
          variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -8, scale: 1.08 } }}
          transition={SPRING.snappy}
          className="grid size-13 place-items-center rounded-2xl bg-mint text-primary ring-1 ring-primary/10 [&_svg]:size-6"
        >
          {icon}
        </motion.span>
        <span className="font-serif text-4xl leading-none text-gold italic select-none" aria-hidden>
          {number}
        </span>
      </div>

      <h3 className="mt-8 text-xl font-semibold tracking-tight sm:text-[1.375rem] md:text-lg lg:mt-10 lg:text-[1.375rem]">
        {title}
      </h3>
      {description && (
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{description}</p>
      )}

      <div className="mt-auto pt-8">
        <div className="relative h-px w-full bg-border">
          <motion.span
            aria-hidden
            variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
            transition={{ duration: DURATION.slow, ease: EASE.out }}
            className="absolute inset-0 origin-left bg-gold"
          />
        </div>
        <p className="mt-3 text-xs tracking-wide text-muted-foreground">
          <span className="sr-only">Option </span>
          {number} <span aria-hidden>/</span>
          <span className="sr-only"> of </span> {String(total).padStart(2, "0")}
        </p>
      </div>
    </motion.article>
  );
}
