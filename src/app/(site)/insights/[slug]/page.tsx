import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AccessBadge } from "@/components/insights/access-badge";
import {
  ArticleBody,
  ArticleGallery,
  LockedArticle,
  MemberArticle,
  MemberBadge,
} from "@/components/insights/article-access";
import { ArticleCard } from "@/components/insights/article-card";
import { AuthorRow, CategoryMeta } from "@/components/insights/article-meta";
import { ReadingProgress } from "@/components/insights/reading-progress";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { JsonLd } from "@/components/seo/json-ld";
import {
  formatArticleDate,
  getArticleBySlug,
  getArticleSlugs,
  getArticles,
  toCardArticle,
} from "@/lib/content/insights";
import { insightsExtras } from "@/lib/content/insights-extras";
import { getSite } from "@/lib/content/site";
import { absoluteUrl } from "@/lib/site";
import { splitAccent } from "@/lib/text";

/** Prerender every article; new ones render on first visit and are cached. */
export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  // Cache Components needs at least one param to validate the route.
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/insights/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [article, site] = await Promise.all([getArticleBySlug(slug), getSite()]);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: { canonical: article.href },
    openGraph: {
      type: "article",
      siteName: site.name,
      title: article.title,
      description: article.excerpt || undefined,
      url: article.href,
      publishedTime: article.date,
      modifiedTime: article.modified,
      section: article.category,
      ...(article.image && {
        images: [{ url: article.image.src, width: article.image.width, height: article.image.height, alt: article.image.alt }],
      }),
    },
  };
}

/**
 * The page shell renders instantly; the article itself depends on the URL, so it
 * streams in behind a skeleton on navigations that weren't prefetched. Every
 * published article is still prerendered, so first visits get full HTML.
 */
export default function ArticlePage({ params }: PageProps<"/insights/[slug]">) {
  return (
    <main id="main" className="flex-1">
      <ReadingProgress />
      <Suspense fallback={<ArticleSkeleton />}>
        <Article params={params} />
      </Suspense>
    </main>
  );
}

function ArticleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading article" className="motion-safe:animate-pulse">
      <div className="container-site flex flex-col items-center gap-[22px] pt-32 pb-12 sm:pt-36 lg:pt-40">
        <div className="h-4 w-40 rounded-full bg-muted" />
        <div className="h-7 w-56 rounded-full bg-muted" />
        <div className="flex w-full max-w-[860px] flex-col items-center gap-3">
          <div className="h-10 w-full rounded-xl bg-muted sm:h-12" />
          <div className="h-10 w-3/4 rounded-xl bg-muted sm:h-12" />
        </div>
        <div className="h-5 w-full max-w-[560px] rounded-full bg-muted" />
        <div className="h-10 w-48 rounded-full bg-muted" />
      </div>
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 sm:px-6 lg:px-0">
        <div className="aspect-[16/10] rounded-[2rem] bg-muted sm:aspect-[1120/500]" />
      </div>
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3 px-4 pb-24 sm:px-6 lg:px-0">
        {["w-full", "w-full", "w-11/12", "w-full", "w-2/3"].map((width, index) => (
          <div key={index} className={`h-4 rounded-full bg-muted ${width}`} />
        ))}
      </div>
    </div>
  );
}

async function Article({ params }: { params: PageProps<"/insights/[slug]">["params"] }) {
  const { slug } = await params;
  const [article, all, site] = await Promise.all([getArticleBySlug(slug), getArticles(), getSite()]);
  if (!article) notFound();

  const isPaid = article.access === "paid";
  const more = all
    .filter((item) => item.slug !== article.slug && (!isPaid || item.access === "paid"))
    .concat(all.filter((item) => item.slug !== article.slug && isPaid && item.access !== "paid"))
    .slice(0, 3);
  const moreTitle = splitAccent(isPaid ? insightsExtras.moreTitle : insightsExtras.latestTitle);
  const dateLabel = formatArticleDate(article.date);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt || undefined,
          datePublished: article.date,
          dateModified: article.modified,
          articleSection: article.category,
          url: absoluteUrl(article.href),
          image: article.image ? [article.image.src] : undefined,
          author: { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name },
          // Google's paywalled-content markup: members-only text isn't cloaking.
          isAccessibleForFree: !isPaid,
          ...(isPaid && {
            hasPart: { "@type": "WebPageElement", isAccessibleForFree: false, cssSelector: "#article-paywall" },
          }),
        }}
      />

      <ScrollReveal>
        <article id="article">
          {/* Head */}
          <header className="container-site flex flex-col items-center gap-[22px] pt-32 pb-12 text-center sm:pt-36 lg:pt-40">
            <nav data-reveal data-fade aria-label="Breadcrumb" className="flex items-center gap-2 text-xs leading-4 font-medium">
              <Link href="/insights" className="text-primary hover:underline">
                {insightsExtras.page.eyebrow}
              </Link>
              <span aria-hidden className="text-muted-foreground">
                /
              </span>
              <span className="text-muted-foreground">{article.category}</span>
            </nav>
            <div data-reveal data-fade className="flex flex-wrap items-center justify-center gap-3">
              {isPaid ? (
                <Suspense fallback={<AccessBadge access="locked" />}>
                  <MemberBadge />
                </Suspense>
              ) : (
                <AccessBadge access="free" />
              )}
              <CategoryMeta category={article.category} readTime={article.readTime} />
            </div>
            <h1
              data-reveal
              data-split
              className="max-w-[860px] text-[2.25rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[3.625rem]"
            >
              {article.title}
            </h1>
            {article.excerpt && (
              <p data-reveal data-fade className="max-w-[680px] text-base leading-[1.75] text-muted-foreground sm:text-lg sm:leading-[1.875rem]">
                {article.excerpt}
              </p>
            )}
            <div data-reveal data-fade>
              <AuthorRow date={dateLabel} size="lg" />
            </div>
          </header>

          {/* Hero image */}
          {article.image && (
            <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 sm:px-6 lg:px-0">
              <div data-reveal data-fade className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-mint sm:aspect-[1120/500]">
                <div data-speed="-0.25" className="absolute -inset-y-[8%] inset-x-0">
                  <Image
                    src={article.image.src}
                    alt={article.image.alt}
                    fill
                    preload
                    sizes="(min-width: 1120px) 1120px, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="mx-auto w-full max-w-[720px] px-4 pb-24 sm:px-6 lg:px-0">
            {isPaid ? (
              <Suspense fallback={<LockedArticle article={article} isLoggedIn={false} />}>
                <MemberArticle article={article} />
              </Suspense>
            ) : (
              <>
                <ArticleBody html={article.publicBodyHtml} />
                <ArticleGallery images={article.images.slice(1)} />
              </>
            )}
          </div>
        </article>

        {/* More briefs */}
        {more.length > 0 && (
          <section aria-labelledby="more-title" className="container-site pb-28">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2
                id="more-title"
                data-fade
                className="text-[1.75rem] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-4xl sm:leading-[2.75rem]"
              >
                {moreTitle.before}
                <em className="font-serif text-[1.22em] font-normal tracking-[-0.01em] text-primary">{moreTitle.accent}</em>
              </h2>
              <Link href="/insights" className="group inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-primary">
                {insightsExtras.viewAll}
                <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
            <ul data-stagger className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {more.map((item) => (
                <li key={item.slug} data-stagger-item className="min-w-0">
                  <ArticleCard article={toCardArticle(item)} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </ScrollReveal>
    </>
  );
}
