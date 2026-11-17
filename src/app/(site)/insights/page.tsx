import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { InsightsBrowser } from "@/components/insights/insights-browser";
import { SubscribeBand } from "@/components/insights/subscribe-band";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { getArticles, toCardArticle } from "@/lib/content/insights";
import { insightsExtras } from "@/lib/content/insights-extras";
import { getSite } from "@/lib/content/site";
import { absoluteUrl } from "@/lib/site";
import { splitAccent } from "@/lib/text";

const PATH = "/insights";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const { page } = insightsExtras;
  return {
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: PATH },
    openGraph: { type: "website", siteName: site.name, title: page.metaTitle, description: page.description, url: PATH },
  };
}

export default async function InsightsPage() {
  const [articles, site] = await Promise.all([getArticles(), getSite()]);
  const { page, insiderCard } = insightsExtras;
  const title = splitAccent(page.title);

  return (
    <main id="main" className="relative isolate flex-1 overflow-hidden">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: `${site.name} ${page.metaTitle}`,
          description: page.description,
          url: absoluteUrl(PATH),
          blogPost: articles.slice(0, 20).map((article) => ({
            "@type": "BlogPosting",
            headline: article.title,
            url: absoluteUrl(article.href),
            datePublished: article.date,
            isAccessibleForFree: article.access === "free",
          })),
        }}
      />

      {/* Soft light behind the hero (Figma "Glow"). */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50rem] overflow-hidden">
        <div
          className="absolute -top-[25%] -left-[15%] aspect-square w-[44rem] max-w-none"
          style={{ background: "radial-gradient(closest-side, oklch(0.92 0.045 160 / 0.7), transparent)" }}
        />
      </div>

      <ScrollReveal className="container-site">
        {/* Hero */}
        <section className="flex flex-col gap-10 pt-32 pb-12 sm:pt-36 lg:flex-row lg:items-end lg:justify-between lg:pt-[10.5rem]">
          <div className="flex max-w-[720px] flex-col gap-5">
            <p data-reveal data-fade className="text-xs leading-4 font-semibold tracking-[0.08em] text-primary uppercase">
              {page.eyebrow}
            </p>
            <h1
              data-reveal
              data-split
              className="text-[2.6rem] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-6xl lg:text-[4rem] lg:leading-[4.375rem]"
            >
              <span className="block">{title.before}</span>
              <em className="font-serif text-[1.19em] font-normal tracking-[-0.01em] text-primary">{title.accent}</em>
            </h1>
            <p data-reveal data-fade className="max-w-[560px] text-base leading-[1.75] text-muted-foreground sm:text-lg sm:leading-[1.875rem]">
              {page.description}
            </p>
          </div>

          <div
            data-reveal
            data-fade
            className="flex w-full flex-col gap-4 overflow-hidden rounded-[1.75rem] bg-primary p-7 text-white shadow-[0_24px_50px_oklch(0.25_0.03_160/0.2)] sm:max-w-[400px]"
          >
            <span className="w-fit rounded-full bg-gold-soft px-2.5 py-[5px] text-xs leading-4 font-medium text-foreground">
              {insiderCard.pill}
            </span>
            <p className="text-[1.375rem] leading-[1.875rem] font-semibold tracking-[-0.01em]">{insiderCard.title}</p>
            <p className="text-sm leading-[1.375rem] text-white/75">{insiderCard.text}</p>
            <Link
              href={`/register?plan=yearly&next=${encodeURIComponent(PATH)}`}
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold py-4 pr-[22px] pl-[26px] text-[0.9375rem] leading-5 font-semibold text-foreground outline-none transition-colors hover:bg-[oklch(0.8_0.085_75)] focus-visible:ring-4 focus-visible:ring-gold/40"
            >
              {insiderCard.cta}
              <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* Filters, featured and latest */}
        <div data-reveal data-fade>
          <InsightsBrowser articles={articles.map(toCardArticle)} />
        </div>

        <div className="pt-24 pb-28">
          <SubscribeBand next={PATH} />
        </div>
      </ScrollReveal>
    </main>
  );
}
