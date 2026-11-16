"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Magnetic } from "@/components/motion/magnetic";
import { calculatorExtras } from "@/lib/content/calculator-extras";
import { cn } from "@/lib/utils";

import { AnimatedNumber } from "./animated-number";

const { labels } = calculatorExtras;

export interface ResultRow {
  label: string;
  value: number;
  kind: "aed" | "percent2";
  suffix?: string;
}

/**
 * Dark emerald result card: one headline figure, a principal/interest ring,
 * detail rows and a gold CTA. Shared by the home section and calculator page.
 */
export function RepaymentCard({
  heading,
  headline,
  headlineSuffix,
  principalShare,
  rows,
  cta,
  footnote,
  className,
}: {
  heading: string;
  headline: number;
  headlineSuffix?: string;
  /** Principal share of total repayments (0–1); hides the ring when undefined. */
  principalShare?: number;
  rows: ResultRow[];
  cta?: { label: string; href: string; onClick?: () => void };
  footnote?: string;
  className?: string;
}) {
  const principalPercent = principalShare === undefined ? undefined : Math.round(principalShare * 100);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[1.75rem] bg-primary p-6 text-primary-foreground shadow-[0_24px_60px_-28px_oklch(0.33_0.058_166/0.9)] sm:p-7",
        className,
      )}
    >
      {/* Soft gold light in the corner. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 -z-10 size-64 rounded-full"
        style={{ background: "radial-gradient(closest-side, oklch(0.76 0.085 75 / 0.22), transparent)" }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-primary-foreground/70">{heading}</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            <AnimatedNumber
              value={headline}
              className="text-[2.1rem] leading-none font-semibold tracking-[-0.03em] sm:text-[2.6rem]"
            />
            {headlineSuffix && <span className="text-sm text-primary-foreground/60">{headlineSuffix}</span>}
          </p>
        </div>
        {principalShare !== undefined && <SplitRing share={principalShare} />}
      </div>

      {principalPercent !== undefined && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-primary-foreground/75">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-gold" />
            {labels.principal} <AnimatedNumber value={principalPercent} kind="percent" />
          </span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-primary-foreground/85" />
            {labels.interest} <AnimatedNumber value={100 - principalPercent} kind="percent" />
          </span>
        </div>
      )}

      <dl className="mt-6 divide-y divide-white/10 border-t border-white/10 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3.5">
            <dt className="text-primary-foreground/70">{row.label}</dt>
            <dd className="font-semibold">
              <AnimatedNumber value={row.value} kind={row.kind} />
              {row.suffix && <span className="font-normal"> {row.suffix}</span>}
            </dd>
          </div>
        ))}
      </dl>

      {footnote && <p className="mt-1 text-xs leading-relaxed text-primary-foreground/60">{footnote}</p>}

      {cta && (
        <Magnetic className="mt-5 flex w-full">
          <Link
            href={cta.href}
            onClick={cta.onClick}
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-primary outline-none transition-colors hover:bg-[oklch(0.8_0.085_75)] focus-visible:ring-4 focus-visible:ring-gold/40"
          >
            {cta.label}
            <ArrowRight className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
          </Link>
        </Magnetic>
      )}
    </div>
  );
}

const RING_R = 24;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Principal vs interest ring. The arc redraws instantly when the numbers change
 * (no stroke animation); a small turn (transform only) gives feedback.
 */
function SplitRing({ share }: { share: number }) {
  const principal = Math.min(1, Math.max(0, share));
  return (
    <svg
      viewBox="0 0 60 60"
      className="size-16 shrink-0 transition-transform duration-700 ease-out sm:size-[4.5rem]"
      style={{ transform: `rotate(${-90 + (1 - principal) * 40}deg)` }}
      role="img"
      aria-label={`Principal ${Math.round(principal * 100)}%, interest ${Math.round((1 - principal) * 100)}%`}
    >
      <circle cx="30" cy="30" r={RING_R} fill="none" strokeWidth="9" className="stroke-primary-foreground/85" />
      <circle
        cx="30"
        cy="30"
        r={RING_R}
        fill="none"
        strokeWidth="9"
        className="stroke-gold"
        strokeDasharray={`${RING_C * principal} ${RING_C}`}
      />
    </svg>
  );
}
