"use client";

import type { FeeLine } from "@/lib/calculator/math";
import { calculatorExtras } from "@/lib/content/calculator-extras";

import { AnimatedNumber } from "./animated-number";

const { labels } = calculatorExtras;

/** Itemised upfront costs: deposit plus every fee, with the cash needed total. */
export function CostsCard({
  fees,
  totalFees,
  deposit,
  cashNeeded,
}: {
  fees: FeeLine[];
  totalFees: number;
  deposit: number;
  cashNeeded: number;
}) {
  return (
    <div className="rounded-[1.5rem] bg-card p-5 shadow-soft ring-1 ring-black/5 sm:p-6">
      <p className="text-sm font-semibold">{labels.upfrontCosts}</p>

      <dl className="mt-3 divide-y divide-border text-sm">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-muted-foreground">{labels.deposit}</dt>
          <dd className="font-medium">
            <AnimatedNumber value={deposit} />
          </dd>
        </div>
        {fees.map((fee) => (
          <div key={fee.key} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">{fee.label}</dt>
            <dd className="shrink-0 font-medium">
              <AnimatedNumber value={fee.amount} />
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-muted-foreground">{labels.totalFees}</dt>
          <dd className="font-semibold">
            <AnimatedNumber value={totalFees} />
          </dd>
        </div>
      </dl>

      <div className="mt-2 flex items-center justify-between gap-4 rounded-2xl bg-secondary px-4 py-3.5">
        <span className="text-sm font-semibold text-secondary-foreground">{labels.cashNeeded}</span>
        <AnimatedNumber value={cashNeeded} className="text-lg font-semibold tracking-tight text-primary" />
      </div>
    </div>
  );
}
