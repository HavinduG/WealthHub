import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ArticleCard } from "@/components/insights/article-card";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { toCardArticle, type ArticleTeaser } from "@/lib/content/insights";
import { insightsExtras } from "@/lib/content/insights-extras";
import { splitAccent } from "@/lib/text";

const SECTION_ID = "insights";

/** Home page blog teaser: the newest articles, linking to /insights. */
export function InsightsSection({ articles }: { articles: ArticleTeaser[] }) {
  if (articles.length === 0) return null;
  const title = splitAccent(insightsExtras.latestTitle);

  return (
    <section id={SECTION_ID} aria-labelledby={`${SECTION_ID}-title`} className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <ScrollReveal className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p data-fade className="text-xs leading-4 font-semibold tracking-[0.08em] text-primary uppercase">
              {insightsExtras.page.eyebrow}
            </p>
            <h2
              id={`${SECTION_ID}-title`}
              data-split
              className="mt-4 text-[2.1rem] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-5xl lg:text-[3.4rem]"
            >
              {title.before}
              <em className="font-serif text-[1.15em] font-normal tracking-[-0.01em] text-primary">{title.accent}</em>
            </h2>
          </div>
          <Link
            data-fade
            href="/insights"
            className="group inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-primary"
          >
            {insightsExtras.viewAll}
            <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <ul data-stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-10">
          {articles.slice(0, 3).map((article, index) => (
            <li
              key={article.slug}
              data-stagger-item
              className={index === 2 ? "min-w-0 sm:col-span-2 lg:col-span-1" : "min-w-0"}
            >
              <div data-speed={[0.15, -0.1, 0.2][index]} className="h-full">
                <ArticleCard article={toCardArticle(article)} />
              </div>
            </li>
          ))}
        </ul>
      </ScrollReveal>
    </section>
  );
}
