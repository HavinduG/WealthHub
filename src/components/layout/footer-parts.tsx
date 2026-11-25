"use client";

import { ArrowUp } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef, useSyncExternalStore } from "react";

import { useLenis } from "@/components/providers/smooth-scroll-provider";
import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { EASE, SPRING } from "@/lib/animation/tokens";

const noSubscribe = () => () => {};

/**
 * The current year, read in the browser only: Cache Components rejects
 * `new Date()` while prerendering, even in Client Components.
 */
export function CurrentYear() {
  const year = useSyncExternalStore(
    noSubscribe,
    () => new Date().getFullYear(),
    () => null,
  );
  return <>{year}</>;
}

/** Smooth scroll to the top (Lenis when available). */
export function BackToTop({ label }: { label: string }) {
  const lenis = useLenis();
  const { reducedMotion, isLite } = useMotionPreferences();

  function onClick() {
    if (lenis.current && !reducedMotion) lenis.current.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={isLite ? undefined : "hover"}
      whileTap={{ scale: 0.94 }}
      transition={SPRING.snappy}
      className="group inline-flex items-center gap-3 rounded-full text-sm font-medium text-primary-foreground/80 outline-none hover:text-primary-foreground focus-visible:ring-4 focus-visible:ring-gold/40"
    >
      {label}
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-full border border-primary-foreground/25 transition-colors duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-primary">
        <motion.span variants={{ hover: { y: [0, -28, 28, 0] } }} transition={{ duration: 0.6, ease: EASE.out }}>
          <ArrowUp aria-hidden className="size-4" />
        </motion.span>
      </span>
    </motion.button>
  );
}

/**
 * The giant brand name at the foot of the page: letters rise in one after
 * another when it scrolls into view, and each one lifts under the pointer.
 */
export function FooterWordmark({ text }: { text: string }) {
  const { reducedMotion, isLite } = useMotionPreferences();
  const letters = Array.from(text);
  // Watch the container: the letters start clipped below it, so they never count as visible themselves.
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const shown = reducedMotion || inView;

  return (
    <p
      ref={ref}
      aria-hidden
      className="flex justify-center overflow-hidden pt-4 font-semibold leading-[0.85] tracking-[-0.06em] whitespace-nowrap text-primary-foreground/[0.14] select-none [font-size:clamp(3.5rem,15vw,15rem)]"
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={reducedMotion ? false : { y: "100%" }}
          animate={{ y: shown ? "0%" : "100%" }}
          whileHover={
            isLite
              ? undefined
              : { y: "-12%", color: "oklch(0.76 0.085 75 / 0.6)", transition: { ...SPRING.snappy, delay: 0 } }
          }
          transition={{ duration: 0.9, ease: EASE.out, delay: reducedMotion ? 0 : i * 0.04 }}
        >
          {letter === " " ? " " : letter}
        </motion.span>
      ))}
    </p>
  );
}
