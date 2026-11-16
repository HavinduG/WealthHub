import type { Metadata } from "next";

import { CalculatorApp } from "@/components/calculator/calculator-app";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { getCalculatorData } from "@/lib/content/calculator";
import { calculatorExtras } from "@/lib/content/calculator-extras";
import { getSite } from "@/lib/content/site";
import { absoluteUrl } from "@/lib/site";
import { splitAccent } from "@/lib/text";

const PATH = "/calculator";

export async function generateMetadata(): Promise<Metadata> {
  const [{ content }, site] = await Promise.all([getCalculatorData(), getSite()]);
  const description = [`${content.tabs.borrow} ${content.tabs.cost}`, content.disclaimer].filter(Boolean).join(" ");

  return {
    title: calculatorExtras.pageTitle,
    description,
    alternates: { canonical: PATH },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: calculatorExtras.pageTitle,
      description,
      url: PATH,
    },
  };
}

export default async function CalculatorPage() {
  const [{ content, settings }, site] = await Promise.all([getCalculatorData(), getSite()]);
  const heading = splitAccent(content.heading);

  return (
    <main id="main" className="relative isolate flex-1 overflow-hidden">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${site.name} ${calculatorExtras.pageTitle}`,
          url: absoluteUrl(PATH),
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          description: content.disclaimer || undefined,
          offers: { "@type": "Offer", price: 0, priceCurrency: "AED" },
        }}
      />

      {/* Soft mint and sand light behind the page top. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60rem] overflow-hidden">
        <div
          className="absolute -top-[30%] -left-[20%] aspect-square w-[60rem] max-w-none"
          style={{ background: "radial-gradient(closest-side, oklch(0.92 0.045 160 / 0.6), transparent)" }}
        />
        <div
          className="absolute top-[10%] -right-[25%] aspect-square w-[50rem] max-w-none"
          style={{ background: "radial-gradient(closest-side, oklch(0.94 0.055 80 / 0.55), transparent)" }}
        />
      </div>

      <ScrollReveal className="container-site pt-28 pb-16 sm:pt-32 lg:pt-40 lg:pb-24">
        <header className="mx-auto max-w-3xl text-center">
          <p
            data-reveal
            data-fade
            className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase"
          >
            {calculatorExtras.pageEyebrow}
          </p>
          <h1
            data-reveal
            data-split
            className="mt-4 text-[2.4rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.1rem]"
          >
            {heading.before}
            {heading.accent && (
              <em className="font-serif text-[1.08em] font-normal tracking-[-0.01em] text-primary">
                {heading.accent}
              </em>
            )}
            {heading.after}
          </h1>
          {content.disclaimer && (
            <p data-reveal data-fade className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              {content.disclaimer}
            </p>
          )}
        </header>

        <div data-reveal data-fade className="mt-10 sm:mt-12">
          <CalculatorApp content={content} settings={settings} />
        </div>
      </ScrollReveal>
    </main>
  );
}
