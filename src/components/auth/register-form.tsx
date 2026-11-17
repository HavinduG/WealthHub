"use client";

import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DURATION, EASE, STAGGER } from "@/lib/animation/tokens";
import { registerAction, type FormState } from "@/lib/auth/actions";
import type { Plan } from "@/lib/auth/wordpress";
import { authExtras, insightsExtras } from "@/lib/content/insights-extras";
import { splitAccent } from "@/lib/text";
import { cn } from "@/lib/utils";

import { FormField } from "./form-field";

/**
 * Figma 04 "Create account (checkout step 1)": account form + plan summary.
 * Creates the WordPress user, logs them in, then continues to Stripe.
 */
export function RegisterForm({
  initialPlan,
  next,
  renewals,
}: {
  initialPlan: Plan;
  next: string;
  /** Pre-formatted renewal dates per plan (computed on the server). */
  renewals: Record<Plan, string>;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const { register } = authExtras;
  const title = splitAccent(register.title);
  const option = insightsExtras.plans[plan];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, ease: EASE.out }}
        className="min-w-0 rounded-[2rem] border border-border bg-card p-6 sm:p-12"
      >
        {/* Stepper */}
        <ol aria-label="Checkout steps" className="flex items-center gap-2 sm:gap-3">
          {register.steps.map((step, index) => (
            <li key={step} className="flex items-center gap-2 sm:gap-3" aria-current={index === 0 ? "step" : undefined}>
              {index > 0 && <span aria-hidden className="h-0.5 w-5 rounded-full bg-border sm:w-12" />}
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-xs font-medium",
                  index === 0 ? "bg-primary text-white" : "border border-border bg-card text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "text-[1.0625rem] leading-6 font-semibold tracking-[-0.005em]",
                  // On phones only the current step is labelled, so the stepper fits on one line.
                  index === 0 ? "text-foreground" : "sr-only text-muted-foreground sm:not-sr-only",
                )}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>

        <h1 className="mt-6 text-[2rem] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-4xl sm:leading-[2.75rem]">
          {title.before}
          <em className="font-serif text-[1.22em] font-normal tracking-[-0.01em] text-primary">{title.accent}</em>
        </h1>
        <p className="mt-6 text-base leading-[1.625rem] text-muted-foreground">{register.text}</p>

        <form action={action} className="mt-6 flex flex-col gap-6" noValidate>
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="plan" value={plan} />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Full name"
              name="name"
              autoComplete="name"
              required
              defaultValue={state.values?.name}
              error={state.fieldErrors?.name}
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              defaultValue={state.values?.email}
              error={state.fieldErrors?.email}
            />
          </div>
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            hint={register.passwordHint}
            error={state.fieldErrors?.password}
          />

          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-[1.375rem]">
              <Checkbox name="terms" required className="mt-px size-5 rounded-[6px]" aria-invalid={state.fieldErrors?.terms ? true : undefined} />
              {register.terms}
            </label>
            {state.fieldErrors?.terms && <p className="text-xs font-medium text-destructive">{state.fieldErrors.terms}</p>}
            <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-[1.375rem]">
              <Checkbox name="newsletter" defaultChecked className="mt-px size-5 rounded-[6px]" />
              {register.newsletter}
            </label>
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
            {pending ? "Creating your account…" : register.submit}
            <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          <p className="text-center text-xs leading-4 font-medium text-muted-foreground">{register.note}</p>
        </form>

        <div className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
          {register.haveAccount}{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-[0.9375rem] font-semibold text-primary hover:underline">
            {register.login}
          </Link>
        </div>
      </motion.div>

      {/* Order summary */}
      <motion.aside
        aria-label="Your plan"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: DURATION.slow, ease: EASE.out }}
        className="flex flex-col gap-5 overflow-hidden rounded-[2rem] bg-primary p-7 text-white shadow-[0_30px_60px_oklch(0.25_0.03_160/0.2)] sm:p-10 lg:sticky lg:top-8"
      >
        <p className="text-xs leading-4 font-semibold tracking-[0.08em] text-gold uppercase">{register.summaryEyebrow}</p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={plan}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: DURATION.fast, ease: EASE.out }}
            className="flex flex-col gap-5"
          >
            <p className="text-[1.375rem] leading-[1.875rem] font-semibold tracking-[-0.01em]">Insider · {option.label}</p>
            <p className="flex items-end gap-2">
              <span className="text-[2.875rem] leading-[3.125rem] font-bold tracking-[-0.03em]">{option.price}</span>
              <span className="text-base leading-[1.625rem] text-white/70">{option.periodLong}</span>
            </p>
            <dl className="text-sm">
              {[
                [register.billedToday, option.price],
                [register.renewsOn, renewals[plan]],
                [register.cancel, register.cancelValue],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-t border-white/12 py-3.5">
                  <dt className="leading-[1.375rem] text-white/75">{label}</dt>
                  <dd className="text-[1.0625rem] leading-6 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setPlan((current) => (current === "yearly" ? "monthly" : "yearly"))}
          className="w-fit text-[0.9375rem] font-semibold text-gold-soft hover:underline"
        >
          {register.changePlan} ({plan === "yearly" ? insightsExtras.plans.monthly.label : insightsExtras.plans.yearly.label})
        </button>

        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: STAGGER.base, delayChildren: 0.3 } } }}
          className="flex flex-col gap-3"
        >
          {insightsExtras.includes.map((item) => (
            <motion.li
              key={item}
              variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
              className="flex items-center gap-2.5 text-sm"
            >
              <Check aria-hidden className="size-4 text-gold" strokeWidth={2.5} />
              {item}
            </motion.li>
          ))}
        </motion.ul>

        <p className="flex gap-3 rounded-2xl bg-white/8 p-4 text-xs leading-4 font-medium text-white/85">
          <ShieldCheck aria-hidden className="size-5 shrink-0 text-gold" />
          {register.trust}
        </p>
      </motion.aside>
    </div>
  );
}
