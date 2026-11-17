import Image from "next/image";

import { getCurrentMember } from "@/lib/auth/dal";
import { wpMemberArticle } from "@/lib/auth/wordpress";
import type { Article } from "@/lib/content/insights";
import type { SiteImage } from "@/lib/content/home";

import { AccessBadge } from "./access-badge";
import { Paywall } from "./paywall";

/** Trusted HTML from the WordPress editor. */
export function ArticleBody({ html }: { html: string }) {
  return <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Extra article images (after the first, which is the hero). */
export function ArticleGallery({ images }: { images: SiteImage[] }) {
  if (images.length === 0) return null;
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      {images.map((image) => (
        <div key={image.src} className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-mint">
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 360px, 100vw" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

/** Preview that fades out, then the paywall (Figma "Preview fade" + "Paywall"). */
export function LockedArticle({ article, isLoggedIn }: { article: Article; isLoggedIn: boolean }) {
  return (
    <div id="article-paywall">
      <div className="relative max-h-[22rem] overflow-hidden">
        <ArticleBody html={article.publicBodyHtml} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
      </div>
      <div className="mt-6 flex justify-center">
        <Paywall next={article.href} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}

/**
 * Members-only article body. Reads the session (request time), so it streams
 * in behind <Suspense>; the fallback is the logged-out view. The full text is
 * fetched per member from WordPress and never cached or sent to non-members.
 */
export async function MemberArticle({ article }: { article: Article }) {
  const member = await getCurrentMember();

  if (member?.membership.active) {
    const full = await wpMemberArticle(member.token, article.slug);
    if (full) {
      return (
        <>
          <ArticleBody html={full} />
          <ArticleGallery images={article.images.slice(1)} />
        </>
      );
    }
  }

  return <LockedArticle article={article} isLoggedIn={Boolean(member)} />;
}

/** Badge in the article head: "Members" for visitors, "Unlocked" for members. */
export async function MemberBadge() {
  const member = await getCurrentMember();
  return <AccessBadge access={member?.membership.active ? "unlocked" : "locked"} />;
}
