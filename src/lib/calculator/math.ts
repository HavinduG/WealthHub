/**
 * Pure mortgage maths shared by every calculator on the site. No React here,
 * so it renders identically on the server and the client.
 */

import type { CalculatorSettings, Employment, PropertyType, Residency } from "./settings";

/** Off-plan purchases need at least this deposit (percent), whatever the residency. */
export const OFF_PLAN_MIN_DOWN = 50;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Standard amortising repayment per month. */
export function monthlyPayment(loan: number, annualRatePercent: number, years: number) {
  if (loan <= 0 || years <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) return loan / n;
  return (loan * r) / (1 - (1 + r) ** -n);
}

/** Largest loan a monthly repayment can support (inverse of `monthlyPayment`). */
export function loanForPayment(payment: number, annualRatePercent: number, years: number) {
  if (payment <= 0 || years <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) return payment * n;
  return (payment * (1 - (1 + r) ** -n)) / r;
}

/** Max loan-to-value (percent) for a price and residency. */
export function maxLtv(settings: CalculatorSettings, price: number, residency: Residency) {
  const band = settings.ltv[residency];
  return price <= settings.ltvThreshold ? band.low : band.high;
}

/** Minimum deposit (percent) the rules allow for this purchase. */
export function minDownPercent(
  settings: CalculatorSettings,
  price: number,
  residency: Residency,
  type: PropertyType,
) {
  const fromLtv = 100 - maxLtv(settings, price, residency);
  return type === "offPlan" ? Math.max(fromLtv, OFF_PLAN_MIN_DOWN) : fromLtv;
}

export type DebtStatus = "comfortable" | "workable" | "over";

export function debtStatus(dbr: number, limit: number): DebtStatus {
  if (dbr > limit) return "over";
  if (dbr > limit * 0.7) return "workable";
  return "comfortable";
}

// --- "How much does it cost?" ------------------------------------------------------

export interface CostInputs {
  price: number;
  downPercent: number;
  years: number;
  income: number;
  commitments: number;
  residency: Residency;
  employment: Employment;
  type: PropertyType;
}

export interface FeeLine {
  key: string;
  label: string;
  amount: number;
}

export interface CostResult {
  minDown: number;
  downPercent: number;
  deposit: number;
  loan: number;
  rate: number;
  payment: number;
  totalInterest: number;
  /** Share of all repayments that is principal, 0–1. */
  principalShare: number;
  /** All monthly debt repayments as a percent of income. */
  dbr: number;
  status: DebtStatus;
  fees: FeeLine[];
  totalFees: number;
  /** Deposit plus fees: what the buyer pays upfront. */
  cashNeeded: number;
}

export function calculateCost(settings: CalculatorSettings, input: CostInputs): CostResult {
  const { fees: f } = settings;
  const minDown = minDownPercent(settings, input.price, input.residency, input.type);
  const downPercent = clamp(input.downPercent, minDown, 100);
  const deposit = Math.round((input.price * downPercent) / 100);
  const loan = Math.max(0, input.price - deposit);
  const rate = settings.rates[input.employment];
  const payment = monthlyPayment(loan, rate, input.years);
  const totalPaid = payment * input.years * 12;
  const totalInterest = Math.max(0, totalPaid - loan);
  const dbr = input.income > 0 ? ((payment + input.commitments) / input.income) * 100 : 0;

  const vat = (amount: number) => amount * (1 + f.vatPercent / 100);
  const hasLoan = loan > 0;
  const fees: FeeLine[] = [
    {
      key: "dld",
      label: `DLD transfer fee (${f.dldPercent}%) + admin`,
      amount: (input.price * f.dldPercent) / 100 + f.dldAdminFee,
    },
    { key: "titleDeed", label: "Title deed", amount: f.titleDeedFee },
    {
      key: "trustee",
      label: "Registration trustee (incl. VAT)",
      amount: vat(input.price < f.trusteeThreshold ? f.trusteeFeeLow : f.trusteeFeeHigh),
    },
    {
      key: "agency",
      label: `Agency commission (${f.agencyPercent}% + VAT)`,
      amount: vat((input.price * f.agencyPercent) / 100),
    },
    ...(hasLoan
      ? [
          {
            key: "mortgageReg",
            label: `Mortgage registration (${f.mortgageRegPercent}% + AED ${f.mortgageRegFixed})`,
            amount: (loan * f.mortgageRegPercent) / 100 + f.mortgageRegFixed,
          },
          { key: "valuation", label: "Valuation (incl. VAT)", amount: vat(f.valuationFee) },
          {
            key: "arrangement",
            label: `Bank arrangement (${f.arrangementPercent}% + VAT)`,
            amount: vat((loan * f.arrangementPercent) / 100),
          },
        ]
      : []),
  ];
  const totalFees = fees.reduce((sum, line) => sum + line.amount, 0);

  return {
    minDown,
    downPercent,
    deposit,
    loan,
    rate,
    payment,
    totalInterest,
    principalShare: totalPaid > 0 ? loan / totalPaid : 1,
    dbr,
    status: debtStatus(dbr, settings.dbrLimit),
    fees,
    totalFees,
    cashNeeded: deposit + totalFees,
  };
}

// --- "How much can I borrow?" -------------------------------------------------------

export interface BorrowInputs {
  income: number;
  commitments: number;
  funds: number;
  years: number;
  residency: Residency;
  employment: Employment;
}

export interface BorrowResult {
  rate: number;
  /** Largest loan the income supports under the debt limit. */
  maxLoanByIncome: number;
  /** Highest price reachable with that loan and the funds available. */
  maxPrice: number;
  /** Loan actually needed for `maxPrice`. */
  loan: number;
  deposit: number;
  payment: number;
  /** What limits the budget: the income (debt limit) or the deposit (loan-to-value). */
  limitedBy: "income" | "deposit";
}

export function calculateBorrow(settings: CalculatorSettings, input: BorrowInputs): BorrowResult {
  const rate = settings.rates[input.employment];
  const maxPayment = Math.max(0, (input.income * settings.dbrLimit) / 100 - input.commitments);
  const maxLoanByIncome = loanForPayment(maxPayment, rate, input.years);
  const band = settings.ltv[input.residency];
  const funds = Math.max(0, input.funds);

  // Price is capped by loan + deposit, and by loan / max LTV. The LTV band
  // depends on the price itself, so try the lower-price band first.
  const capFor = (ltvPercent: number) =>
    Math.min(maxLoanByIncome + funds, maxLoanByIncome / (ltvPercent / 100));
  let maxPrice = capFor(band.low);
  if (maxPrice > settings.ltvThreshold) {
    maxPrice = Math.max(capFor(band.high), settings.ltvThreshold);
  }
  maxPrice = Math.max(0, Math.floor(maxPrice / 1000) * 1000);

  const ltv = maxPrice <= settings.ltvThreshold ? band.low : band.high;
  const loan = Math.min(maxLoanByIncome, (maxPrice * ltv) / 100);
  const deposit = Math.max(0, maxPrice - loan);

  return {
    rate,
    maxLoanByIncome,
    maxPrice,
    loan,
    deposit,
    payment: monthlyPayment(loan, rate, input.years),
    limitedBy: maxLoanByIncome + funds <= maxLoanByIncome / (ltv / 100) ? "deposit" : "income",
  };
}

// --- Formatting -----------------------------------------------------------------------

const aedFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatAed(value: number) {
  return `AED ${aedFormatter.format(Math.round(value))}`;
}

/** Short form for slider ends: AED 500K, AED 10M. */
export function formatAedShort(value: number) {
  if (value >= 1_000_000) return `AED ${+(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `AED ${+(value / 1_000).toFixed(0)}K`;
  return `AED ${value}`;
}
