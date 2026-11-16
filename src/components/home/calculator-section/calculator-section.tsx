import { AffordabilityCalculator } from "@/components/calculator/affordability-calculator";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import type { CalculatorSettings } from "@/lib/calculator/settings";
import { calculatorExtras } from "@/lib/content/calculator-extras";
import type { CalculatorSectionContent } from "@/lib/content/home";
import { splitAccent } from "@/lib/text";

const SECTION_ID = "affordability-calculator";

/** Home page "Your numbers, in real time." calculator section. */
export function CalculatorSection({
  content,
  settings,
}: {
  content: CalculatorSectionContent;
  settings: CalculatorSettings;
}) {
  // "Your numbers, in real time." -> accent "in real time." (or *marked* words).
  const title = splitAccent(content.title, 3);

  return (
    <section
      id={SECTION_ID}
      aria-labelledby={`${SECTION_ID}-title`}
      className="relative scroll-mt-24 py-16 sm:py-20 lg:py-24"
    >
      <ScrollReveal className="container-site">
        <header className="grid gap-5 lg:grid-cols-12 lg:items-start lg:gap-8">
          <div className="lg:col-span-8">
            <p data-fade className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">
              {calculatorExtras.homeEyebrow}
            </p>
            <h2
              id={`${SECTION_ID}-title`}
              data-split
              className="mt-4 text-[2.1rem] leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.4rem]"
            >
              {content.title ? (
                <>
                  {title.before}
                  {title.accent && (
                    <em className="font-serif text-[1.08em] font-normal tracking-[-0.01em] text-primary">
                      {title.accent}
                    </em>
                  )}
                  {title.after}
                </>
              ) : (
                calculatorExtras.homeEyebrow
              )}
            </h2>
          </div>
          {content.description && (
            <p
              data-fade
              className="max-w-xs text-sm leading-relaxed text-muted-foreground lg:col-span-4 lg:justify-self-end lg:pt-10"
            >
              {content.description}
            </p>
          )}
        </header>

        <div className="mt-10 lg:mt-14">
          <AffordabilityCalculator settings={settings} />
        </div>
      </ScrollReveal>
    </section>
  );
}
