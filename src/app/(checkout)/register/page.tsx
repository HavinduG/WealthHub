import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentMember, safeNextPath } from "@/lib/auth/dal";
import type { Plan } from "@/lib/auth/wordpress";

export const metadata: Metadata = {
  title: "Create your Insider account",
  description: "Create a Wealth Hub Insider account to read every members-only article.",
  robots: { index: false, follow: true },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Reads ?plan= & ?next= and the session at request time. */
async function RegisterView({ searchParams }: { searchParams: PageProps<"/register">["searchParams"] }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const plan: Plan = params.plan === "monthly" ? "monthly" : "yearly";

  // Active members don't need to sign up again.
  const member = await getCurrentMember();
  if (member?.membership.active) redirect(next);

  // Renewal dates depend on today's date, so compute them per request.
  await connection();
  const today = new Date();
  const inAYear = new Date(today);
  inAYear.setFullYear(today.getFullYear() + 1);
  const inAMonth = new Date(today);
  inAMonth.setMonth(today.getMonth() + 1);

  return (
    <RegisterForm
      initialPlan={plan}
      next={next}
      renewals={{ yearly: formatDate(inAYear), monthly: formatDate(inAMonth) }}
    />
  );
}

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <main id="main" className="container-site flex-1 pt-6 pb-24 sm:pt-10 lg:pb-32">
      <Suspense
        fallback={<div className="min-h-[640px] animate-pulse rounded-[2rem] bg-card/60" aria-busy="true" />}
      >
        <RegisterView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
