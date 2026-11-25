import type { Metadata } from "next";

import { AdvisorSection } from "@/components/home/advisor-section/advisor-section";
import { FaqSection } from "@/components/home/faq-section/faq-section";
import { CalculatorSection } from "@/components/home/calculator-section/calculator-section";
import { Hero } from "@/components/home/hero/hero";
import { HowItWorks } from "@/components/home/how-it-works/how-it-works";
import { InsightsSection } from "@/components/home/insights-section/insights-section";
import { StartWhereYouAre } from "@/components/home/start-where-you-are/start-where-you-are";
import { TestimonialsSection } from "@/components/home/testimonials-section/testimonials-section";
import { getCalculatorData } from "@/lib/content/calculator";
import { getArticles } from "@/lib/content/insights";
import {
  getHomeAcf,
  toAdvisorContent,
  toCalculatorSectionContent,
  toFaqContent,
  toHeroContent,
  toHowItWorksContent,
  toStartContent,
  toTestimonials,
} from "@/lib/content/home";
import { getSite } from "@/lib/content/site";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata(): Promise<Metadata> {
  const [acf, site] = await Promise.all([getHomeAcf(), getSite()]);
  const description = acf?.hero_paragraph ? stripHtml(acf.hero_paragraph) : undefined;
  const image = acf?.hero_image || null;

  return {
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: site.name,
      description,
      url: "/",
      ...(image && { images: [{ url: image.url, width: image.width, height: image.height, alt: image.alt }] }),
    },
  };
}

export default async function HomePage() {
  const [acf, calculator, articles] = await Promise.all([getHomeAcf(), getCalculatorData(), getArticles()]);
  const hero = toHeroContent(acf);
  const start = toStartContent(acf);
  const howItWorks = toHowItWorksContent(acf);
  const advisor = toAdvisorContent(acf);
  const faq = toFaqContent(acf);

  return (
    <main id="main" className="flex-1">
      {hero && <Hero content={hero} />}
      {start && <StartWhereYouAre content={start} />}
      {howItWorks && <HowItWorks content={howItWorks} />}
      <CalculatorSection content={toCalculatorSectionContent(acf)} settings={calculator.settings} />
      <InsightsSection articles={articles} />
      <TestimonialsSection testimonials={toTestimonials(acf)} />
      {advisor && <AdvisorSection content={advisor} />}
      {faq && <FaqSection content={faq} />}
    </main>
  );
}
