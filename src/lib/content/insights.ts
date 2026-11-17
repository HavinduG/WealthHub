import "server-only";

import type { CardArticle } from "@/components/insights/article-card";
import { wpFetch } from "@/lib/wordpress/client";
import type { ACFFlexibleRow, ACFImage } from "@/lib/wordpress/types";

import type { SiteImage } from "./home";

/** Cache tag for every blog request; /api/revalidate accepts it. */
export const BLOG_TAG = "wp:blog";

/** Number of top-level blocks (paragraphs, lists) shown before the paywall. */
const PREVIEW_BLOCKS = 3;

interface BlogAcf {
  free_or_paid?: string;
  blog_short_title?: string;
  blog_title?: string;
  blog_images?: ACFFlexibleRow<"blog_image", { blog_image_: ACFImage | false }>[] | false;
  blog_category?: string;
  blog_time?: string;
  blog_short_description?: string;
  blog_long_description?: string;
  blog_date?: string;
}

interface WPBlog {
  id: number;
  slug: string;
  date: string;
  modified: string;
  title: { rendered: string };
  acf: BlogAcf | [];
}

export type Access = "free" | "paid";

/** Card/teaser data. Never contains the article body. */
export interface ArticleTeaser {
  id: number;
  slug: string;
  href: string;
  title: string;
  shortTitle: string;
  category: string;
  readTime: string;
  /** Plain-text teaser. */
  excerpt: string;
  /** ISO date (from `blog_date`, falling back to the WordPress publish date). */
  date: string;
  modified: string;
  image: SiteImage | null;
  access: Access;
}

export interface Article extends ArticleTeaser {
  images: SiteImage[];
  /**
   * Safe-to-publish body: the full text for free articles, only the opening
   * blocks for paid ones. The full paid text is fetched per member, never here.
   */
  publicBodyHtml: string;
  /** True when `publicBodyHtml` is a preview of a longer members-only article. */
  isPreview: boolean;
}

const FIELDS = "id,slug,date,modified,title,acf";

function decodeEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

export function htmlToText(html: string) {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

/** "16/11/2026" -> ISO date; falls back to the WordPress date. */
function parseBlogDate(value: string | undefined, fallback: string) {
  const match = value?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return fallback;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00`;
}

function toImage(image: ACFImage | false | undefined, alt: string): SiteImage | null {
  if (!image || !image.url) return null;
  return { src: image.url, alt: image.alt || alt, width: image.width, height: image.height };
}

/** First N top-level blocks of WordPress HTML (paragraphs, lists, headings, quotes). */
export function previewHtml(html: string, blocks = PREVIEW_BLOCKS) {
  const matches = html.match(/<(p|ol|ul|h[1-6]|blockquote)\b[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
  return matches.slice(0, blocks).join("\n");
}

function toTeaser(post: WPBlog): ArticleTeaser {
  const acf = Array.isArray(post.acf) ? {} : post.acf;
  const title = acf.blog_title?.trim() || decodeEntities(post.title.rendered);
  const images = Array.isArray(acf.blog_images) ? acf.blog_images : [];
  return {
    id: post.id,
    slug: post.slug,
    href: `/insights/${post.slug}`,
    title,
    shortTitle: acf.blog_short_title?.trim() || title,
    category: acf.blog_category?.trim() || "Insights",
    readTime: acf.blog_time?.trim() ? `${acf.blog_time.trim()} read` : "",
    excerpt: htmlToText(acf.blog_short_description ?? ""),
    date: parseBlogDate(acf.blog_date, post.date),
    modified: post.modified,
    image: toImage(images[0]?.blog_image_, title),
    // Anything not explicitly "Free" is treated as members-only (fails closed).
    access: acf.free_or_paid?.trim().toLowerCase() === "free" ? "free" : "paid",
  };
}

async function fetchAll(query: Record<string, string | number> = {}) {
  return wpFetch<WPBlog[]>(
    "wp/v2/blog",
    { per_page: 100, _fields: FIELDS, orderby: "date", order: "desc", ...query },
    { tags: [BLOG_TAG] },
  );
}

/** All articles, newest first, as teasers (no body text). */
export async function getArticles(): Promise<ArticleTeaser[]> {
  try {
    const posts = await fetchAll();
    return posts.map(toTeaser).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  } catch (error) {
    console.warn("[insights] Could not load articles:", error);
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const posts = await fetchAll({ slug });
  const post = posts[0];
  if (!post) return null;

  const teaser = toTeaser(post);
  const acf = Array.isArray(post.acf) ? {} : post.acf;
  const body = acf.blog_long_description ?? "";
  const images = (Array.isArray(acf.blog_images) ? acf.blog_images : [])
    .map((row) => toImage(row.blog_image_, teaser.title))
    .filter((image): image is SiteImage => image !== null);

  const isPaid = teaser.access === "paid";
  return {
    ...teaser,
    images,
    publicBodyHtml: isPaid ? previewHtml(body) : body,
    isPreview: isPaid,
  };
}

export async function getArticleSlugs() {
  const articles = await getArticles();
  return articles.map((article) => article.slug);
}

/** "16 Nov 2026" */
export function formatArticleDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Serializable card data for client components (teaser only, never the body). */
export function toCardArticle(article: ArticleTeaser): CardArticle {
  return {
    slug: article.slug,
    href: article.href,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    readTime: article.readTime,
    dateLabel: formatArticleDate(article.date),
    access: article.access,
    image: article.image && { src: article.image.src, alt: article.image.alt },
  };
}
