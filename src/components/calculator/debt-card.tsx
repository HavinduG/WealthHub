"use client";

import { AnimatePresence, motion } from "motion/react";

import { DURATION, EASE, SPRING } from "@/lib/animation/tokens";
import type { DebtStatus } from "@/lib/calculator/math";
import { calculatorExtras } from "@/lib/content/calculator-extras";
import { cn } from "@/lib/utils";

const SEGMENTS = 5;

const statusDot: Record<DebtStatus, string> = {
  comfortable: "bg-primary",
  workable: "bg-primary",
  over: "bg-destructive",
};

/**
 * Debt-to-income meter: five segments filling with scaleX (transform only),
 * coloured by how close each band is to the lender limit.
 */
export function DebtCard({ dbr, limit, status }: { dbr: number; limit: number; status: DebtStatus }) {
  // Scale runs a little past the limit so "over" is visible.
  const scaleMax = limit + 10;
  const span = scaleMax / SEGMENTS;
  const percent = Math.round(dbr);

  const message =
    status === "over"
      ? `About ${percent}% of your income would go to debt repayments. That’s above the ${limit}% UAE lenders allow; a bigger deposit, longer term or lower commitments would bring it down.`
      : `About ${percent}% of your income would go to debt repayments, including this mortgage. Your advisor will confirm against each lender’s criteria.`;

  return (
    <div className="rounded-[1.5rem] bg-[oklch(0.95_0.035_80)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{calculatorExtras.labels.debtTitle}</p>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={status}
            initial={{ opacity: 0, y: -6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: DURATION.fast, ease: EASE.out }}
            className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium shadow-soft"
          >
            <span aria-hidden className={cn("size-1.5 rounded-full", statusDot[status])} />
            {calculatorExtras.debtStatus[status]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div
        role="meter"
        aria-label="Monthly debt as a share of income"
        aria-valuemin={0}
        aria-valuemax={scaleMax}
        aria-valuenow={Math.min(percent, scaleMax)}
        aria-valuetext={`${percent}% of income, limit ${limit}%`}
        className="mt-4 grid grid-cols-5 gap-1.5"
      >
        {Array.from({ length: SEGMENTS }, (_, index) => {
          const start = index * span;
          const fill = Math.min(1, Math.max(0, (dbr - start) / span));
          const tone =
            start >= limit ? "bg-destructive" : start >= limit * 0.7 ? "bg-gold" : "bg-primary";
          return (
            <span key={index} className="relative h-1.5 overflow-hidden rounded-full bg-card">
              <motion.span
                initial={false}
                animate={{ scaleX: fill }}
                transition={{ ...SPRING.soft, delay: index * 0.03 }}
                className={cn("absolute inset-0 origin-left rounded-full", tone)}
              />
            </span>
          );
        })}
      </div>

      <p className="mt-3.5 text-xs leading-relaxed text-foreground/70">{message}</p>
    </div>
  );
}
