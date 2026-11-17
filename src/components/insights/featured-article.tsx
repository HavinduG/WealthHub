"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { EASE } from "@/lib/animation/tokens";
import { insightsExtras } from "@/lib/content/insights-extras";

import { AccessBadge } from "./access-badge";
import type { CardArticle } from "./article-card";
import { badgeFor } from "./article-card";
import { AuthorRow, CategoryMeta } from "./article-meta";

/** Figma "Featured article": large image left, content right. Motion owns the hover zoom. */
export function FeaturedArticle({ article, priority = false }: { article: CardArticle; priority?: boolean }) {
  const { isLite } = useMotionPreferences();

  return (
    <motion.article
      initial="rest"
      animate="rest"
      whileHover={isLite ? undefined : "hover"}
      className="group relative grid overflow-hidden rounded-[2rem] border border-border bg-card lg:grid-cols-[minmax(0,700fr)_minmax(0,580fr)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-mint lg:aspect-auto lg:min-h-[460px]">
        {article.image && (
          <motion.div
            className="absolute inset-0"
            variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
            transition={{ duration: 0.9, ease: EASE.out }}
          >
            <Image
              src={article.image.src}
              alt={article.image.alt}
              fill
              preload={priority}
              sizes="(min-width: 1024px) 700px, 100vw"
              className="object-cover"
            />
          </motion.div>
        )}
      </div>

      <div className="flex flex-col justify-center gap-[18px] p-6 sm:p-10 lg:p-12">
        <div className="flex flex-wrap items-center gap-3">
          <AccessBadge access={badgeFor(article.access)} />
          <CategoryMeta category={article.category} readTime={article.readTime} />
        </div>
        <h2 className="text-[1.75rem] leading-[1.2] font-semibold tracking-[-0.02em] text-foreground sm:text-4xl sm:leading-[2.75rem]">
          <Link
            href={article.href}
            className="outline-none after:absolute after:inset-0 after:rounded-[2rem] focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {article.title}
          </Link>
        </h2>
        {article.excerpt && <p className="text-base leading-[1.625rem] text-muted-foreground">{article.excerpt}</p>}
        <AuthorRow date={article.dateLabel} size="md" />
        <span className="inline-flex items-center gap-2 text-[0.9375rem] leading-5 font-semibold text-primary">
          {insightsExtras.readLink}
          <ArrowRight aria-hidden className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
        </span>
      </div>
    </motion.article>
  );
}
