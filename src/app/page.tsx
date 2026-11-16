import type { Metadata } from "next";

import { CalculatorSection } from "@/components/home/calculator-section/calculator-section";
import { Hero } from "@/components/home/hero/hero";
import { HowItWorks } from "@/components/home/how-it-works/how-it-works";
import { StartWhereYouAre } from "@/components/home/start-where-you-are/start-where-you-are";
import { getCalculatorData } from "@/lib/content/calculator";
import {
  getHomeAcf,
  toCalculatorSectionContent,
  toHeroContent,
  toHowItWorksContent,
  toStartContent,
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
  const [acf, calculator] = await Promise.all([getHomeAcf(), getCalculatorData()]);
  const hero = toHeroContent(acf);
  const start = toStartContent(acf);
  const howItWorks = toHowItWorksContent(acf);

  return (
    <main id="main" className="flex-1">
      {hero && <Hero content={hero} />}
      {start && <StartWhereYouAre content={start} />}
      {howItWorks && <HowItWorks content={howItWorks} />}
      <CalculatorSection content={toCalculatorSectionContent(acf)} settings={calculator.settings} />
    </main>
  );
}
