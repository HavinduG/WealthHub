"use client";

import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import Form from "next/form";
import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SPRING } from "@/lib/animation/tokens";
import { checkoutAction, type FormState } from "@/lib/auth/actions";
import type { Plan } from "@/lib/auth/wordpress";
import { insightsExtras } from "@/lib/content/insights-extras";
import { splitAccent } from "@/lib/text";
import { cn } from "@/lib/utils";

const PLANS: Plan[] = ["yearly", "monthly"];

/**
 * Figma "Paywall". Shown after the preview when the viewer isn't a paying
 * member. Logged out: continues to Create account with the chosen plan.
 * Logged in: asks WordPress for a Stripe Checkout link (server action).
 */
export function Paywall({ next, isLoggedIn }: { next: string; isLoggedIn: boolean }) {
  const { paywall, plans } = insightsExtras;
  const [plan, setPlan] = useState<Plan>("yearly");
  const [state, checkout, pending] = useActionState<FormState, FormData>(checkoutAction, {});
  const title = splitAccent(paywall.title);

  const planPicker = (
    <RadioGroup
      name="plan"
      value={plan}
      onValueChange={(value) => setPlan(value as Plan)}
      aria-label="Choose a plan"
      className="w-full gap-2.5"
    >
      {PLANS.map((key) => {
        const option = plans[key];
        const selected = plan === key;
        return (
          <label
            key={key}
            className={cn(
              "relative isolate flex cursor-pointer items-center gap-3.5 rounded-2xl border px-5 py-4 text-left transition-colors",
              selected ? "border-transparent" : "border-border bg-card hover:bg-muted/60",
            )}
          >
            {selected && (
              <motion.span
                layoutId="paywall-plan"
                transition={SPRING.snappy}
                className="absolute inset-0 -z-10 rounded-2xl border-[1.5px] border-primary bg-mint/45"
              />
            )}
            <RadioGroupItem value={key} className="size-5 border-[1.5px] data-checked:border-[6px] data-checked:bg-card **:data-[slot=radio-group-indicator]:hidden" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[1.0625rem] leading-6 font-semibold tracking-[-0.005em]">{option.label}</span>
                {option.tag && (
                  <span className="rounded-full bg-gold-soft px-2 py-[3px] text-xs leading-4 font-medium">{option.tag}</span>
                )}
              </span>
              <span className="text-xs leading-4 font-medium text-muted-foreground">{option.note}</span>
            </span>
            <span className="text-[1.0625rem] leading-6 font-semibold tracking-[-0.005em] whitespace-nowrap">
              {option.price} {option.period}
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );

  const submit = (
    <Button
      type="submit"
      disabled={pending}
      className="group h-auto w-full gap-2.5 rounded-full py-4 pr-[22px] pl-[26px] text-[0.9375rem] leading-5 font-semibold hover:bg-primary/90"
    >
      {pending ? "Opening secure checkout…" : paywall.cta}
      <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Button>
  );

  return (
    <div className="relative w-full max-w-[640px] rounded-[2rem] border border-border bg-card p-6 text-center shadow-[0_30px_60px_-20px_oklch(0.25_0.03_160/0.25)] sm:p-11">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-mint text-primary">
        <Lock aria-hidden className="size-6" />
      </div>
      <p className="mt-5 text-xs leading-4 font-semibold tracking-[0.08em] text-primary uppercase">{paywall.eyebrow}</p>
      <h2 className="mt-5 text-[1.75rem] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-4xl sm:leading-[2.75rem]">
        {title.before}
        <em className="font-serif text-[1.22em] font-normal tracking-[-0.01em] text-primary">{title.accent}</em>
      </h2>
      <p className="mt-5 text-base leading-[1.625rem] text-muted-foreground">{paywall.text}</p>

      <div className="mt-5 flex flex-col gap-5">
        {isLoggedIn ? (
          <form action={checkout} className="flex flex-col gap-5">
            <input type="hidden" name="next" value={next} />
            {planPicker}
            {submit}
            {state.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}
          </form>
        ) : (
          <Form action="/register" className="flex flex-col gap-5">
            <input type="hidden" name="next" value={next} />
            {planPicker}
            {submit}
          </Form>
        )}

        {!isLoggedIn && (
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            {paywall.loginPrompt}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-[0.9375rem] font-semibold text-primary hover:underline">
              {paywall.login}
            </Link>
          </p>
        )}
        <p className="flex items-center justify-center gap-1.5 text-xs leading-4 font-medium text-muted-foreground">
          <ShieldCheck aria-hidden className="size-3.5" />
          {paywall.trust}
        </p>
      </div>
    </div>
  );
}
