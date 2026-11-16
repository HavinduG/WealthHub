/**
 * "How it works" content that has NO ACF field in WordPress yet. Move each
 * item into ACF when ready and read it in `@/lib/content/home.ts` instead.
 */

export const howItWorksExtras = {
  eyebrow: "How it works",
  /** Shown while `how_it_works_title_button` is empty in WordPress. */
  defaultButtonLabel: "Plan my 90 days",
  /** Where the button goes: the eligibility bar in the hero. */
  buttonHref: "#eligibility",
  /** Timing tag on each card, in card order. Cards beyond this list get no tag. */
  stepTimings: ["Day 1", "Week 1", "Weeks 2–4", "By day 90"],
  /** Labels under the progress line, spread evenly from start to end. */
  timelineMarks: ["Day 1", "Day 7", "Day 30", "Day 60", "Day 90"],
};
