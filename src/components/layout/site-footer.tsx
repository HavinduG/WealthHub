import Image from "next/image";
import Link from "next/link";

import { ScrollReveal } from "@/components/motion/scroll-reveal";
import type { FooterContent, FooterSocial } from "@/lib/content/home";
import { isExternalHref } from "@/lib/links";
import { cn } from "@/lib/utils";

import { BrandMark } from "./brand-mark";
import { BackToTop, CurrentYear, FooterWordmark } from "./footer-parts";

const linkProps = (href: string) => (isExternalHref(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});

/** Brand glyphs for common networks (lucide has no brand icons). WordPress `social_media_image` wins. */
const SOCIAL_PATHS: [RegExp, string][] = [
  [
    /facebook/i,
    "M14 8.5V6.6c0-.9.6-1.1 1-1.1h2.6V1.6L14 1.5c-4 0-4.9 3-4.9 4.9v2.1H6.8v4h2.3V22.5H14V12.5h3.3l.4-4H14z",
  ],
  [
    /instagram/i,
    "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 4.7a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2zm0 8.4a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6zm5.3-9.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z",
  ],
  [
    /twitter|^x$/i,
    "M17.8 2.5h3.1l-6.7 7.7 7.9 10.5h-6.2l-4.8-6.3-5.6 6.3H2.4l7.2-8.2L2 2.5h6.3l4.4 5.8 5.1-5.8zm-1.1 16.4h1.7L7.4 4.2H5.6l11.1 14.7z",
  ],
  [
    /linkedin/i,
    "M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1zm1.8 13.1H3.6V9h3.5v11.5z",
  ],
  [
    /youtube/i,
    "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.9 3-5.9 3z",
  ],
];

function SocialIcon({ social }: { social: FooterSocial }) {
  if (social.icon) {
    return <Image src={social.icon.src} alt="" width={18} height={18} className="size-[18px] object-contain" />;
  }
  const path = SOCIAL_PATHS.find(([pattern]) => pattern.test(social.name))?.[1];
  if (!path) return <span className="text-xs font-semibold">{social.name.charAt(0)}</span>;
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px] fill-current">
      <path d={path} />
    </svg>
  );
}

const socialClass =
  "grid size-10 place-items-center rounded-full border border-primary-foreground/20 text-primary-foreground/80 transition-all duration-300";

/** Site footer: every field comes from the WordPress "Home" page (`footer_*`, `social_media`, `personal_data`). */
export function SiteFooter({ content }: { content: FooterContent }) {
  return (
    <footer className="relative isolate mt-8 overflow-hidden rounded-t-[2.5rem] bg-primary text-primary-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-gold/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px)] [background-size:96px_100%] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
      />

      <ScrollReveal className="container-site pt-16 sm:pt-20 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div data-fade className="lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
            >
              <BrandMark logo={content.logo} className="size-10 bg-primary-foreground/10" />
              <span className="text-xl font-bold tracking-[-0.01em]">{content.title}</span>
            </Link>
            {content.description && (
              <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed text-primary-foreground/70">
                {content.description}
              </p>
            )}

            {content.socials.length > 0 && (
              <ul className="mt-8 flex gap-2.5">
                {content.socials.map((social) => (
                  <li key={social.name}>
                    {social.href ? (
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.name}
                        className={cn(
                          socialClass,
                          "outline-none hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-primary focus-visible:ring-4 focus-visible:ring-gold/40",
                        )}
                      >
                        <SocialIcon social={social} />
                      </a>
                    ) : (
                      <span role="img" aria-label={social.name} title={social.name} className={socialClass}>
                        <SocialIcon social={social} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            data-stagger
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6 lg:grid-cols-4"
          >
            {content.columns.map((column) => (
              <nav key={column.title} data-stagger-item aria-label={column.title || undefined}>
                {column.title && (
                  <p className="text-xs font-semibold tracking-[0.12em] text-gold uppercase">{column.title}</p>
                )}
                <ul className="mt-5 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href ? (
                        <Link
                          href={link.href}
                          {...linkProps(link.href)}
                          className="group relative inline-flex text-[0.95rem] text-primary-foreground/75 outline-none transition-colors duration-300 hover:text-primary-foreground focus-visible:text-primary-foreground"
                        >
                          <span className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                            {link.label}
                          </span>
                          <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" />
                        </Link>
                      ) : (
                        <span className="text-[0.95rem] text-primary-foreground/50">{link.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {content.contacts.length > 0 && (
              <div data-stagger-item>
                <p className="text-xs font-semibold tracking-[0.12em] text-gold uppercase">Contact</p>
                <ul className="mt-5 flex flex-col gap-4">
                  {content.contacts.map((contact) => (
                    <li key={contact.label} className="text-[0.95rem]">
                      <span className="block text-xs text-primary-foreground/50">{contact.label}</span>
                      {contact.href ? (
                        <a
                          href={contact.href}
                          className="text-primary-foreground/85 underline-offset-4 outline-none hover:text-gold hover:underline focus-visible:underline"
                        >
                          {contact.value}
                        </a>
                      ) : (
                        <span className="text-primary-foreground/85">{contact.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div
          data-fade
          className="mt-16 flex flex-col-reverse items-start justify-between gap-6 border-t border-primary-foreground/15 pt-8 sm:flex-row sm:items-center"
        >
          <p className="text-sm text-primary-foreground/60">
            © <CurrentYear /> {content.title}. All rights reserved.
          </p>
          <BackToTop label="Back to top" />
        </div>
      </ScrollReveal>

      <FooterWordmark text={content.title} />
    </footer>
  );
}
