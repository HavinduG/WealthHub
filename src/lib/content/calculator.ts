import "server-only";

import { toCalculatorSettings, type CalculatorAcf, type CalculatorSettings } from "@/lib/calculator/settings";
import { calculatorExtras } from "@/lib/content/calculator-extras";
import { resolveHref } from "@/lib/links";
import { getPageBySlug } from "@/lib/wordpress";

import type { NavLink } from "./home";

/** WordPress page that holds the calculator text and rules. */
export const CALCULATOR_SLUG = "calculator-page";

export interface CalculatorPageContent {
  heading: string;
  tabs: { borrow: string; cost: string };
  resultHeadings: { borrow: string; cost: string };
  primaryCta: NavLink | null;
  secondaryCta: NavLink | null;
  disclaimer: string;
}

function cta(label: string | undefined, link: string | undefined, fallbackHref: string): NavLink | null {
  const text = label?.trim();
  if (!text) return null;
  return {
    label: text,
    href: link?.trim() ? resolveHref(link, text, process.env.WORDPRESS_URL) : fallbackHref,
  };
}

function toContent(acf: CalculatorAcf | null | undefined): CalculatorPageContent {
  const a = acf ?? {};
  return {
    heading: a.calc_heading?.trim() || "What do you want to calculate?",
    tabs: {
      borrow: a.tab_borrow_label?.trim() || "How much can I borrow?",
      cost: a.tab_cost_label?.trim() || "How much does it cost?",
    },
    resultHeadings: {
      borrow: a.result_borrow_heading?.trim() || "Here’s your affordability",
      cost: a.result_cost_heading?.trim() || "Here’s what it costs",
    },
    primaryCta: cta(a.cta_primary_label, a.cta_primary_link, calculatorExtras.fallbackHrefs.primary),
    secondaryCta: cta(a.cta_secondary_label, a.cta_secondary_link, calculatorExtras.fallbackHrefs.secondary),
    disclaimer: a.disclaimer?.trim() ?? "",
  };
}

export interface CalculatorData {
  content: CalculatorPageContent;
  settings: CalculatorSettings;
}

/**
 * Calculator text + rules. If WordPress is unreachable or the page is missing,
 * the calculator still works with default UAE rules.
 */
export async function getCalculatorData(): Promise<CalculatorData> {
  try {
    const page = await getPageBySlug<CalculatorAcf>(CALCULATOR_SLUG, { embed: false });
    return { content: toContent(page?.acf), settings: toCalculatorSettings(page?.acf) };
  } catch (error) {
    console.warn("[calculator] Could not load calculator settings, using defaults:", error);
    return { content: toContent(null), settings: toCalculatorSettings(null) };
  }
}
