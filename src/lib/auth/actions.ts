"use server";

import { decodeJwt } from "jose";
import { redirect } from "next/navigation";
import { z } from "zod";

import { SITE_URL } from "@/lib/site";

import { getCurrentMember, safeNextPath } from "./dal";
import { createSession, deleteSession } from "./session";
import { AuthError, wpCreateCheckout, wpLogin, wpRegister, type Plan } from "./wordpress";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Echoed back so the form keeps what was typed (never the password). */
  values?: Record<string, string>;
}

const planSchema = z.enum(["monthly", "yearly"]);

/** WordPress JWTs carry the user id; read it for the session (not trusted for access). */
function userIdFromToken(token: string) {
  try {
    const payload = decodeJwt(token) as { data?: { user?: { id?: string | number } } };
    return Number(payload.data?.user?.id ?? 0);
  } catch {
    return 0;
  }
}

async function startSession(email: string, password: string, remember: boolean) {
  const { token, name, email: confirmedEmail } = await wpLogin(email, password);
  await createSession({ token, userId: userIdFromToken(token), name, email: confirmedEmail }, { remember });
  return token;
}

function firstErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

// --- Log in ----------------------------------------------------------------------

const loginSchema = z.object({
  email: z.email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(200),
  remember: z.boolean(),
  next: z.string().optional(),
});

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    remember: formData.get("remember") === "on",
    next: formData.get("next") ?? undefined,
  });
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error), values };

  try {
    await startSession(parsed.data.email, parsed.data.password, parsed.data.remember);
  } catch (error) {
    return { error: error instanceof AuthError ? error.message : "Something went wrong. Please try again.", values };
  }
  redirect(safeNextPath(parsed.data.next));
}

// --- Register (checkout step 1) --------------------------------------------------------

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.email("Enter a valid email address.").max(254),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(200)
    .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "Use letters and at least one number."),
  terms: z.literal(true, { error: "Please accept the Terms of use and Privacy policy." }),
  newsletter: z.boolean(),
  plan: planSchema.optional(),
  next: z.string().optional(),
});

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const plan = formData.get("plan");
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    terms: formData.get("terms") === "on",
    newsletter: formData.get("newsletter") === "on",
    plan: plan === "monthly" || plan === "yearly" ? plan : undefined,
    next: formData.get("next") ?? undefined,
  });
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error), values };

  const { name, email, password, newsletter } = parsed.data;
  const next = safeNextPath(parsed.data.next);
  let checkoutUrl: string | null = null;

  try {
    await wpRegister({ name, email, password, newsletter });
    const token = await startSession(email, password, true);
    if (parsed.data.plan) {
      checkoutUrl = await wpCreateCheckout(token, parsed.data.plan, `${SITE_URL}${next}`, `${SITE_URL}${next}`).catch(
        () => null,
      );
    }
  } catch (error) {
    return { error: error instanceof AuthError ? error.message : "Something went wrong. Please try again.", values };
  }

  // Account exists and the user is logged in. Go to Stripe if payment is
  // connected, otherwise back to where they came from.
  redirect(checkoutUrl ?? next);
}

// --- Subscribe (logged in) ---------------------------------------------------------------

export async function checkoutAction(_: FormState, formData: FormData): Promise<FormState> {
  const plan = planSchema.safeParse(formData.get("plan"));
  const next = safeNextPath(formData.get("next"));
  if (!plan.success) return { error: "Choose a plan." };

  const member = await getCurrentMember();
  if (!member) redirect(`/register?plan=${plan.data}&next=${encodeURIComponent(next)}`);
  if (member.membership.active) redirect(next);

  let url: string;
  try {
    url = await wpCreateCheckout(member.token, plan.data as Plan, `${SITE_URL}${next}`, `${SITE_URL}${next}`);
  } catch (error) {
    return { error: error instanceof AuthError ? error.message : "We couldn’t start checkout. Please try again." };
  }
  redirect(url);
}

// --- Log out --------------------------------------------------------------------------

export async function logoutAction(formData: FormData) {
  await deleteSession();
  redirect(safeNextPath(formData.get("next"), "/"));
}
