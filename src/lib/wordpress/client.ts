import "server-only";

import { cacheLife, cacheTag } from "next/cache";

/** Every WordPress response carries this tag; revalidating it refreshes all CMS content. */
export const WP_TAG = "wp";

export type WPQueryValue = string | number | boolean | undefined | null | Array<string | number>;
export type WPQuery = Record<string, WPQueryValue>;

export interface WPRequestOptions {
  /** Extra cache tags for targeted revalidation, e.g. `["wp:page:home"]`. */
  tags?: string[];
}

export interface WPResponse<T> {
  data: T;
  total: number;
  totalPages: number;
}

export class WordPressError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "WordPressError";
  }
}

function getWordPressUrl() {
  const url = process.env.WORDPRESS_URL;
  if (!url) {
    throw new Error("WORDPRESS_URL is not set. Copy .env.example to .env and set it.");
  }
  return url.replace(/\/+$/, "");
}

function buildUrl(path: string, query: WPQuery) {
  const url = new URL(`${getWordPressUrl()}/wp-json/${path.replace(/^\/+/, "")}`);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === false) continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return url.toString();
}

/**
 * Low-level cached request to the WordPress REST API. Returns the JSON body
 * plus pagination totals from the `X-WP-Total` / `X-WP-TotalPages` headers.
 *
 * Responses are cached for an hour (`cacheLife("hours")`) and tagged with
 * `wp` plus any custom tags, so `/api/revalidate` can refresh them instantly.
 *
 * @example wpRequest<WPPage[]>("wp/v2/pages", { slug: "home" }, { tags: ["wp:page:home"] })
 */
export async function wpRequest<T>(
  path: string,
  query: WPQuery = {},
  options: WPRequestOptions = {},
): Promise<WPResponse<T>> {
  "use cache";
  cacheLife("hours");
  cacheTag(WP_TAG, ...(options.tags ?? []));

  const url = buildUrl(path, query);
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    throw new WordPressError(
      `WordPress request failed: ${res.status} ${res.statusText}`,
      res.status,
      url,
    );
  }

  return {
    data: (await res.json()) as T,
    total: Number(res.headers.get("x-wp-total") ?? 0),
    totalPages: Number(res.headers.get("x-wp-totalpages") ?? 0),
  };
}

/** Same as `wpRequest`, but returns only the JSON body. */
export async function wpFetch<T>(
  path: string,
  query: WPQuery = {},
  options: WPRequestOptions = {},
): Promise<T> {
  const { data } = await wpRequest<T>(path, query, options);
  return data;
}

/**
 * ACF to REST returns `[]` instead of `{}` when a post has no field values.
 * Normalises that so `item.acf.someField` is always safe to read.
 */
export function normalizeAcf<T extends { acf?: unknown }>(item: T): T {
  if (!item.acf || Array.isArray(item.acf)) {
    return { ...item, acf: {} };
  }
  return item;
}
