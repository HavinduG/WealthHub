import { Lock } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { getHomeAcf, toHeaderContent } from "@/lib/content/home";

/** Figma "Checkout bar": logo + "Secure checkout", no main navigation. */
export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const header = toHeaderContent(await getHomeAcf().catch(() => null));

  return (
    <>
      <header className="container-site flex items-center justify-between py-7">
        <Link href="/" className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <BrandMark logo={header.logo} className="size-[30px] rounded-lg" />
          <span className="text-[1.1875rem] leading-[1.875rem] font-bold tracking-[-0.01em]">{header.title}</span>
        </Link>
        <p className="flex items-center gap-2 text-sm">
          <Lock aria-hidden className="size-4 text-primary" />
          Secure checkout
        </p>
      </header>
      {children}
    </>
  );
}
