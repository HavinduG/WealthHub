/** Turns a label into a URL-safe slug: "How it works" -> "how-it-works". */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolves a CMS link for this site.
 * - Links to the WordPress site become site-relative paths (`/about`).
 * - Other absolute URLs, `mailto:`, `tel:` and `#anchors` are kept.
 * - An empty link falls back to an on-page anchor built from the label, so
 *   "How it works" -> `#how-it-works` until a real URL is set in WordPress.
 */
export function resolveHref(link: string | null | undefined, label: string, wordpressUrl?: string) {
  const value = link?.trim();
  if (!value) return `#${slugify(label)}`;

  if (wordpressUrl) {
    const base = wordpressUrl.replace(/\/+$/, "");
    if (value === base || value.startsWith(`${base}/`)) {
      const path = value.slice(base.length) || "/";
      return path.length > 1 ? path.replace(/\/+$/, "") : path;
    }
  }
  return value;
}

/** True for links that leave the site and should open in a new tab. */
export function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}
