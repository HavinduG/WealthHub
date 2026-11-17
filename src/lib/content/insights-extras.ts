/**
 * Insights / membership copy from the Figma design that has NO ACF field in
 * WordPress yet. Prices are placeholders for the client to confirm (Figma note).
 * Article content itself is all dynamic (WordPress `blog` post type).
 */

import type { Plan } from "@/lib/auth/wordpress";

export const insightsExtras = {
  page: {
    eyebrow: "Insights",
    title: "Dubai property news, *decoded.*",
    description:
      "Market briefs, rate alerts and buyer guides from Wealth Hub mortgage advisors. New every week for Insider members.",
    metaTitle: "Insights",
  },
  latestTitle: "Latest from *our advisors.*",
  moreTitle: "More *members-only briefs.*",
  viewAll: "View all insights",
  readLink: "Read the brief",
  searchPlaceholder: "Search articles",
  allCategories: "All",
  emptyResults: "No articles match that search yet.",
  pageSize: 6,
  loadMore: "Show more articles",

  /** No author field in WordPress yet; every article is credited to the team. */
  author: { initials: "WH", name: "Wealth Hub advisors", role: "Mortgage advisory team" },

  badge: { locked: "Members", unlocked: "Unlocked", free: "Free read" },

  insiderCard: {
    pill: "Wealth Hub Insider",
    title: "Read everything, from AED 49 a month.",
    text: "Or AED 490 a year. Cancel anytime.",
    cta: "See plans",
  },

  subscribeBand: {
    eyebrow: "Wealth Hub Insider",
    title: "Get the weekly market brief *before everyone else.*",
    text: "Join for AED 49 a month or AED 490 a year. Cancel anytime from your account.",
    primary: "See Insider plans",
    secondary: "Log in",
  },

  paywall: {
    eyebrow: "Members only",
    title: "Keep reading with Wealth Hub *Insider.*",
    text: "Unlock this brief and every members-only article, rate alert and buyer guide from our mortgage advisors.",
    cta: "Subscribe and keep reading",
    loginPrompt: "Already an Insider?",
    login: "Log in",
    trust: "Secure payment by Stripe · Cancel anytime from your account",
  },

  plans: {
    yearly: {
      label: "Yearly",
      tag: "Save 2 months",
      price: "AED 490",
      period: "/ yr",
      periodLong: "/ year",
      note: "AED 40.83 a month, billed yearly",
    },
    monthly: {
      label: "Monthly",
      tag: "",
      price: "AED 49",
      period: "/ mo",
      periodLong: "/ month",
      note: "Billed monthly, cancel anytime",
    },
  } satisfies Record<Plan, object>,

  includes: ["Every members-only article", "Weekly market brief by email", "Rate-change alerts"],
};

export const authExtras = {
  login: {
    title: "Welcome *back.*",
    text: "Log in to read your members-only articles.",
    remember: "Keep me logged in",
    forgot: "Forgot password?",
    submit: "Log in",
    newHere: "New here?",
    plansLink: "See Insider plans",
  },
  register: {
    secure: "Secure checkout",
    steps: ["Account", "Payment", "Done"],
    title: "Create your *Insider account.*",
    text: "You’ll use this to log in and read members-only articles on any device.",
    passwordHint: "At least 10 characters, with letters and a number.",
    terms: "I agree to the Terms of use and Privacy policy",
    newsletter: "Email me the weekly market brief",
    submit: "Continue to secure payment",
    submitNoPlan: "Create account",
    note: "Next you’ll pay on Stripe’s secure page, then come straight back to Wealth Hub.",
    haveAccount: "Already have an account?",
    login: "Log in",
    summaryEyebrow: "Your plan",
    billedToday: "Billed today",
    renewsOn: "Renews on",
    cancel: "Cancel",
    cancelValue: "Anytime",
    changePlan: "Change plan",
    trust: "Payments are processed by Stripe. Wealth Hub never sees or stores your card details.",
  },
};
