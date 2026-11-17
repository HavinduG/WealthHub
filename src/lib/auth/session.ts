import "server-only";

import { EncryptJWT, base64url, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { connection } from "next/server";

/**
 * Encrypted session cookie.
 *
 * - The payload (incl. the WordPress auth token) is encrypted with A256GCM, so
 *   it can't be read or forged without SESSION_SECRET.
 * - httpOnly: JavaScript in the browser can't read it (XSS can't steal it).
 * - secure in production, sameSite=lax: not sent on cross-site POSTs.
 * - Membership is NOT stored here; it's re-checked with WordPress on demand,
 *   so cancelling a subscription takes effect immediately.
 */

export const SESSION_COOKIE = "wh_session";

/** Matches the default WordPress JWT lifetime (7 days). */
const SESSION_DAYS = 7;

export interface Session {
  /** WordPress JWT, sent as `Authorization: Bearer` to WordPress. Never sent to the browser. */
  token: string;
  userId: number;
  name: string;
  email: string;
  /** Unix seconds. */
  expiresAt: number;
}

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set. See .env.example.");
  const key = base64url.decode(secret);
  if (key.length !== 32) throw new Error("SESSION_SECRET must be 32 bytes, base64url-encoded.");
  return key;
}

export async function createSession(
  data: Omit<Session, "expiresAt">,
  { remember }: { remember: boolean },
) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const value = await new EncryptJWT({ ...data })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .encrypt(getKey());

  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // "Keep me logged in" -> persistent cookie; otherwise it ends with the browser session.
    ...(remember && { expires: new Date(expiresAt * 1000) }),
  });
}

/** The current session, or null if missing, tampered with or expired. */
export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  // Checking expiry reads the current time, which must happen per request.
  await connection();
  try {
    const { payload } = await jwtDecrypt(value, getKey());
    if (typeof payload.token !== "string" || typeof payload.userId !== "number") return null;
    return {
      token: payload.token,
      userId: payload.userId,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      expiresAt: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
