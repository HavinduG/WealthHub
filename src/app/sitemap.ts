import type { MetadataRoute } from "next";

import { getArticles } from "@/lib/content/insights";
import { absoluteUrl } from "@/lib/site";

/** Static routes plus every Insights article (lastModified from WordPress). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles();

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/calculator"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/insights"), changeFrequency: "daily", priority: 0.9 },
    ...articles.map((article) => ({
      url: absoluteUrl(article.href),
      lastModified: article.modified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
