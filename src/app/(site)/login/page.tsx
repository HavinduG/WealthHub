import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentMember, safeNextPath } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to read your Wealth Hub Insider articles.",
  robots: { index: false, follow: true },
};

function forgotPasswordHref() {
  const base = process.env.WORDPRESS_URL?.replace(/\/+$/, "") ?? "";
  return `${base}/wp-login.php?action=lostpassword`;
}

/** Reads ?next= and the session at request time. */
async function LoginView({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getCurrentMember()) redirect(next);
  return <LoginForm next={next} forgotHref={forgotPasswordHref()} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main id="main" className="relative isolate flex min-h-svh flex-1 items-center justify-center overflow-hidden px-4 pt-28 pb-20 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[15%] aspect-square w-[44rem] max-w-none"
          style={{ background: "radial-gradient(closest-side, oklch(0.92 0.045 160 / 0.7), transparent)" }}
        />
        <div
          className="absolute -right-[20%] -bottom-[30%] aspect-square w-[40rem] max-w-none"
          style={{ background: "radial-gradient(closest-side, oklch(0.94 0.055 80 / 0.6), transparent)" }}
        />
      </div>
      <Suspense fallback={<LoginForm next="/insights" forgotHref={forgotPasswordHref()} />}>
        <LoginView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
