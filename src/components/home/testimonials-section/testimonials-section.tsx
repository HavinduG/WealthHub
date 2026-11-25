import { ScrollReveal } from "@/components/motion/scroll-reveal";
import type { Testimonial } from "@/lib/content/home";
import { testimonialsExtras } from "@/lib/content/testimonials-extras";
import { splitAccent } from "@/lib/text";

import { TestimonialsCarousel } from "./testimonials-carousel";

const SECTION_ID = "testimonials";

/** Home page member testimonials (WordPress `textimonials` rows). Hidden when there are none. */
export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;
  const title = splitAccent(testimonialsExtras.title);

  return (
    <section
      id={SECTION_ID}
      aria-labelledby={`${SECTION_ID}-title`}
      className="relative scroll-mt-24 overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <ScrollReveal className="container-site">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-7">
            <p data-fade className="text-xs leading-4 font-semibold tracking-[0.08em] text-primary uppercase">
              {testimonialsExtras.eyebrow}
            </p>
            <h2
              id={`${SECTION_ID}-title`}
              data-split
              className="mt-4 text-[2.1rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.4rem]"
            >
              {title.before}
              <em className="font-serif text-[1.15em] font-normal tracking-[-0.01em] text-primary">{title.accent}</em>
              {title.after}
            </h2>
          </div>
          <p
            data-fade
            className="max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground lg:col-span-4 lg:col-start-9"
          >
            {testimonialsExtras.description}
          </p>
        </div>

        <div data-fade className="mt-10 lg:mt-14">
          <TestimonialsCarousel testimonials={testimonials} />
        </div>
      </ScrollReveal>
    </section>
  );
}
