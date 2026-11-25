import { ArrowUpRight, MessageCircle } from "lucide-react";
import Link from "next/link";

import { Magnetic } from "@/components/motion/magnetic";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { advisorExtras, whatsappHref } from "@/lib/content/advisor-extras";
import { faqExtras } from "@/lib/content/faq-extras";
import type { FaqContent } from "@/lib/content/home";
import { isExternalHref } from "@/lib/links";
import { splitAccent } from "@/lib/text";

import { FaqAccordion } from "./faq-accordion";

const SECTION_ID = "faq";

/** Home page FAQ: questions from WordPress (`questions`) with an advisor CTA card (`faq_title`, `faq_button`). */
export function FaqSection({ content }: { content: FaqContent }) {
  const title = splitAccent(faqExtras.title);
  const href = whatsappHref();
  const external = isExternalHref(href);

  return (
    <section id={SECTION_ID} aria-labelledby={`${SECTION_ID}-title`} className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <ScrollReveal className="container-site">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p data-fade className="text-xs leading-4 font-semibold tracking-[0.08em] text-primary uppercase">
                {faqExtras.eyebrow}
              </p>
              <h2
                id={`${SECTION_ID}-title`}
                data-split
                className="mt-4 text-[2.1rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.2rem]"
              >
                {title.before}
                <em className="font-serif text-[1.12em] font-normal tracking-[-0.01em] text-primary">{title.accent}</em>
                {title.after}
              </h2>
              <p data-fade className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
                {faqExtras.description}
              </p>

              {(content.ctaTitle || content.ctaLabel) && (
                <div
                  data-fade
                  className="group/cta relative mt-10 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-float sm:p-7"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-gold/25 blur-2xl transition-transform duration-700 ease-out group-hover/cta:scale-125"
                  />
                  <div className="relative flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {advisorExtras.initials.map((initials) => (
                        <span
                          key={initials}
                          className="grid size-8 place-items-center rounded-full bg-emerald-2 text-[0.65rem] font-semibold ring-2 ring-primary"
                        >
                          {initials}
                        </span>
                      ))}
                    </div>
                    <span className="relative ml-1 flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 motion-reduce:animate-none" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                    </span>
                  </div>
                  {content.ctaTitle && (
                    <p className="relative mt-5 text-lg leading-snug font-semibold text-balance">{content.ctaTitle}</p>
                  )}
                  {content.ctaLabel && (
                    <Magnetic className="relative mt-6">
                      <Link
                        href={href}
                        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                        className="group inline-flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-primary outline-none transition-colors hover:bg-[oklch(0.8_0.085_75)] focus-visible:ring-4 focus-visible:ring-gold/40"
                      >
                        <MessageCircle aria-hidden className="size-4" />
                        {content.ctaLabel}
                        <ArrowUpRight
                          aria-hidden
                          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </Link>
                    </Magnetic>
                  )}
                </div>
              )}
            </div>
          </div>

          <div data-fade className="min-w-0 lg:col-span-7">
            <FaqAccordion items={content.items} />
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
