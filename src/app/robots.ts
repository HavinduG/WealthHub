import type { MetadataRoute } from "next";

import { IS_LOCAL_SITE, absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Never let crawlers index a local or unconfigured site.
  if (IS_LOCAL_SITE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
