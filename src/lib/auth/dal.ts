import "server-only";

import { cache } from "react";

import { getSession } from "./session";
import { wpMe, type Member } from "./wordpress";

/**
 * Data Access Layer: the one place that turns the session cookie into a
 * member. Reads cookies, so callers must sit inside a <Suspense> boundary.
 * `cache` dedupes the WordPress lookup within a single request.
 */
export const getCurrentMember = cache(async (): Promise<(Member & { token: string }) | null> => {
  const session = await getSession();
  if (!session) return null;
  if (session.expiresAt * 1000 < Date.now()) return null;

  const member = await wpMe(session.token);
  if (member === "unauthorized") return null;
  if (member) return { ...member, token: session.token };

  // WordPress didn't confirm the user (endpoint not built yet, or token
  // expired). Keep them logged in by name, but never as a paying member.
  return {
    id: session.userId,
    name: session.name,
    email: session.email,
    membership: { active: false, plan: null, status: "unknown", currentPeriodEnd: null },
    token: session.token,
  };
});

/** Same-site path only, so login can't be abused to redirect to another site. */
export function safeNextPath(value: unknown, fallback = "/insights") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
