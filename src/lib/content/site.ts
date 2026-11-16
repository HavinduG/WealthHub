import "server-only";

import { SITE_FALLBACK } from "@/lib/site";
import { getSiteInfo } from "@/lib/wordpress";

/** Site title and tagline from WordPress, with a fallback so the build never depends on the CMS being up. */
export async function getSite() {
  try {
    const info = await getSiteInfo();
    return {
      name: info.name || SITE_FALLBACK.name,
      description: info.description || SITE_FALLBACK.description,
    };
  } catch (error) {
    console.warn("[site] Could not load WordPress site info:", error);
    return SITE_FALLBACK;
  }
}
