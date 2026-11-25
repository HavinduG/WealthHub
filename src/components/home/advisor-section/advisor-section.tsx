import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { Magnetic } from "@/components/motion/magnetic";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { buttonVariants } from "@/components/ui/button";
import { advisorExtras, whatsappHref } from "@/lib/content/advisor-extras";
import type { AdvisorContent } from "@/lib/content/home";
import { isExternalHref } from "@/lib/links";
import { splitAccent } from "@/lib/text";
import { cn } from "@/lib/utils";

import { AdvisorChat } from "./advisor-chat";

const SECTION_ID = "advisor";

const avatarTones = ["bg-primary text-primary-foreground", "bg-gold text-primary", "bg-mint text-primary"];

/** Short "talk to an advisor" call to action with a sample advisor chat (WordPress FAQ). */
export function AdvisorSection({ content }: { content: AdvisorContent }) {
  const title = splitAccent(content.title, 3);
  const whatsapp = whatsappHref();
  const external = isExternalHref(whatsapp);

  return (
    <section id={SECTION_ID} aria-labelledby={`${SECTION_ID}-title`} className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <ScrollReveal className="container-site">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft">
          {/* Soft mint and gold washes behind the content. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 -left-40 -z-10 size-[28rem] rounded-full bg-mint/70 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -bottom-40 -z-10 size-[24rem] rounded-full bg-gold-soft/80 blur-3xl"
          />

          <div className="grid items-center gap-12 p-6 sm:p-10 lg:grid-cols-12 lg:gap-10 lg:p-14">
            <div className="min-w-0 lg:col-span-6">
              <div data-fade className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {advisorExtras.initials.map((initials, index) => (
                    <span
                      key={initials}
                      className={cn(
                        "grid size-9 place-items-center rounded-full text-xs font-semibold ring-2 ring-card",
                        avatarTones[index % avatarTones.length],
                      )}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/75">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60 motion-reduce:animate-none" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                  </span>
                  {advisorExtras.status}
                </span>
              </div>

              <h2
                id={`${SECTION_ID}-title`}
                data-split
                className="mt-6 text-[2.1rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.2rem]"
              >
                {title.before}
                {title.accent && (
                  <em className="font-serif text-[1.12em] font-normal tracking-[-0.01em] text-primary">{title.accent}</em>
                )}
                {title.after}
              </h2>

              {content.description && (
                <p data-fade className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                  {content.description}
                </p>
              )}

              {(content.primaryLabel || content.secondaryLabel) && (
                <div data-fade className="mt-8 flex flex-wrap gap-3">
                  {content.primaryLabel && (
                    <Magnetic>
                      <Link
                        href={advisorExtras.callHref}
                        className={cn(
                          buttonVariants(),
                          "group h-12 gap-2 rounded-full px-6 text-sm shadow-float",
                        )}
                      >
                        <Phone aria-hidden className="size-4" />
                        {content.primaryLabel}
                        <ArrowRight
                          aria-hidden
                          className="transition-transform duration-300 ease-out group-hover:translate-x-1"
                        />
                      </Link>
                    </Magnetic>
                  )}
                  {content.secondaryLabel && (
                    <Magnetic>
                      <Link
                        href={whatsapp}
                        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "group h-12 gap-2 rounded-full bg-card px-6 text-sm hover:border-emerald-500/40 hover:bg-emerald-50",
                        )}
                      >
                        <MessageCircle
                          aria-hidden
                          className="size-4 text-emerald-600 transition-transform duration-300 group-hover:-rotate-12"
                        />
                        {content.secondaryLabel}
                      </Link>
                    </Magnetic>
                  )}
                </div>
              )}
            </div>

            {content.faqs.length > 0 && (
              <div data-fade className="min-w-0 lg:col-span-5 lg:col-start-8">
                <AdvisorChat faqs={content.faqs} />
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
