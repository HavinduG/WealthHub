import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Magnetic } from "@/components/motion/magnetic";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { buttonVariants } from "@/components/ui/button";
import type { HowItWorksContent } from "@/lib/content/home";
import { howItWorksExtras } from "@/lib/content/how-it-works-extras";
import { splitAccent } from "@/lib/text";
import { cn } from "@/lib/utils";

import { HowItWorksPanel } from "./how-it-works-panel";

const SECTION_ID = "how-it-works";

/**
 * Title with an italic accent (last three words by default, or *marked* words),
 * breaking after the last comma on wider screens: "From first chat to keys, /
 * in 90 calm days."
 */
function SectionTitle({ title }: { title: string }) {
  const { before, accent, after } = splitAccent(title, 3);
  const comma = before.lastIndexOf(", ");
  const firstLine = comma >= 0 ? before.slice(0, comma + 1) : "";
  const rest = comma >= 0 ? before.slice(comma + 2) : before;

  return (
    <h2
      id={`${SECTION_ID}-title`}
      data-split
      className="mt-4 text-[2.1rem] leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.4rem]"
    >
      {firstLine && <span className="sm:block">{firstLine} </span>}
      {rest}
      {accent && (
        <em className="font-serif text-[1.08em] font-normal tracking-[-0.01em] text-primary">{accent}</em>
      )}
      {after}
    </h2>
  );
}

export function HowItWorks({ content }: { content: HowItWorksContent }) {
  const buttonLabel = content.buttonLabel || howItWorksExtras.defaultButtonLabel;

  const header = (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-7">
        <p data-fade className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">
          {howItWorksExtras.eyebrow}
        </p>
        {content.title && <SectionTitle title={content.title} />}
      </div>

      <div className="lg:col-span-4 lg:col-start-9 lg:pt-6">
        {content.description && (
          <p data-fade className="max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
            {content.description}
          </p>
        )}
        {buttonLabel && (
          <div data-fade className="mt-6">
            <Magnetic>
              <Link
                href={howItWorksExtras.buttonHref}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "group h-11 gap-2 rounded-full bg-card px-5 text-sm hover:bg-muted",
                )}
              >
                {buttonLabel}
                <ArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-1" />
              </Link>
            </Magnetic>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section
      id={SECTION_ID}
      aria-labelledby={content.title ? `${SECTION_ID}-title` : undefined}
      aria-label={content.title ? undefined : howItWorksExtras.eyebrow}
      className="relative scroll-mt-24 py-16 sm:py-20 lg:py-24"
    >
      <ScrollReveal className="container-site">
        <HowItWorksPanel
          header={header}
          marks={howItWorksExtras.timelineMarks}
          steps={content.steps.map((step, index) => ({
            ...step,
            timing: howItWorksExtras.stepTimings[index],
          }))}
        />
      </ScrollReveal>
    </section>
  );
}
