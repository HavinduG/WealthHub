"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DURATION, EASE } from "@/lib/animation/tokens";
import {
  calculateBorrow,
  calculateCost,
  clamp,
  formatAed,
  formatAedShort,
  type BorrowInputs,
  type CostInputs,
} from "@/lib/calculator/math";
import type { CalculatorSettings, Employment, PropertyType, Residency } from "@/lib/calculator/settings";
import { calculatorExtras } from "@/lib/content/calculator-extras";
import type { CalculatorPageContent } from "@/lib/content/calculator";
import { cn } from "@/lib/utils";

import { CostInputsPanel, defaultCostInputs } from "./cost-inputs";
import { CostsCard } from "./costs-card";
import { DebtCard } from "./debt-card";
import { OptionTabs } from "./option-tabs";
import { RangeField } from "./range-field";
import { RepaymentCard } from "./repayment-card";

type Mode = "borrow" | "cost";
const { labels, ranges } = calculatorExtras;

const PROPERTY_TYPES = calculatorExtras.propertyTypes.map((option) => option.value);
const RESIDENCIES = calculatorExtras.residencies.map((option) => option.value);
const EMPLOYMENTS = calculatorExtras.employments.map((option) => option.value);

function pick<T extends string>(value: string | null, allowed: T[]): T | undefined {
  return allowed.find((item) => item === value);
}

function numberParam(params: URLSearchParams, key: string, min: number, max: number) {
  const value = Number(params.get(key));
  return params.has(key) && Number.isFinite(value) ? clamp(value, min, max) : undefined;
}

/**
 * Reads values passed in the URL: from the home calculator ("Get my exact
 * figures") or the hero eligibility bar (price, income, funds).
 */
function readUrl(settings: CalculatorSettings) {
  const params = new URLSearchParams(window.location.search);
  const price = numberParam(params, "price", ranges.price.min, ranges.price.max);
  const funds = numberParam(params, "funds", 0, ranges.funds.max);
  const down =
    numberParam(params, "down", 0, 100) ?? (funds !== undefined && price ? (funds / price) * 100 : undefined);

  const cost: Partial<CostInputs> = {
    type: pick<PropertyType>(params.get("type"), PROPERTY_TYPES),
    price,
    downPercent: down,
    years: numberParam(params, "years", settings.years.min, settings.years.max),
    income: numberParam(params, "income", ranges.income.min, ranges.income.max),
    commitments: numberParam(params, "commitments", 0, ranges.commitments.max),
    residency: pick<Residency>(params.get("residency"), RESIDENCIES),
    employment: pick<Employment>(params.get("employment"), EMPLOYMENTS),
  };
  const borrow: Partial<BorrowInputs> = {
    income: cost.income,
    commitments: cost.commitments,
    funds,
    years: cost.years,
    residency: cost.residency,
    employment: cost.employment,
  };
  const mode = pick<Mode>(params.get("mode"), ["borrow", "cost"]) ?? (price !== undefined ? "cost" : undefined);
  return { mode, cost: withoutUndefined(cost), borrow: withoutUndefined(borrow) };
}

function withoutUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function CalculatorApp({
  content,
  settings,
}: {
  content: CalculatorPageContent;
  settings: CalculatorSettings;
}) {
  const [mode, setMode] = useState<Mode>("borrow");
  const [cost, setCost] = useState<CostInputs>(() => defaultCostInputs(settings));
  const [borrow, setBorrow] = useState<BorrowInputs>(() => ({
    income: ranges.income.default,
    commitments: ranges.commitments.default,
    funds: ranges.funds.default,
    years: settings.years.default,
    residency: "resident",
    employment: "employed",
  }));

  // Prefill from the URL once on load. The page itself stays static (no
  // searchParams on the server), so it is prerendered and fast.
  useEffect(() => {
    const fromUrl = readUrl(settings);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL after hydration */
    if (fromUrl.mode) setMode(fromUrl.mode);
    setCost((current) => ({ ...current, ...fromUrl.cost }));
    setBorrow((current) => ({ ...current, ...fromUrl.borrow }));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [settings]);

  const costResult = useMemo(() => calculateCost(settings, cost), [settings, cost]);
  const borrowResult = useMemo(() => calculateBorrow(settings, borrow), [settings, borrow]);

  /** Opens the cost view for the home the borrowing result can afford. */
  function showCostsForBudget() {
    const price = clamp(borrowResult.maxPrice, ranges.price.min, ranges.price.max);
    setCost((current) => ({
      ...current,
      price,
      downPercent: price > 0 ? (borrowResult.deposit / price) * 100 : current.downPercent,
      income: borrow.income,
      commitments: borrow.commitments,
      years: borrow.years,
      residency: borrow.residency,
      employment: borrow.employment,
    }));
    setMode("cost");
    document.getElementById("calculator-app")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const ctas = [content.primaryCta, content.secondaryCta].filter(Boolean) as { label: string; href: string }[];

  return (
    <Tabs id="calculator-app" value={mode} onValueChange={(next) => setMode(next as Mode)} className="scroll-mt-28 gap-0">
      <div className="flex justify-center">
        <OptionTabs
          label="Calculator"
          layoutId="calc-page-mode"
          size="lg"
          value={mode}
          onChange={setMode}
          options={[
            { value: "borrow", label: content.tabs.borrow },
            { value: "cost", label: content.tabs.cost },
          ]}
        />
      </div>

      <TabsContent value="borrow" className="mt-8 sm:mt-10">
        <PanelEnter>
          <div className="grid items-start gap-4 lg:grid-cols-12 lg:gap-6">
            <div className="min-w-0 lg:col-span-7">
              <div className="rounded-[1.75rem] bg-card p-5 shadow-soft ring-1 ring-black/5 sm:p-7 lg:p-8">
                <div className="flex flex-wrap gap-2">
                  <OptionTabs
                    label={labels.residency}
                    layoutId="borrow-residency"
                    value={borrow.residency}
                    onChange={(residency) => setBorrow((c) => ({ ...c, residency }))}
                    options={calculatorExtras.residencies}
                  />
                  <OptionTabs
                    label={labels.employment}
                    layoutId="borrow-employment"
                    value={borrow.employment}
                    onChange={(employment) => setBorrow((c) => ({ ...c, employment }))}
                    options={calculatorExtras.employments}
                  />
                </div>

                <div className="mt-8 space-y-7">
                  <RangeField
                    label={labels.income}
                    value={borrow.income}
                    {...ranges.income}
                    onChange={(income) => setBorrow((c) => ({ ...c, income }))}
                    display={formatAed(borrow.income)}
                    minLabel={formatAedShort(ranges.income.min)}
                    maxLabel={`${formatAedShort(ranges.income.max)}+`}
                  />
                  <RangeField
                    label={labels.commitments}
                    value={borrow.commitments}
                    {...ranges.commitments}
                    onChange={(commitments) => setBorrow((c) => ({ ...c, commitments }))}
                    display={formatAed(borrow.commitments)}
                    minLabel="AED 0"
                    maxLabel={formatAedShort(ranges.commitments.max)}
                  />
                  <RangeField
                    label={labels.funds}
                    value={borrow.funds}
                    {...ranges.funds}
                    onChange={(funds) => setBorrow((c) => ({ ...c, funds }))}
                    display={formatAed(borrow.funds)}
                    minLabel="AED 0"
                    maxLabel={`${formatAedShort(ranges.funds.max)}+`}
                  />
                  <RangeField
                    label={labels.term}
                    value={borrow.years}
                    min={settings.years.min}
                    max={settings.years.max}
                    step={1}
                    onChange={(years) => setBorrow((c) => ({ ...c, years }))}
                    display={`${borrow.years} years`}
                    minLabel={`${settings.years.min} yrs`}
                    maxLabel={`${settings.years.max} yrs`}
                  />
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-4 lg:sticky lg:top-28 lg:col-span-5">
              <p className="px-1 text-lg font-semibold tracking-tight">{content.resultHeadings.borrow}</p>
              <RepaymentCard
                heading={labels.maxPrice}
                headline={borrowResult.maxPrice}
                rows={[
                  { label: labels.maxLoan, value: borrowResult.loan, kind: "aed" },
                  { label: labels.deposit, value: borrowResult.deposit, kind: "aed" },
                  { label: labels.monthlyRepayment, value: borrowResult.payment, kind: "aed" },
                  { label: labels.exampleRate, value: borrowResult.rate, kind: "percent2", suffix: "p.a." },
                ]}
                footnote={
                  borrowResult.maxPrice <= 0
                    ? `Your commitments already use the ${settings.dbrLimit}% of income lenders allow for debt.`
                    : borrowResult.limitedBy === "deposit"
                      ? "Your deposit sets this budget: more funds would raise it."
                      : `Your income sets this budget: repayments stay within ${settings.dbrLimit}% of income.`
                }
              />
              {borrowResult.maxPrice > 0 && (
                <button
                  type="button"
                  onClick={showCostsForBudget}
                  className="group flex w-full items-center justify-between gap-3 rounded-[1.5rem] bg-[oklch(0.95_0.035_80)] px-5 py-4 text-left text-sm font-semibold transition-colors hover:bg-[oklch(0.93_0.04_80)]"
                >
                  {labels.seeCosts}
                  <ArrowRight className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </button>
              )}
              <CtaRow ctas={ctas} />
            </div>
          </div>
        </PanelEnter>
      </TabsContent>

      <TabsContent value="cost" className="mt-8 sm:mt-10">
        <PanelEnter>
          <div className="grid items-start gap-4 lg:grid-cols-12 lg:gap-6">
            <div className="min-w-0 lg:col-span-7">
              <CostInputsPanel
                idPrefix="page-calc"
                showProfile
                inputs={cost}
                onChange={(patch) => setCost((current) => ({ ...current, ...patch }))}
                result={costResult}
                settings={settings}
              />
            </div>

            <div className="min-w-0 space-y-4 lg:col-span-5">
              <p className="px-1 text-lg font-semibold tracking-tight">{content.resultHeadings.cost}</p>
              <RepaymentCard
                heading={labels.monthlyRepayment}
                headline={costResult.payment}
                headlineSuffix="/mo"
                principalShare={costResult.principalShare}
                rows={[
                  { label: labels.loanAmount, value: costResult.loan, kind: "aed" },
                  { label: labels.deposit, value: costResult.deposit, kind: "aed" },
                  { label: labels.exampleRate, value: costResult.rate, kind: "percent2", suffix: "p.a." },
                ]}
              />
              <DebtCard dbr={costResult.dbr} limit={settings.dbrLimit} status={costResult.status} />
              <CostsCard
                fees={costResult.fees}
                totalFees={costResult.totalFees}
                deposit={costResult.deposit}
                cashNeeded={costResult.cashNeeded}
              />
              <CtaRow ctas={ctas} />
            </div>
          </div>
        </PanelEnter>
      </TabsContent>
    </Tabs>
  );
}

/** Fades and lifts a tab's content in when it becomes active (Motion). */
function PanelEnter({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
}

function CtaRow({ ctas }: { ctas: { label: string; href: string }[] }) {
  if (ctas.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {ctas.map((cta, index) => (
        <Link
          key={cta.label}
          href={cta.href}
          className={cn(
            index === 0
              ? cn(buttonVariants(), "group h-11 flex-1 gap-2 rounded-full px-5 text-sm hover:bg-primary/90")
              : cn(buttonVariants({ variant: "outline" }), "h-11 flex-1 rounded-full bg-card px-5 text-sm"),
          )}
        >
          {cta.label}
          {index === 0 && (
            <ArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-1" />
          )}
        </Link>
      ))}
    </div>
  );
}
