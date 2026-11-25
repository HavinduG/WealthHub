/**
 * Testimonials section copy that has NO ACF field in WordPress yet. The
 * testimonials themselves are dynamic (home page `textimonials` rows).
 */

export const testimonialsExtras = {
  eyebrow: "Member stories",
  title: "Read by buyers who *moved with confidence.*",
  description: "What Wealth Hub Insider members say about the briefs, rate alerts and guides.",
  /** Seconds each testimonial stays up before the next one plays. */
  autoplaySeconds: 7,
  previous: "Previous testimonial",
  next: "Next testimonial",
  show: "Show testimonial from",
  ratingLabel: (stars: number) => `Rated ${stars} out of 5`,
};
