import "server-only";

import { headers } from "next/headers";

/**
 * Calls to the WordPress endpoints that handle accounts and membership.
 * All run server-side only; passwords and tokens never reach the browser.
 * The endpoint contract is documented in docs/backend-requirements.md.
 */

export type Plan = "monthly" | "yearly";

export interface Membership {
  active: boolean;
  plan: Plan | null;
  status: string;
  /** ISO date the current period ends (renewal or end of access). */
  currentPeriodEnd: string | null;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  membership: Membership;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_credentials" | "email_exists" | "invalid_input" | "unavailable" | "unknown",
  ) {
    super(message);
  }
}

function wp(path: string) {
  const base = process.env.WORDPRESS_URL?.replace(/\/+$/, "");
  if (!base) throw new AuthError("WORDPRESS_URL is not set.", "unavailable");
  return `${base}/wp-json/${path}`;
}

/**
 * WordPress sees every request as coming from this server, so log-in and
 * sign-up rate limits need the visitor's IP. It is sent with the shared secret
 * so WordPress can trust it (anyone else's X-WH-Client-IP is ignored).
 */
async function visitorHeaders(): Promise<Record<string, string>> {
  const secret = process.env.WORDPRESS_REVALIDATE_SECRET;
  if (!secret) return {};
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
  return ip ? { "X-WH-Client-IP": ip, "X-WH-Secret": secret } : {};
}

async function post(path: string, body: unknown, token?: string) {
  const forwarded = token ? {} : await visitorHeaders();
  try {
    return await fetch(wp(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...forwarded,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new AuthError("We couldn’t reach the server. Please try again.", "unavailable");
  }
}

/** Email + password -> WordPress JWT (JWT Authentication for WP REST API plugin). */
export async function wpLogin(email: string, password: string) {
  const res = await post("jwt-auth/v1/token", { username: email, password });
  if (res.status === 404) {
    throw new AuthError("Log in isn’t available yet. Please try again later.", "unavailable");
  }
  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    code?: string;
    user_email?: string;
    user_display_name?: string;
  };
  if (data.code?.includes("too_many_attempts")) {
    throw new AuthError("Too many log-in attempts. Please wait 15 minutes and try again.", "invalid_credentials");
  }
  if (!res.ok || !data.token) {
    // Same message for unknown email and wrong password, so accounts can't be probed.
    throw new AuthError("That email and password don’t match.", "invalid_credentials");
  }
  return { token: data.token, email: data.user_email ?? email, name: data.user_display_name ?? "" };
}

/** Creates a WordPress user (custom endpoint, see backend doc). */
export async function wpRegister(input: {
  name: string;
  email: string;
  password: string;
  newsletter: boolean;
}) {
  const res = await post("wealthhub/v1/register", { ...input, terms_accepted: true });
  if (res.status === 404) {
    throw new AuthError("Sign-up isn’t available yet. Please try again later.", "unavailable");
  }
  if (res.ok) return;
  const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
  if (data.code === "email_exists") {
    throw new AuthError("An account with this email already exists. Try logging in.", "email_exists");
  }
  throw new AuthError(data.message || "We couldn’t create your account. Please check your details.", "invalid_input");
}

/**
 * The logged-in member and their membership.
 * - "unauthorized": WordPress rejected the token (expired or revoked) -> log out.
 * - null: couldn't confirm (endpoint not built yet / WordPress down) -> fail closed.
 */
export async function wpMe(token: string): Promise<Member | "unauthorized" | null> {
  let res: Response;
  try {
    res = await fetch(wp("wealthhub/v1/me"), {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (res.status === 401 || res.status === 403) return "unauthorized";
  if (!res.ok) return null;

  const data = (await res.json().catch(() => null)) as {
    id?: number;
    name?: string;
    email?: string;
    membership?: { active?: boolean; plan?: string; status?: string; current_period_end?: string };
  } | null;
  if (!data?.id) return null;

  return {
    id: data.id,
    name: data.name ?? "",
    email: data.email ?? "",
    membership: {
      active: data.membership?.active === true,
      plan: data.membership?.plan === "monthly" || data.membership?.plan === "yearly" ? data.membership.plan : null,
      status: data.membership?.status ?? "none",
      currentPeriodEnd: data.membership?.current_period_end ?? null,
    },
  };
}

/** Asks WordPress for a Stripe Checkout URL for the logged-in user. */
export async function wpCreateCheckout(token: string, plan: Plan, successUrl: string, cancelUrl: string) {
  const res = await post("wealthhub/v1/checkout", { plan, success_url: successUrl, cancel_url: cancelUrl }, token);
  if (res.status === 404) {
    throw new AuthError("Online payment isn’t connected yet. Please contact us to subscribe.", "unavailable");
  }
  const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!res.ok || !data.url) {
    throw new AuthError(data.message || "We couldn’t start checkout. Please try again.", "unknown");
  }
  // Only ever redirect to Stripe's own checkout domain.
  const url = new URL(data.url);
  if (url.protocol !== "https:" || !/(^|\.)stripe\.com$/.test(url.hostname)) {
    throw new AuthError("Checkout returned an unexpected address.", "unknown");
  }
  return url.toString();
}

/**
 * The full text of a members-only article, requested as the member. WordPress
 * decides whether to return it (backend doc §4).
 */
export async function wpMemberArticle(token: string, slug: string): Promise<string | null> {
  try {
    const url = new URL(wp("wp/v2/blog"));
    url.searchParams.set("slug", slug);
    url.searchParams.set("_fields", "acf.blog_long_description");
    const res = await fetch(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { acf?: { blog_long_description?: string } }[];
    return data[0]?.acf?.blog_long_description ?? null;
  } catch {
    return null;
  }
}
