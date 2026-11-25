import { Suspense } from "react";

import { AccountMenu, LoginLink } from "@/components/layout/account-menu";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getHomeAcf, toFooterContent, toHeaderContent } from "@/lib/content/home";

/** Header and footer content live on the WordPress "Home" page; both fall back to defaults if unavailable. */
async function getHomeAcfSafe() {
  try {
    return await getHomeAcf();
  } catch (error) {
    console.warn("[layout] Could not load header/footer content:", error);
    return null;
  }
}

/** Pages with the main site header and footer (everything except checkout). */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const acf = await getHomeAcfSafe();
  const header = toHeaderContent(acf);
  const loginLabel = header.secondaryAction?.label;

  return (
    <>
      <SiteHeader
        content={header}
        account={
          // The session is read at request time; the cached shell shows "Log in" until it streams in.
          <Suspense fallback={<LoginLink label={loginLabel} />}>
            <AccountMenu loginLabel={loginLabel} />
          </Suspense>
        }
      />
      {children}
      <SiteFooter content={toFooterContent(acf)} />
    </>
  );
}
