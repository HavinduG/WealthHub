"use client";

import { Check, Search } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useDeferredValue, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DURATION, EASE, SPRING } from "@/lib/animation/tokens";
import { insightsExtras } from "@/lib/content/insights-extras";
import { splitAccent } from "@/lib/text";
import { cn } from "@/lib/utils";

import { ArticleCard, type CardArticle } from "./article-card";
import { FeaturedArticle } from "./featured-article";

const ALL = insightsExtras.allCategories;

/**
 * Insights list: category chips, search, the featured article and the card
 * grid. Filtering is instant (all teasers are on the page); Motion animates
 * the chip pill and re-flows the grid with layout animations.
 */
export function InsightsBrowser({ articles }: { articles: CardArticle[] }) {
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(insightsExtras.pageSize);
  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const article of articles) counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
    return [ALL, ...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)];
  }, [articles]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return articles.filter(
      (article) =>
        (category === ALL || article.category === category) &&
        (!q || `${article.title} ${article.excerpt} ${article.category}`.toLowerCase().includes(q)),
    );
  }, [articles, category, deferredQuery]);

  const [featured, ...rest] = filtered;
  const shown = rest.slice(0, visible);
  const latest = splitAccent(insightsExtras.latestTitle);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-4 pb-10 lg:flex-row lg:items-center lg:justify-between">
        <LayoutGroup id="insight-chips">
          <div
            role="toolbar"
            aria-label="Filter by category"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {categories.map((name) => {
              const selected = name === category;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setCategory(name);
                    setVisible(insightsExtras.pageSize);
                  }}
                  className={cn(
                    "relative isolate inline-flex shrink-0 items-center gap-2 rounded-full border px-[18px] py-[11px] text-sm leading-[1.375rem] font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected ? "border-transparent text-white" : "border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="insight-chip-pill"
                      transition={SPRING.snappy}
                      className="absolute inset-0 -z-10 rounded-full bg-primary"
                    />
                  )}
                  {selected && <Check aria-hidden className="size-3.5" strokeWidth={2.5} />}
                  {name}
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <label className="relative block w-full lg:w-[280px]">
          <span className="sr-only">{insightsExtras.searchPlaceholder}</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-[18px] size-[18px] -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(insightsExtras.pageSize);
            }}
            placeholder={insightsExtras.searchPlaceholder}
            className="h-[50px] rounded-full border-border bg-card pr-[18px] pl-12 text-sm"
          />
        </label>
      </div>

      {/* Featured */}
      <AnimatePresence mode="wait" initial={false}>
        {featured ? (
          <motion.div
            key={featured.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DURATION.base, ease: EASE.out }}
          >
            <FeaturedArticle article={featured} priority />
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-[2rem] border border-dashed border-border px-6 py-16 text-center text-muted-foreground"
          >
            {insightsExtras.emptyResults}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Latest */}
      {rest.length > 0 && (
        <section aria-labelledby="latest-title" className="pt-[72px]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="latest-title"
              className="text-[1.75rem] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-4xl sm:leading-[2.75rem]"
            >
              {latest.before}
              <em className="font-serif text-[1.22em] font-normal tracking-[-0.01em] text-primary">{latest.accent}</em>
            </h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Showing {Math.min(shown.length + 1, filtered.length)} of {filtered.length}{" "}
              {filtered.length === 1 ? "article" : "articles"}
            </p>
          </div>

          <motion.ul layout className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((article) => (
                <motion.li
                  key={article.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={SPRING.layout}
                  className="min-w-0"
                >
                  <ArticleCard article={article} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>

          {rest.length > shown.length && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setVisible((count) => count + insightsExtras.pageSize)}
                className="h-12 rounded-full bg-card px-6 text-[0.9375rem]"
              >
                {insightsExtras.loadMore}
              </Button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
