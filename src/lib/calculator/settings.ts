/**
 * Calculator rules, all editable in WordPress on the "Calculator page"
 * (slug `calculator-page`). ACF returns every number as a string; they are
 * parsed here with safe defaults so the calculator always works.
 */

export type Residency = "national" | "resident" | "nonResident";
export type Employment = "employed" | "selfEmployed";
export type PropertyType = "ready" | "offPlan" | "villa" | "apartment";

export interface CalculatorSettings {
  /** Annual interest rate, percent. */
  rates: Record<Employment, number>;
  /** Max share of monthly income for all debt repayments, percent. */
  dbrLimit: number;
  years: { min: number; max: number; default: number };
  /** Price at which the lower loan-to-value band applies, AED. */
  ltvThreshold: number;
  /** Max loan-to-value, percent, at or below / above the threshold. */
  ltv: Record<Residency, { low: number; high: number }>;
  fees: {
    dldPercent: number;
    dldAdminFee: number;
    titleDeedFee: number;
    trusteeFeeLow: number;
    trusteeFeeHigh: number;
    trusteeThreshold: number;
    mortgageRegPercent: number;
    mortgageRegFixed: number;
    valuationFee: number;
    arrangementPercent: number;
    agencyPercent: number;
    vatPercent: number;
  };
}

/** Raw ACF fields on the WordPress "Calculator page". */
export interface CalculatorAcf {
  [key: string]: unknown;
  calc_heading?: string;
  tab_borrow_label?: string;
  tab_cost_label?: string;
  result_borrow_heading?: string;
  result_cost_heading?: string;
  cta_primary_label?: string;
  cta_primary_link?: string;
  cta_secondary_label?: string;
  cta_secondary_link?: string;
  disclaimer?: string;
  rate_employed?: string;
  rate_self_employed?: string;
  dbr_limit?: string;
  min_years?: string;
  max_years?: string;
  default_years?: string;
  ltv_threshold?: string;
  ltv_national_low?: string;
  ltv_national_high?: string;
  ltv_resident_low?: string;
  ltv_resident_high?: string;
  ltv_non_resident_low?: string;
  ltv_non_resident_high?: string;
  dld_percent?: string;
  dld_admin_fee?: string;
  title_deed_fee?: string;
  trustee_fee_low?: string;
  trustee_fee_high?: string;
  trustee_threshold?: string;
  mortgage_reg_percent?: string;
  mortgage_reg_fixed?: string;
  valuation_fee?: string;
  arrangement_percent?: string;
  agency_percent?: string;
  vat_percent?: string;
}

function num(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Turns the raw ACF strings into numbers, falling back to current UAE norms. */
export function toCalculatorSettings(acf: CalculatorAcf | null | undefined): CalculatorSettings {
  const a = acf ?? {};
  const minYears = num(a.min_years, 5);
  const maxYears = Math.max(minYears + 1, num(a.max_years, 25));

  return {
    rates: {
      employed: num(a.rate_employed, 4.65),
      selfEmployed: num(a.rate_self_employed, 4.9),
    },
    dbrLimit: num(a.dbr_limit, 50),
    years: {
      min: minYears,
      max: maxYears,
      default: Math.min(maxYears, Math.max(minYears, num(a.default_years, maxYears))),
    },
    ltvThreshold: num(a.ltv_threshold, 5_000_000),
    ltv: {
      national: { low: num(a.ltv_national_low, 85), high: num(a.ltv_national_high, 75) },
      resident: { low: num(a.ltv_resident_low, 80), high: num(a.ltv_resident_high, 70) },
      nonResident: { low: num(a.ltv_non_resident_low, 50), high: num(a.ltv_non_resident_high, 50) },
    },
    fees: {
      dldPercent: num(a.dld_percent, 4),
      dldAdminFee: num(a.dld_admin_fee, 580),
      titleDeedFee: num(a.title_deed_fee, 250),
      trusteeFeeLow: num(a.trustee_fee_low, 2000),
      trusteeFeeHigh: num(a.trustee_fee_high, 4000),
      trusteeThreshold: num(a.trustee_threshold, 500_000),
      mortgageRegPercent: num(a.mortgage_reg_percent, 0.25),
      mortgageRegFixed: num(a.mortgage_reg_fixed, 290),
      valuationFee: num(a.valuation_fee, 3000),
      arrangementPercent: num(a.arrangement_percent, 1),
      agencyPercent: num(a.agency_percent, 2),
      vatPercent: num(a.vat_percent, 5),
    },
  };
}
