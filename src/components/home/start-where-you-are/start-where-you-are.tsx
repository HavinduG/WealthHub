import { Building2, KeyRound, Search, type LucideIcon } from "lucide-react";
import Image from "next/image";

import { ScrollReveal } from "@/components/motion/scroll-reveal";
import type { StartContent, StepCard as StepCardContent } from "@/lib/content/home";
import { slugify } from "@/lib/links";
import { splitAccent } from "@/lib/text";

import { StepCard } from "./step-card";

/** Used while a card has no `step_icon` in WordPress, in card order. */
const FALLBACK_ICONS: LucideIcon[] = [KeyRound, Search, Building2];

/** Gentle depth offset per column on desktop (outer cards drift opposite to the middle). */
const COLUMN_SPEEDS = [0.25, -0.15, 0.35];

function StepIcon({ step, index }: { step: StepCardContent; index: number }) {
  if (step.icon) {
    return (
      <Image
        src={step.icon.src}
        alt=""
        width={28}
        height={28}
        unoptimized={step.icon.src.endsWith(".svg")}
        className="size-7 object-contain"
      />
    );
  }
  const Icon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
  return <Icon aria-hidden strokeWidth={1.75} />;
}

export function StartWhereYouAre({ content }: { content: StartContent }) {
  const title = splitAccent(content.title);
  const sectionId = slugify(content.eyebrow || "start-where-you-are");

  return (
    <section
      id={sectionId}
      aria-labelledby={`${sectionId}-title`}
      className="relative isolate scroll-mt-24 py-20 sm:py-24 lg:py-32"
    >
      {/* Clipped wrapper: the glow is wider than small screens and must not widen the page. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 aspect-[2/1] w-[min(72rem,140%)] max-w-none -translate-x-1/2"
          style={{ background: "radial-gradient(closest-side, oklch(0.93 0.035 160 / 0.55), transparent)" }}
        />
      </div>

      <ScrollReveal className="container-site">
        <header className="mx-auto max-w-2xl text-center">
          {content.eyebrow && (
            <p data-fade className="inline-flex items-center gap-3 text-sm font-medium tracking-wide text-primary">
              <span aria-hidden className="h-px w-8 bg-gold" />
              {content.eyebrow}
              <span aria-hidden className="h-px w-8 bg-gold" />
            </p>
          )}
          {content.title && (
            <h2
              id={`${sectionId}-title`}
              data-split
              className="mt-4 text-[2.1rem] leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.5rem]"
            >
              {title.before}
              {title.accent && (
                <em className="font-serif text-[1.08em] font-normal tracking-[-0.01em] text-primary">
                  {title.accent}
                </em>
              )}
              {title.after}
            </h2>
          )}
        </header>

        <ol data-stagger className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-3 md:gap-5 lg:mt-20 lg:gap-6">
          {content.steps.map((step, index) => (
            <li key={`${step.title}-${index}`} data-stagger-item className="min-w-0">
              <div data-speed={COLUMN_SPEEDS[index % COLUMN_SPEEDS.length]} className="h-full">
                <StepCard
                  index={index}
                  total={content.steps.length}
                  title={step.title}
                  description={step.description}
                  icon={<StepIcon step={step} index={index} />}
                />
              </div>
            </li>
          ))}
        </ol>
      </ScrollReveal>
    </section>
  );
}
