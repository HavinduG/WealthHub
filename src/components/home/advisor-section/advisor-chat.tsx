"use client";

import { CheckCheck } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { DURATION, EASE, SPRING } from "@/lib/animation/tokens";
import { advisorExtras } from "@/lib/content/advisor-extras";
import type { FaqItem } from "@/lib/content/home";
import { cn } from "@/lib/utils";

type Phase = "ask" | "typing" | "reply";

/** Milliseconds from the question appearing to each next step. */
const TIMING = { typing: 1000, reply: 2600, next: 7500 };

/** The first sentence of an answer: chat replies stay short. */
function firstSentence(text: string) {
  return text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
}

const bubble = {
  initial: { opacity: 0, y: 16, scale: 0.92 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground/70"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/**
 * A sample WhatsApp-style chat that plays through the FAQ: the member asks,
 * the advisor types, then replies. Plays only while on screen; reduced motion
 * shows one finished exchange. Visual only; the buttons beside it are the CTA.
 */
export function AdvisorChat({ faqs }: { faqs: FaqItem[] }) {
  const { reducedMotion } = useMotionPreferences();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ask");
  const playing = inView && !reducedMotion;
  const shownPhase: Phase = reducedMotion ? "reply" : phase;

  useEffect(() => {
    if (!playing) return;
    const timers = [
      setTimeout(() => setPhase("typing"), TIMING.typing),
      setTimeout(() => setPhase("reply"), TIMING.reply),
      setTimeout(() => {
        setPhase("ask");
        setIndex((i) => (i + 1) % faqs.length);
      }, TIMING.next),
    ];
    return () => timers.forEach(clearTimeout);
  }, [playing, index, faqs.length]);

  const faq = faqs[index]!;

  function show(i: number) {
    setIndex(i);
    setPhase("ask");
  }

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? false : { rotate: 2 }}
      whileInView={{ rotate: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={SPRING.soft}
      className="relative mx-auto w-full max-w-md"
    >
      {/* Stacked "card behind" for depth. */}
      <div aria-hidden className="absolute inset-x-6 -bottom-3 h-full rounded-[1.75rem] bg-primary/10" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-float">
        {/* Header */}
        <div className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground">
          <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-gold text-sm font-semibold text-primary">
            {advisorExtras.chat.initials}
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{advisorExtras.chat.name}</span>
            <span className="block truncate text-xs text-primary-foreground/70">
              {shownPhase === "typing" ? "typing…" : advisorExtras.chat.online}
            </span>
          </span>
          <span className="hidden text-xs text-primary-foreground/60 sm:block">{advisorExtras.chat.languages}</span>
        </div>

        {/* Messages */}
        <div
          aria-hidden
          className="flex h-[19rem] flex-col justify-end gap-3 bg-[radial-gradient(circle_at_1px_1px,oklch(0.33_0.058_166/0.07)_1px,transparent_0)] [background-size:18px_18px] px-4 py-5 sm:h-[18rem]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`q-${index}`}
              layout
              {...bubble}
              transition={{ duration: DURATION.base, ease: EASE.out }}
              className="ml-auto max-w-[82%] origin-bottom-right rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-snug text-primary-foreground shadow-soft"
            >
              {faq.question}
              <span className="mt-1 flex items-center justify-end gap-1 text-[0.65rem] text-primary-foreground/60">
                <CheckCheck className="size-3 text-gold" />
              </span>
            </motion.div>

            {shownPhase === "typing" && (
              <motion.div
                key={`t-${index}`}
                layout
                {...bubble}
                transition={SPRING.snappy}
                className="w-fit origin-bottom-left rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 shadow-soft"
              >
                <TypingDots />
              </motion.div>
            )}

            {shownPhase === "reply" && (
              <motion.div
                key={`a-${index}`}
                layout
                {...bubble}
                transition={{ duration: DURATION.base, ease: EASE.out }}
                className="max-w-[86%] origin-bottom-left rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm leading-snug text-foreground shadow-soft"
              >
                {firstSentence(faq.answer)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Question picker */}
        <div className="flex items-center justify-center gap-1.5 border-t border-border bg-card px-5 py-3.5">
          {faqs.map((item, i) => (
            <button
              key={i}
              type="button"
              aria-label={item.question}
              aria-current={i === index ? "true" : undefined}
              onClick={() => show(i)}
              className="group grid h-6 place-items-center px-0.5 outline-none"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-500 group-focus-visible:ring-2 group-focus-visible:ring-ring",
                  i === index ? "w-6 bg-primary" : "w-1.5 bg-primary/25 group-hover:bg-primary/50",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
