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
  /** Advisor short section. */
  title: string;
  short_section_description: string;
  short_section_button_1: string;
  short_section_button_2: string;
  /** FAQ as WordPress editor HTML: one `<p>` per item, bold question, `<br>`, answer. */
  questions: string;
  faq_title: string;
  faq_button: string;
  footer_logo: ACFImage | false;
  footer_title: string;
  footer_description: string;
  footer_links: ACFFlexibleRow<
    "footer_link",
    {
      footer_link_title: string;
      footer_links_url_names: ACFFlexibleRow<"footer_links_url_name", { url_name: string; link_urls: string }>[];
    }
  >[];
  social_media: ACFFlexibleRow<
    "social_media",
    { social_media_name: string; social_media_image: ACFImage | false; social_media_link: string }
  >[];
  personal_data: ACFFlexibleRow<
    "personal_data",
    { personal_data_name: string; personal_data_detail: string; personal_data_image: ACFImage | false }
  >[];
  /** Field name is spelled "textimonials" in WordPress. */
  textimonials: ACFFlexibleRow<
    "textimonial",
    { name: string; position_or_role: string; description: string; stars_feedback: string }
  >[];
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

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  /** Whole stars, 0–5. */
  stars: number;
}

/** Quote text from the CMS: collapses line breaks and drops stray wrapping quote marks. */
function cleanQuote(text: string) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["“”]+|["“”]+$/g, "")
    .trim();
}

function toStars(value: string | undefined) {
  const stars = Math.round(Number(value));
  return Number.isFinite(stars) ? Math.min(5, Math.max(0, stars)) : 5;
}

/** Member testimonials. Empty when WordPress has none (the section is then hidden). */
export function toTestimonials(acf: Partial<HomeAcf> | null): Testimonial[] {
  return (acf?.textimonials ?? [])
    .filter((row) => row.name?.trim() && row.description?.trim())
    .map((row) => ({
      name: row.name.trim(),
      role: row.position_or_role?.trim() ?? "",
      quote: cleanQuote(row.description),
      stars: toStars(row.stars_feedback),
    }));
}

export interface FaqItem {
  question: string;
  answer: string;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#8217": "’", nbsp: " " };

function htmlToText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#?\w+);/g, (match, name: string) => ENTITIES[name] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

/** FAQ items from the `questions` editor field: "<p><strong>1. Question?</strong><br />Answer</p>". */
export function toFaqItems(html: string | undefined): FaqItem[] {
  if (!html) return [];
  return [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(([, body]) => {
      const strong = body!.match(/<strong>([\s\S]*?)<\/strong>/i);
      if (!strong) return null;
      const question = htmlToText(strong[1]!).replace(/^\d+[.)]\s*/, "");
      const answer = htmlToText(body!.replace(strong[0], ""));
      return question && answer ? { question, answer } : null;
    })
    .filter((item): item is FaqItem => item !== null);
}

export interface AdvisorContent {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  /** Shown as a sample advisor chat. */
  faqs: FaqItem[];
}

/** Advisor short section. Null when the title is empty in WordPress. */
export function toAdvisorContent(acf: Partial<HomeAcf> | null): AdvisorContent | null {
  const title = acf?.title?.trim();
  if (!title) return null;
  return {
    title,
    description: acf?.short_section_description?.trim() ?? "",
    primaryLabel: acf?.short_section_button_1?.trim() ?? "",
    secondaryLabel: acf?.short_section_button_2?.trim() ?? "",
    faqs: toFaqItems(acf?.questions),
  };
}

export interface FaqContent {
  items: FaqItem[];
  /** CTA card text beside the questions. */
  ctaTitle: string;
  ctaLabel: string;
}

/** FAQ section. Null when the `questions` field has no items. */
export function toFaqContent(acf: Partial<HomeAcf> | null): FaqContent | null {
  const items = toFaqItems(acf?.questions);
  if (items.length === 0) return null;
  return {
    items,
    ctaTitle: acf?.faq_title?.trim() ?? "",
    ctaLabel: acf?.faq_button?.trim() ?? "",
  };
}

/**
 * Where empty footer links go: sections and pages that exist on this site.
 * A link set in WordPress always wins; labels with no match stay plain text.
 */
const FOOTER_ROUTES: [RegExp, string][] = [
  [/how it works/i, "/#how-it-works"],
  [/eligib/i, "/#eligibility"],
  [/mortgage|calculator|afford/i, "/calculator"],
  [/insight|blog|news/i, "/insights"],
  [/advisor|contact/i, "/#advisor"],
  [/faq|question/i, "/#faq"],
  [/testimonial|review/i, "/#testimonials"],
  [/log ?in|sign ?in/i, "/login"],
  [/subscribe|join|sign ?up|register|plans?$/i, "/register?plan=yearly"],
];

function footerHref(link: string | undefined, label: string): string | null {
  if (link?.trim()) return toSiteHref(resolveHref(link, label, wordpressUrl()));
  return FOOTER_ROUTES.find(([pattern]) => pattern.test(label))?.[1] ?? null;
}

export interface FooterLink {
  label: string;
  /** Null while WordPress has no URL and no page on the site matches the label. */
  href: string | null;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterSocial {
  name: string;
  href: string | null;
  icon: SiteImage | null;
}

export interface FooterContact {
  label: string;
  value: string;
  /** mailto:/tel: for email and phone rows. */
  href: string | null;
  icon: SiteImage | null;
}

export interface FooterContent {
  title: string;
  description: string;
  logo: SiteImage | null;
  columns: FooterColumn[];
  socials: FooterSocial[];
  /** Only rows with a detail filled in. */
  contacts: FooterContact[];
}

function contactHref(label: string, value: string) {
  if (/mail/i.test(label) || /^\S+@\S+\.\S+$/.test(value)) return `mailto:${value}`;
  if (/phone|tel|mobile|whatsapp/i.test(label)) return `tel:${value.replace(/[^\d+]/g, "")}`;
  return null;
}

export function toFooterContent(acf: Partial<HomeAcf> | null): FooterContent {
  const title = acf?.footer_title?.trim() || acf?.header_title?.trim() || "Wealth Hub";
  return {
    title,
    description: acf?.footer_description?.trim() ?? "",
    logo: toImage(acf?.footer_logo, title) ?? toImage(acf?.header_image, title),
    columns: (acf?.footer_links ?? [])
      .map((column) => ({
        title: column.footer_link_title?.trim() ?? "",
        links: (column.footer_links_url_names ?? [])
          .filter((link) => link.url_name?.trim())
          .map((link) => ({ label: link.url_name.trim(), href: footerHref(link.link_urls, link.url_name.trim()) })),
      }))
      .filter((column) => column.links.length > 0),
    socials: (acf?.social_media ?? [])
      .filter((item) => item.social_media_name?.trim())
      .map((item) => ({
        name: item.social_media_name.trim(),
        href: item.social_media_link?.trim() || null,
        icon: toImage(item.social_media_image, item.social_media_name),
      })),
    contacts: (acf?.personal_data ?? [])
      .filter((item) => item.personal_data_name?.trim() && item.personal_data_detail?.trim())
      .map((item) => {
        const label = item.personal_data_name.trim();
        const value = item.personal_data_detail.trim();
        return { label, value, href: contactHref(label, value), icon: toImage(item.personal_data_image, label) };
      }),
  };
}
