"use client";

import { ArrowRight, Menu } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { Magnetic } from "@/components/motion/magnetic";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DURATION, EASE, SPRING, STAGGER } from "@/lib/animation/tokens";
import type { HeaderContent, NavLink } from "@/lib/content/home";
import { isExternalHref } from "@/lib/links";
import { cn } from "@/lib/utils";

import { BrandMark } from "./brand-mark";

/** Hide the header after scrolling down this far; show it again on scroll up. */
const HIDE_AFTER = 160;

function linkProps(href: string) {
  return isExternalHref(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

/** On the home page, "/#section" becomes "#section" so Lenis scrolls smoothly instead of jumping. */
function localize(href: string, pathname: string) {
  return pathname === "/" && href.startsWith("/#") ? href.slice(1) : href;
}

export function SiteHeader({ content: rawContent }: { content: HeaderContent }) {
  const pathname = usePathname();
  const content = useMemo<HeaderContent>(() => {
    const fix = (link: NavLink | null) => link && { ...link, href: localize(link.href, pathname) };
    return {
      ...rawContent,
      links: rawContent.links.map((link) => ({ ...link, href: localize(link.href, pathname) })),
      primaryAction: fix(rawContent.primaryAction),
      secondaryAction: fix(rawContent.secondaryAction),
    };
  }, [rawContent, pathname]);
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 16);
    setHidden(y > previous && y > HIDE_AFTER);
  });

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: hidden && !menuOpen ? "-140%" : 0, opacity: 1 }}
      transition={{ duration: DURATION.slow, ease: EASE.out }}
      className="fixed inset-x-0 top-0 z-50 pt-3 sm:pt-4"
    >
      <div className="container-site">
        <nav
          aria-label="Main"
          className="relative flex h-14 items-center justify-between gap-3 rounded-full bg-surface/85 pr-2 pl-2.5 ring-1 ring-border/80 backdrop-blur-xl sm:h-16 sm:pl-3"
        >
          {/* Shadow layer: fading its opacity is cheaper than animating box-shadow. */}
          <motion.span
            aria-hidden
            initial={false}
            animate={{ opacity: scrolled ? 1 : 0.45 }}
            transition={{ duration: DURATION.base, ease: EASE.out }}
            className="pointer-events-none absolute inset-0 -z-10 rounded-full shadow-float"
          />

          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded-full pr-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <BrandMark logo={content.logo} />
            <span className="text-[0.95rem] font-semibold tracking-tight sm:text-base">
              {content.title}
            </span>
          </Link>

          <DesktopNav links={content.links} pathname={pathname} />

          <div className="flex items-center gap-1.5">
            {content.secondaryAction && (
              <Link
                href={content.secondaryAction.href}
                {...linkProps(content.secondaryAction.href)}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "hidden h-10 rounded-full px-4 text-sm text-foreground/80 hover:bg-secondary md:inline-flex",
                )}
              >
                {content.secondaryAction.label}
              </Link>
            )}

            {content.primaryAction && (
              <Magnetic className="hidden sm:inline-flex">
                <Link
                  href={content.primaryAction.href}
                  {...linkProps(content.primaryAction.href)}
                  className={cn(
                    buttonVariants(),
                    "group h-10 gap-2 rounded-full pr-4 pl-5 text-sm shadow-[0_6px_16px_-6px_oklch(0.33_0.058_166/0.6)] hover:bg-primary/90 sm:h-11",
                  )}
                >
                  {content.primaryAction.label}
                  <ArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                </Link>
              </Magnetic>
            )}

            <MobileNav content={content} pathname={pathname} open={menuOpen} onOpenChange={setMenuOpen} />
          </div>
        </nav>
      </div>
    </motion.header>
  );
}

function DesktopNav({ links, pathname }: { links: NavLink[]; pathname: string }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (links.length === 0) return null;

  return (
    <ul
      className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
      onPointerLeave={() => setHovered(null)}
    >
      {links.map((link, index) => (
        <li key={`${link.label}-${index}`}>
          <Link
            href={link.href}
            {...linkProps(link.href)}
            onPointerEnter={() => setHovered(index)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(null)}
            aria-current={link.href === pathname ? "page" : undefined}
            className="relative isolate block rounded-full px-4 py-2 text-sm text-foreground/70 outline-none transition-colors duration-200 hover:text-foreground focus-visible:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
          >
            {hovered === index && (
              <motion.span
                layoutId="nav-hover-pill"
                transition={SPRING.snappy}
                className="absolute inset-0 -z-10 rounded-full bg-secondary"
              />
            )}
            {link.label}
            {link.href === pathname && (
              <span aria-hidden className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-gold" />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MobileNav({
  content,
  pathname,
  open,
  onOpenChange,
}: {
  content: HeaderContent;
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const close = () => onOpenChange(false);
  const actions = [content.secondaryAction, content.primaryAction].filter(Boolean) as NavLink[];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        aria-label="Open menu"
        className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "size-10 rounded-full lg:hidden")}
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side="right" className="w-[86%] gap-0 bg-background p-0 sm:max-w-sm">
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-2">
          <BrandMark logo={content.logo} />
          <SheetTitle className="text-base font-semibold">{content.title}</SheetTitle>
        </div>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>

        <AnimatePresence>
          {open && (
            <motion.ul
              className="flex flex-col px-3 pt-4"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: STAGGER.base, delayChildren: 0.1 } } }}
            >
              {content.links.map((link, index) => (
                <motion.li
                  key={`${link.label}-${index}`}
                  variants={{
                    hidden: { opacity: 0, x: 24 },
                    show: { opacity: 1, x: 0, transition: { duration: DURATION.base, ease: EASE.out } },
                  }}
                >
                  <Link
                    href={link.href}
                    {...linkProps(link.href)}
                    onClick={close}
                    aria-current={link.href === pathname ? "page" : undefined}
                    className="flex items-center justify-between rounded-2xl px-3 py-3.5 text-2xl font-medium tracking-tight transition-colors hover:bg-secondary aria-[current=page]:bg-secondary"
                  >
                    {link.label}
                    <ArrowRight className="size-5 text-muted-foreground" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {actions.length > 0 && (
          <div className="mt-auto grid gap-2 border-t border-border p-5">
            {actions.map((action, index) => (
              <Link
                key={action.label}
                href={action.href}
                {...linkProps(action.href)}
                onClick={close}
                className={cn(
                  buttonVariants({ variant: index === actions.length - 1 ? "default" : "outline" }),
                  "h-12 rounded-full text-base",
                )}
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
