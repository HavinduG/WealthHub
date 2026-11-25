/**
 * Advisor section settings that have NO ACF field in WordPress yet. The text
 * and button labels are dynamic (home page `title`, `short_section_*`), and the
 * sample chat uses the `questions` FAQ.
 */

export const advisorExtras = {
  eyebrow: "Talk to an advisor",
  status: "Advisors online now",
  /** Where "Book a free call" goes. Placeholder until a booking link exists. */
  callHref: "#eligibility",
  /**
   * WhatsApp number in international format, digits only (e.g. "9715XXXXXXXX").
   * While empty, the WhatsApp button links to `callHref` instead.
   */
  whatsappNumber: "",
  whatsappMessage: "Hi Wealth Hub, I have a question about my mortgage.",
  chat: {
    name: "Wealth Hub advisor",
    initials: "SR",
    online: "Online · replies in minutes",
    languages: "English · العربية",
  },
  /** Advisor initials shown in the avatar stack (same advisors as the hero). */
  initials: ["SR", "MA", "JK"],
};

export function whatsappHref() {
  const number = advisorExtras.whatsappNumber.replace(/\D/g, "");
  if (!number) return advisorExtras.callHref;
  return `https://wa.me/${number}?text=${encodeURIComponent(advisorExtras.whatsappMessage)}`;
}
