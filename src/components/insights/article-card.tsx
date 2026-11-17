"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { SPRING } from "@/lib/animation/tokens";
import { cn } from "@/lib/utils";

import { AccessBadge, type BadgeAccess } from "./access-badge";
import { AuthorRow, CategoryMeta } from "./article-meta";

/** Serializable teaser data for cards (no article body). */
export interface CardArticle {
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  dateLabel: string;
  access: "free" | "paid";
  image: { src: string; alt: string } | null;
}

export function badgeFor(access: "free" | "paid", isMember = false): BadgeAccess {
  if (access === "free") return "free";
  return isMember ? "unlocked" : "locked";
}

/**
 * Figma "Article card". Motion owns the hover (lift + image zoom); GSAP may
 * reveal the wrapper around it, never this element.
 */
export function ArticleCard({ article, className }: { article: CardArticle; className?: string }) {
  const { isLite } = useMotionPreferences();

  return (
    <motion.article
      initial="rest"
      animate="rest"
      whileHover={isLite ? undefined : "hover"}
      variants={{ rest: { y: 0 }, hover: { y: -6 } }}
      transition={SPRING.soft}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-shadow duration-500 hover:shadow-float",
        className,
      )}
    >
      <div className="relative h-[220px] overflow-hidden bg-mint">
        {article.image && (
          <motion.div
            className="absolute inset-0"
            variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={article.image.src}
              alt={article.image.alt}
              fill
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        )}
        <AccessBadge access={badgeFor(article.access)} className="absolute top-4 left-4" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <CategoryMeta category={article.category} readTime={article.readTime} />
        <h3 className="text-[1.375rem] leading-[1.875rem] font-semibold tracking-[-0.01em] text-foreground">
          {/* Stretched link: the whole card is clickable, the title is the accessible name. */}
          <Link href={article.href} className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50">
            {article.title}
          </Link>
        </h3>
        {article.excerpt && (
          <p className="line-clamp-3 text-sm leading-[1.375rem] text-muted-foreground">{article.excerpt}</p>
        )}
        <AuthorRow date={article.dateLabel} className="mt-auto pt-2" />
      </div>
    </motion.article>
  );
}
