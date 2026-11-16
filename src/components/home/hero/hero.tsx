import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Magnetic } from "@/components/motion/magnetic";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { HeroContent } from "@/lib/content/home";
import { heroAdvisors, heroBadge } from "@/lib/content/hero-extras";
import { splitAccent } from "@/lib/text";
import { cn } from "@/lib/utils";

import { EligibilityBar } from "./eligibility-bar";
import { HeroMotion } from "./hero-motion";
import { HeroVisual } from "./hero-visual";

const avatarTones = [
  "bg-primary text-primary-foreground",
  "bg-gold text-primary",
  "bg-mint text-primary",
];

export function Hero({ content }: { content: HeroContent }) {
  const title = splitAccent(content.title);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden pt-28 pb-12 sm:pt-32 lg:pt-36 lg:pb-16"
    >
      <HeroMotion>
        <HeroBackdrop />

        <div className="container-site">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
            <div data-hero-copy className="min-w-0 lg:col-span-7">
              <p data-reveal>
                <Badge
                  variant="outline"
                  className="h-auto max-w-full items-center gap-2 rounded-[1.25rem] bg-surface/80 py-1 pr-3.5 pl-1 text-left text-xs font-normal whitespace-normal text-foreground/75 shadow-soft backdrop-blur sm:text-[0.8rem]"
                >
                  <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                    {heroBadge.label}
                  </span>
                  <span className="leading-snug">{heroBadge.text}</span>
                </Badge>
              </p>

              <h1
                id="hero-title"
                data-hero-title
                data-reveal
                className="mt-6 max-w-[11.5em] text-[2.55rem] leading-[1.03] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[3.6rem] xl:text-[4.25rem]"
              >
                {title.before}
                {title.accent && (
                  <em className="font-serif text-[1.08em] font-normal tracking-[-0.01em] text-primary">
                    {title.accent}
                  </em>
                )}
                {title.after}
              </h1>

              {content.paragraphHtml && (
                <div
                  data-reveal
                  className="mt-6 max-w-[34rem] text-base leading-relaxed text-muted-foreground sm:text-lg [&_a]:text-primary [&_a]:underline [&_p+p]:mt-3"
                  dangerouslySetInnerHTML={{ __html: content.paragraphHtml }}
                />
              )}

              {(content.primaryAction || content.secondaryAction) && (
                <div data-reveal className="mt-8 flex flex-wrap items-center gap-3">
                  {content.primaryAction && (
                    <Magnetic>
                      <Link
                        href={content.primaryAction.href}
                        className={cn(
                          buttonVariants(),
                          "group h-12 gap-2 rounded-full pr-5 pl-6 text-[0.95rem] shadow-[0_10px_24px_-10px_oklch(0.33_0.058_166/0.7)] hover:bg-primary/90",
                        )}
                      >
                        {content.primaryAction.label}
                        <ArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-1" />
                      </Link>
                    </Magnetic>
                  )}
                  {content.secondaryAction && (
                    <Link
                      href={content.secondaryAction.href}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-12 rounded-full bg-surface/70 px-6 text-[0.95rem] backdrop-blur hover:bg-surface",
                      )}
                    >
                      {content.secondaryAction.label}
                    </Link>
                  )}
                </div>
              )}

              <div data-reveal className="mt-9 flex items-center gap-3.5">
                <div className="flex -space-x-2">
                  {heroAdvisors.initials.map((initials, index) => (
                    <Avatar key={initials} size="lg" className="ring-2 ring-background after:hidden">
                      <AvatarFallback className={cn("text-[0.68rem] font-semibold tracking-wide", avatarTones[index % avatarTones.length])}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{heroAdvisors.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{heroAdvisors.text}</p>
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-5">
              <HeroVisual image={content.image} />
            </div>
          </div>

          <EligibilityBar className="mt-14 lg:mt-20" />
        </div>
      </HeroMotion>
    </section>
  );
}

/** Soft mint and sand light behind the hero. Radial gradients, no blur filter. */
function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      // Fade out toward the bottom so the glow never ends in a hard line at the section edge.
      style={{ maskImage: "linear-gradient(to bottom, black 62%, transparent)" }}
    >
      <div
        data-bg-blob
        data-speed="0.5"
        className="absolute -top-[30%] -left-[25%] aspect-square w-[70rem] max-w-none"
        style={{ background: "radial-gradient(closest-side, oklch(0.92 0.045 160 / 0.75), transparent)" }}
      />
      <div
        data-bg-blob
        data-speed="-0.35"
        className="absolute -right-[20%] -bottom-[35%] aspect-square w-[60rem] max-w-none"
        style={{ background: "radial-gradient(closest-side, oklch(0.94 0.055 80 / 0.7), transparent)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.33 0.058 166 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.33 0.058 166 / 0.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 60% 50% at 30% 30%, black, transparent)",
        }}
      />
    </div>
  );
}
