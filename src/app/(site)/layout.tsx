import { Suspense } from "react";

import { AccountMenu, LoginLink } from "@/components/layout/account-menu";
import { SiteHeader } from "@/components/layout/site-header";
import { getHomeAcf, toHeaderContent } from "@/lib/content/home";

/** Header content lives on the WordPress "Home" page; falls back to defaults if unavailable. */
async function getHeader() {
  try {
    return toHeaderContent(await getHomeAcf());
  } catch (error) {
    console.warn("[layout] Could not load header content:", error);
    return toHeaderContent(null);
  }
}

/** Pages with the main site header (everything except checkout). */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const header = await getHeader();
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
    </>
  );
}
