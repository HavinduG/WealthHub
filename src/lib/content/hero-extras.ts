/**
 * Hero content that has NO ACF field in WordPress yet. Move each item into
 * ACF when you're ready and read it in `@/lib/content/home.ts` instead.
 */

export const heroBadge = {
  label: "New",
  text: "The 90-day home finance plan for UAE residents",
};

export const heroLocation = "Downtown Dubai · AED 3.2M";

export const heroPrequalified = {
  title: "You’re pre-qualified",
  text: "Example budget up to AED 3.4M",
};

export const heroPlan = {
  eyebrow: "Your 90-day plan",
  day: 12,
  totalDays: 90,
  steps: [
    { label: "Pre-qualified", done: true },
    { label: "Advisor consultation", done: true },
    { label: "Bank pre-approval", done: false },
  ],
};

export const heroAdvisors = {
  title: "Real advisors, not chatbots",
  text: "Message us on WhatsApp in English or Arabic",
  initials: ["SR", "MA", "JK"],
};

export interface EligibilityOption {
  label: string;
  value: string;
}

export interface EligibilityField {
  name: string;
  label: string;
  defaultValue: string;
  options: EligibilityOption[];
}

const aed = (value: number) => ({
  value: String(value),
  label: `AED ${value.toLocaleString("en-US")}`,
});

export const eligibility = {
  /** Where the form submits (GET). The calculator page isn't built yet. */
  action: "/calculator",
  submitLabel: "Check eligibility",
  fields: [
    {
      name: "price",
      label: "Property price",
      defaultValue: "3200000",
      options: [1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_200_000, 4_000_000, 5_000_000, 7_500_000, 10_000_000].map(aed),
    },
    {
      name: "income",
      label: "Monthly income",
      defaultValue: "45000",
      options: [15_000, 25_000, 35_000, 45_000, 60_000, 80_000, 100_000].map(aed),
    },
    {
      name: "funds",
      label: "Funds available",
      defaultValue: "900000",
      options: [250_000, 500_000, 750_000, 900_000, 1_200_000, 1_500_000, 2_000_000, 3_000_000].map(aed),
    },
    {
      name: "timeline",
      label: "Buying in",
      defaultValue: "30-60",
      options: [
        { value: "0-30", label: "Within 30 days" },
        { value: "30-60", label: "30–60 days" },
        { value: "60-90", label: "60–90 days" },
        { value: "exploring", label: "Just exploring" },
      ],
    },
  ] satisfies EligibilityField[],
};
