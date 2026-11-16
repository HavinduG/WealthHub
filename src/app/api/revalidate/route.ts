import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { type NextRequest } from "next/server";

import { WP_TAG } from "@/lib/wordpress/client";

/**
 * On-demand revalidation webhook for WordPress.
 *
 * POST /api/revalidate
 * Header: x-revalidate-secret: <WORDPRESS_REVALIDATE_SECRET>
 * Body (optional JSON): { "tags": ["wp:page:home", "wp:pages"] }
 *
 * No tags means everything fetched from WordPress (`wp`) is refreshed.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.WORDPRESS_REVALIDATE_SECRET;
  const received = request.headers.get("x-revalidate-secret") ?? "";

  if (!expected) {
    return Response.json({ error: "Revalidation is not configured" }, { status: 500 });
  }
  if (!safeEqual(received, expected)) {
    return Response.json({ error: "Invalid secret" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown };
  const tags =
    Array.isArray(body.tags) && body.tags.length > 0
      ? body.tags.filter((tag): tag is string => typeof tag === "string" && tag.startsWith(WP_TAG))
      : [WP_TAG];

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  return Response.json({ revalidated: true, tags, now: Date.now() });
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
