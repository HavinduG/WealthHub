import "server-only";

import { resolveHref } from "@/lib/links";
import { getPageBySlug } from "@/lib/wordpress";
import type { ACFFlexibleRow, ACFImage } from "@/lib/wordpress/types";

/** WordPress page that holds the home page (and global header) ACF fields. */
export const HOME_SLUG = "home";

/** ACF fields on the WordPress "Home" page used so far (header + hero). */
export interface HomeAcf {
  [key: string]: unknown;
  header_image: ACFImage | false;
  header_title: string;
  header_menu_bars: ACFFlexibleRow<
    "header_menu_bar",
    { header_menu_name: string; header_menu_link: string }
  >[];
  button_1: string;
  button_2: string;
  hero_image: ACFImage | false;
  hero_title: string;
  hero_paragraph: string;
  hero_button_1: string;
  hero_button_2: string;
  sws_title_1: string;
  sws_title_2: string;
  step_cards: ACFFlexibleRow<
    "step_card",
    { step_icon: ACFImage | false; step_title: string; step_description: string }
  >[];
  how_it_works_title: string;
  how_it_works_title_description: string;
  how_it_works_title_button: string;
  how_it_works_title_cards: ACFFlexibleRow<
    "how_it_works_title_card",
    { how_it_works_title_card_title: string; how_it_works_title_card_description: string }
  >[];
  calculator_title: string;
  calculator_description: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface HeaderContent {
  title: string;
  logo: SiteImage | null;
  links: NavLink[];
  secondaryAction: NavLink | null;
  primaryAction: NavLink | null;
}

export interface HeroContent {
  title: string;
  /** Trusted HTML from the WordPress editor. */
  paragraphHtml: string;
  image: SiteImage | null;
  primaryAction: NavLink | null;
  secondaryAction: NavLink | null;
}

const wordpressUrl = () => process.env.WORDPRESS_URL;

function toImage(image: ACFImage | false | null | undefined, fallbackAlt = ""): SiteImage | null {
  if (!image || !image.url) return null;
  return {
    src: image.url,
    alt: image.alt || fallbackAlt,
    width: image.width,
    height: image.height,
  };
}

/**
 * Pages that exist on this site, used while a WordPress link field is empty:
 * a menu item or button with one of these labels links to the page instead of
 * an on-page anchor. A link set in WordPress always wins.
 */
const KNOWN_ROUTES: [RegExp, string][] = [
  [/^insights?$|^blog$/i, "/insights"],
  [/^calculator$/i, "/calculator"],
  [/^log ?in$|^sign ?in$/i, "/login"],
  [/^subscribe$|^join$|^sign ?up$|^register$/i, "/register?plan=yearly"],
];

function siteHref(link: string | undefined, label: string) {
  if (!link?.trim()) {
    const known = KNOWN_ROUTES.find(([pattern]) => pattern.test(label.trim()));
    if (known) return known[1];
  }
  return resolveHref(link, label, wordpressUrl());
}

function toAction(label: string | undefined, link?: string): NavLink | null {
  const text = label?.trim();
  if (!text) return null;
  // CMS button text may be lowercase ("login"); buttons read better capitalised.
  const display = text.charAt(0).toUpperCase() + text.slice(1);
  return { label: display, href: siteHref(link, text) };
}

/** Raw home page ACF, or null if the page doesn't exist. */
export async function getHomeAcf() {
  const page = await getPageBySlug<HomeAcf>(HOME_SLUG, { embed: false });
  return page?.acf ?? null;
}

/** On-page anchors in the header point at the home page ("/#how-it-works") so they work from any page. */
function toSiteHref(href: string) {
  return href.startsWith("#") ? `/${href}` : href;
}

function toSiteAction(action: NavLink | null) {
  return action && { ...action, href: toSiteHref(action.href) };
}

/** The calculator page link, added after the first menu item unless WordPress already has one. */
export const CALCULATOR_NAV_LINK: NavLink = { label: "Calculator", href: "/calculator" };

function withCalculatorLink(links: NavLink[], link: NavLink, index: number, all: NavLink[]) {
  links.push(link);
  const hasCalculator = all.some((item) => /calculator/i.test(item.label) || item.href === CALCULATOR_NAV_LINK.href);
  if (index === 0 && !hasCalculator) links.push(CALCULATOR_NAV_LINK);
  return links;
}

export function toHeaderContent(acf: Partial<HomeAcf> | null): HeaderContent {
  const title = acf?.header_title?.trim() || "Wealth Hub";
  return {
    title,
    logo: toImage(acf?.header_image, title),
    links: (acf?.header_menu_bars ?? [])
      .filter((row) => row.header_menu_name?.trim())
      .map((row) => ({
        label: row.header_menu_name.trim(),
        href: toSiteHref(siteHref(row.header_menu_link, row.header_menu_name)),
      }))
      .reduce<NavLink[]>(withCalculatorLink, []),
    secondaryAction: toSiteAction(toAction(acf?.button_1)),
    primaryAction: toSiteAction(toAction(acf?.button_2)),
  };
}

export function toHeroContent(acf: Partial<HomeAcf> | null): HeroContent | null {
  if (!acf?.hero_title) return null;
  return {
    title: acf.hero_title.trim(),
    paragraphHtml: acf.hero_paragraph ?? "",
    image: toImage(acf.hero_image),
    primaryAction: toAction(acf.hero_button_1),
    secondaryAction: toAction(acf.hero_button_2),
  };
}

export interface StepCard {
  title: string;
  description: string;
  icon: SiteImage | null;
}

export interface StartContent {
  eyebrow: string;
  title: string;
  steps: StepCard[];
}

/** "Start where you are" section. Null when there are no step cards to show. */
export function toStartContent(acf: Partial<HomeAcf> | null): StartContent | null {
  const steps = (acf?.step_cards ?? [])
    .filter((card) => card.step_title?.trim())
    .map((card) => ({
      title: card.step_title.trim(),
      description: card.step_description?.trim() ?? "",
      icon: toImage(card.step_icon),
    }));
  if (steps.length === 0) return null;

  return {
    eyebrow: acf?.sws_title_1?.trim() ?? "",
    title: acf?.sws_title_2?.trim() ?? "",
    steps,
  };
}

export interface HowItWorksStep {
  title: string;
  description: string;
}

export interface HowItWorksContent {
  title: string;
  description: string;
  /** CMS button text; empty means "use the default label". */
  buttonLabel: string;
  steps: HowItWorksStep[];
}

/** "How it works" section. Null when there are no step cards to show. */
export function toHowItWorksContent(acf: Partial<HomeAcf> | null): HowItWorksContent | null {
  const steps = (acf?.how_it_works_title_cards ?? [])
    .filter((card) => card.how_it_works_title_card_title?.trim())
    .map((card) => ({
      title: card.how_it_works_title_card_title.trim(),
      description: card.how_it_works_title_card_description?.trim() ?? "",
    }));
  if (steps.length === 0) return null;

  return {
    title: acf?.how_it_works_title?.trim() ?? "",
    description: acf?.how_it_works_title_description?.trim() ?? "",
    buttonLabel: acf?.how_it_works_title_button?.trim() ?? "",
    steps,
  };
}

export interface CalculatorSectionContent {
  title: string;
  description: string;
}

/** Home page calculator section text. Shown even if the fields are empty (the calculator is the content). */
export function toCalculatorSectionContent(acf: Partial<HomeAcf> | null): CalculatorSectionContent {
  return {
    title: acf?.calculator_title?.trim() ?? "",
    description: acf?.calculator_description?.trim() ?? "",
  };
}
