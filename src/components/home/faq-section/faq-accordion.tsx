"use client";

import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { DURATION, EASE, SPRING, STAGGER } from "@/lib/animation/tokens";
import type { FaqItem } from "@/lib/content/home";
import { cn } from "@/lib/utils";

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * FAQ accordion, one item open at a time (the first by default). Items rise in
 * one after another when scrolled into view; the open card's highlight glides
 * between items and its answer unfolds. Reduced motion: instant open/close.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const { reducedMotion, isLite } = useMotionPreferences();
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => {
        const isOpen = open === index;
        const buttonId = `${baseId}-q${index}`;
        const panelId = `${baseId}-a${index}`;

        return (
          <motion.li
            key={index}
            initial={reducedMotion ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: DURATION.slow, ease: EASE.out, delay: index * STAGGER.base }}
            className="relative"
          >
            {isOpen && (
              <motion.span
                layoutId={`${baseId}-active`}
                transition={reducedMotion ? { duration: 0 } : SPRING.layout}
                className="absolute inset-0 rounded-3xl border border-primary/15 bg-card shadow-float"
              />
            )}
            <div
              className={cn(
                "relative rounded-3xl border transition-colors duration-300",
                isOpen ? "border-transparent" : "border-border hover:border-primary/25 hover:bg-card/60",
              )}
            >
              <h3>
                <motion.button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : index)}
                  whileTap={isLite ? undefined : { scale: 0.99 }}
                  className="group flex w-full items-center gap-4 rounded-3xl px-5 py-5 text-left outline-none focus-visible:ring-4 focus-visible:ring-ring/40 sm:gap-6 sm:px-7 sm:py-6"
                >
                  <span
                    className={cn(
                      "font-mono text-sm tabular-nums transition-colors duration-300",
                      isOpen ? "text-gold" : "text-muted-foreground group-hover:text-primary",
                    )}
                  >
                    {pad(index + 1)}
                  </span>
                  <span className="flex-1 text-[1.05rem] leading-snug font-semibold tracking-[-0.01em] sm:text-lg">
                    {item.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 135 : 0 }}
                    transition={SPRING.snappy}
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-300",
                      isOpen
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                    )}
                  >
                    <Plus aria-hidden className="size-4" />
                  </motion.span>
                </motion.button>
              </h3>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reducedMotion ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
                    transition={{ duration: DURATION.base, ease: EASE.out }}
                    className="overflow-hidden"
                  >
                    <motion.p
                      initial={reducedMotion ? false : { y: -8, filter: "blur(4px)" }}
                      animate={{ y: 0, filter: "blur(0px)" }}
                      transition={{ duration: DURATION.base, ease: EASE.out, delay: 0.08 }}
                      className="px-5 pb-6 pl-[3.25rem] text-[0.95rem] leading-relaxed text-muted-foreground sm:px-7 sm:pb-7 sm:pl-[4.75rem]"
                    >
                      {item.answer}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
