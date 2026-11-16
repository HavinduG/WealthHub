/** Public site configuration, safe to import from server and client code. */

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const SITE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

/** Used until (or if) the WordPress site title can't be loaded. */
export const SITE_FALLBACK = {
  name: "WealthHub",
  description: "",
} as const;

/** True while the site URL points at a local machine. robots.txt blocks crawlers then. */
export const IS_LOCAL_SITE = /^https?:\/\/(localhost|127\.|0\.0\.0\.0)/.test(SITE_URL);

/** Turns a path like `/about` into an absolute URL on this site. */
export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
