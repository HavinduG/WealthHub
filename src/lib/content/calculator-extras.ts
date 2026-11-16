/**
 * Calculator text and slider ranges that have NO ACF field in WordPress yet.
 * The rules (rates, limits, fees) all come from WordPress; this file is only
 * labels and ranges. Move items into ACF when ready.
 */

import type { Employment, PropertyType, Residency } from "@/lib/calculator/settings";

export const calculatorExtras = {
  /** Small label above the home page calculator title. */
  homeEyebrow: "Affordability calculator",
  /** Small label above the calculator page heading. */
  pageEyebrow: "Mortgage calculator",
  /** Calculator page <title> for search results. */
  pageTitle: "Mortgage calculator",

  propertyTypes: [
    { value: "ready", label: "Ready home" },
    { value: "offPlan", label: "Off-plan" },
    { value: "villa", label: "Villa" },
    { value: "apartment", label: "Apartment" },
  ] satisfies { value: PropertyType; label: string }[],

  residencies: [
    { value: "resident", label: "UAE resident" },
    { value: "national", label: "UAE national" },
    { value: "nonResident", label: "Non-resident" },
  ] satisfies { value: Residency; label: string }[],

  employments: [
    { value: "employed", label: "Salaried" },
    { value: "selfEmployed", label: "Self-employed" },
  ] satisfies { value: Employment; label: string }[],

  /** Slider ranges (AED) and starting values. */
  ranges: {
    price: { min: 500_000, max: 10_000_000, step: 50_000, default: 3_200_000 },
    downPercent: { default: 20, span: 30 },
    income: { min: 10_000, max: 200_000, step: 1_000, default: 45_000 },
    commitments: { min: 0, max: 30_000, step: 250, default: 6_500 },
    funds: { min: 0, max: 5_000_000, step: 25_000, default: 900_000 },
  },

  labels: {
    propertyType: "Property type",
    price: "Property price",
    downPayment: "Down payment",
    term: "Loan term",
    income: "Monthly income",
    commitments: "Monthly commitments",
    funds: "Funds available",
    residency: "Residency",
    employment: "Income type",
    monthlyRepayment: "Estimated monthly repayment",
    principal: "Principal",
    interest: "Interest",
    loanAmount: "Loan amount",
    deposit: "Deposit from your funds",
    exampleRate: "Example rate",
    exactFigures: "Get my exact figures",
    maxPrice: "You could buy a home up to",
    maxLoan: "Maximum loan",
    seeCosts: "See what this home costs",
    upfrontCosts: "Upfront costs",
    totalFees: "Total fees",
    cashNeeded: "Cash needed upfront",
    debtTitle: "Monthly debt vs income",
  },

  debtStatus: {
    comfortable: "Comfortable",
    workable: "Looks workable",
    over: "Over the limit",
  },

  /** Where CTAs go while their WordPress link fields are empty. */
  fallbackHrefs: {
    primary: "/#eligibility",
    secondary: "/#advisors",
  },
};
