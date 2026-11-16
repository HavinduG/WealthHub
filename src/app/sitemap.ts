import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * Static routes so far. As more routes are built, add them here,
 * using `getAllPageSlugs()` / `getAllPostSlugs()` from `@/lib/wordpress` for
 * CMS-driven routes so `lastModified` comes from WordPress.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/calculator"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
