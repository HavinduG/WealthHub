import "server-only";

import { normalizeAcf, wpFetch, wpRequest, type WPQuery } from "./client";
import type {
  AcfFields,
  WPMedia,
  WPPage,
  WPPaginated,
  WPPost,
  WPSiteInfo,
} from "./types";

/** Cache tags, also accepted by POST /api/revalidate. */
export const wpTags = {
  site: "wp:site",
  options: "wp:options",
  pages: "wp:pages",
  page: (slug: string) => `wp:page:${slug}`,
  posts: "wp:posts",
  post: (slug: string) => `wp:post:${slug}`,
  media: (id: number) => `wp:media:${id}`,
} as const;

const MAX_PER_PAGE = 100;

interface ListOptions {
  page?: number;
  perPage?: number;
  /** Include featured image, author and terms (`?_embed`). */
  embed?: boolean;
  /** Any other wp/v2 query params, e.g. `{ orderby: "menu_order", categories: 3 }`. */
  query?: WPQuery;
}

// --- Site ---------------------------------------------------------------------

/** Site title, tagline and URLs from the REST API index (`/wp-json`). */
export async function getSiteInfo(): Promise<WPSiteInfo> {
  return wpFetch<WPSiteInfo>(
    "",
    { _fields: "name,description,url,home" },
    { tags: [wpTags.site] },
  );
}

/**
 * ACF options page fields (`acf/v3/options/{id}`). The default ACF options
 * page id is `options`.
 */
export async function getAcfOptions<TAcf extends AcfFields = AcfFields>(
  optionsId = "options",
): Promise<TAcf> {
  const { acf } = normalizeAcf(
    await wpFetch<{ acf: TAcf | [] }>(`acf/v3/options/${optionsId}`, {}, { tags: [wpTags.options] }),
  );
  return acf as TAcf;
}

// --- Pages ----------------------------------------------------------------------

export async function getPageBySlug<TAcf extends AcfFields = AcfFields>(
  slug: string,
  { embed = true }: { embed?: boolean } = {},
): Promise<WPPage<TAcf> | null> {
  const pages = await wpFetch<WPPage<TAcf>[]>(
    "wp/v2/pages",
    { slug, _embed: embed },
    { tags: [wpTags.pages, wpTags.page(slug)] },
  );
  return pages[0] ? normalizeAcf(pages[0]) : null;
}

export async function getPages<TAcf extends AcfFields = AcfFields>({
  page = 1,
  perPage = 20,
  embed = false,
  query = {},
}: ListOptions = {}): Promise<WPPaginated<WPPage<TAcf>>> {
  const { data, total, totalPages } = await wpRequest<WPPage<TAcf>[]>(
    "wp/v2/pages",
    { page, per_page: perPage, _embed: embed, ...query },
    { tags: [wpTags.pages] },
  );
  return { items: data.map(normalizeAcf), total, totalPages };
}

// --- Posts ----------------------------------------------------------------------

export async function getPostBySlug<TAcf extends AcfFields = AcfFields>(
  slug: string,
  { embed = true }: { embed?: boolean } = {},
): Promise<WPPost<TAcf> | null> {
  const posts = await wpFetch<WPPost<TAcf>[]>(
    "wp/v2/posts",
    { slug, _embed: embed },
    { tags: [wpTags.posts, wpTags.post(slug)] },
  );
  return posts[0] ? normalizeAcf(posts[0]) : null;
}

export async function getPosts<TAcf extends AcfFields = AcfFields>({
  page = 1,
  perPage = 10,
  embed = true,
  query = {},
}: ListOptions = {}): Promise<WPPaginated<WPPost<TAcf>>> {
  const { data, total, totalPages } = await wpRequest<WPPost<TAcf>[]>(
    "wp/v2/posts",
    { page, per_page: perPage, _embed: embed, ...query },
    { tags: [wpTags.posts] },
  );
  return { items: data.map(normalizeAcf), total, totalPages };
}

// --- Slugs (generateStaticParams / sitemap) -------------------------------------

export interface WPSlugEntry {
  slug: string;
  modified_gmt: string;
}

async function getAllSlugs(endpoint: "wp/v2/pages" | "wp/v2/posts", tag: string) {
  const fetchPage = (page: number) =>
    wpRequest<WPSlugEntry[]>(
      endpoint,
      { page, per_page: MAX_PER_PAGE, _fields: "slug,modified_gmt" },
      { tags: [tag] },
    );

  const first = await fetchPage(1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => fetchPage(i + 2)),
  );
  return [first, ...rest].flatMap((res) => res.data);
}

export function getAllPageSlugs() {
  return getAllSlugs("wp/v2/pages", wpTags.pages);
}

export function getAllPostSlugs() {
  return getAllSlugs("wp/v2/posts", wpTags.posts);
}

// --- Media ----------------------------------------------------------------------

export async function getMediaById(id: number): Promise<WPMedia | null> {
  if (!id) return null;
  return wpFetch<WPMedia>(`wp/v2/media/${id}`, {}, { tags: [wpTags.media(id)] });
}

/** Featured image from an item fetched with `embed: true`. */
export function getFeaturedMedia(item: { _embedded?: { "wp:featuredmedia"?: WPMedia[] } }) {
  return item._embedded?.["wp:featuredmedia"]?.[0] ?? null;
}
