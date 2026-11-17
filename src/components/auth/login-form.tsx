"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DURATION, EASE } from "@/lib/animation/tokens";
import { loginAction, type FormState } from "@/lib/auth/actions";
import { authExtras } from "@/lib/content/insights-extras";
import { splitAccent } from "@/lib/text";

import { FormField } from "./form-field";

/** Figma 07 "Log in" card. Posts to a Server Action; the password never touches client storage. */
export function LoginForm({ next, forgotHref }: { next: string; forgotHref: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  const { login } = authExtras;
  const title = splitAccent(login.title, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: DURATION.slow, ease: EASE.out }}
      className="w-full max-w-[480px] rounded-[2rem] bg-card p-7 shadow-[0_40px_80px_-30px_oklch(0.25_0.03_160/0.35)] ring-1 ring-black/5 sm:p-11"
    >
      <h1 className="text-[2rem] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-4xl sm:leading-[2.75rem]">
        {title.before}
        <em className="font-serif text-[1.22em] font-normal tracking-[-0.01em] text-primary">{title.accent}</em>
      </h1>
      <p className="mt-5 text-base leading-[1.625rem] text-muted-foreground">{login.text}</p>

      <form action={action} className="mt-5 flex flex-col gap-5" noValidate>
        <input type="hidden" name="next" value={next} />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
          placeholder="you@email.com"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox name="remember" defaultChecked className="size-5 rounded-[6px]" />
            {login.remember}
          </label>
          <a href={forgotHref} className="text-[0.9375rem] font-semibold text-primary hover:underline">
            {login.forgot}
          </a>
        </div>

        {state.error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="group h-auto w-full gap-2.5 rounded-full py-4 text-[0.9375rem] leading-5 font-semibold hover:bg-primary/90"
        >
          {pending ? "Logging in…" : login.submit}
          <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
      </form>

      <div className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
        {login.newHere}{" "}
        <Link
          href={`/register?plan=yearly&next=${encodeURIComponent(next)}`}
          className="text-[0.9375rem] font-semibold text-primary hover:underline"
        >
          {login.plansLink}
        </Link>
      </div>
    </motion.div>
  );
}
