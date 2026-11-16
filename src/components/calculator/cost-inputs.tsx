"use client";

import { formatAed, formatAedShort, type CostInputs, type CostResult } from "@/lib/calculator/math";
import type { CalculatorSettings } from "@/lib/calculator/settings";
import { calculatorExtras } from "@/lib/content/calculator-extras";
import { cn } from "@/lib/utils";

import { OptionTabs } from "./option-tabs";
import { RangeField } from "./range-field";

const { labels, ranges } = calculatorExtras;

/** Starting values for the "what does it cost" calculator. */
export function defaultCostInputs(settings: CalculatorSettings): CostInputs {
  return {
    type: "ready",
    price: ranges.price.default,
    downPercent: ranges.downPercent.default,
    years: settings.years.default,
    income: ranges.income.default,
    commitments: ranges.commitments.default,
    residency: "resident",
    employment: "employed",
  };
}

/** Down payment slider range: from the legal minimum up to a sensible maximum. */
export function downPercentRange(minDown: number) {
  return { min: minDown, max: Math.max(50, minDown + ranges.downPercent.span) };
}

/**
 * Inputs for the repayment calculator. `showProfile` adds residency and income
 * type (calculator page); the home section keeps the simpler set.
 */
export function CostInputsPanel({
  inputs,
  onChange,
  result,
  settings,
  idPrefix,
  showProfile = false,
  className,
}: {
  inputs: CostInputs;
  onChange: (patch: Partial<CostInputs>) => void;
  result: CostResult;
  settings: CalculatorSettings;
  /** Unique per calculator on the page (used for the sliding tab pills). */
  idPrefix: string;
  showProfile?: boolean;
  className?: string;
}) {
  const down = downPercentRange(result.minDown);

  return (
    <div
      className={cn(
        "rounded-[1.75rem] bg-card p-5 shadow-soft ring-1 ring-black/5 sm:p-7 lg:p-8",
        className,
      )}
    >
      <OptionTabs
        label={labels.propertyType}
        layoutId={`${idPrefix}-type`}
        value={inputs.type}
        onChange={(type) => onChange({ type })}
        options={calculatorExtras.propertyTypes}
      />

      {showProfile && (
        <div className="mt-4 flex flex-wrap gap-2">
          <OptionTabs
            label={labels.residency}
            layoutId={`${idPrefix}-residency`}
            value={inputs.residency}
            onChange={(residency) => onChange({ residency })}
            options={calculatorExtras.residencies}
          />
          <OptionTabs
            label={labels.employment}
            layoutId={`${idPrefix}-employment`}
            value={inputs.employment}
            onChange={(employment) => onChange({ employment })}
            options={calculatorExtras.employments}
          />
        </div>
      )}

      <div className="mt-7 space-y-7 sm:mt-8">
        <RangeField
          label={labels.price}
          value={inputs.price}
          {...ranges.price}
          onChange={(price) => onChange({ price })}
          display={formatAed(inputs.price)}
          minLabel={formatAedShort(ranges.price.min)}
          maxLabel={`${formatAedShort(ranges.price.max)}+`}
        />
        <RangeField
          label={labels.downPayment}
          value={result.downPercent}
          min={down.min}
          max={down.max}
          step={1}
          onChange={(downPercent) => onChange({ downPercent })}
          display={`${Math.round(result.downPercent)}% · ${formatAed(result.deposit)}`}
          minLabel={`${down.min}%`}
          maxLabel={`${down.max}%`}
        />
        <RangeField
          label={labels.term}
          value={inputs.years}
          min={settings.years.min}
          max={settings.years.max}
          step={1}
          onChange={(years) => onChange({ years })}
          display={`${inputs.years} years`}
          minLabel={`${settings.years.min} yrs`}
          maxLabel={`${settings.years.max} yrs`}
        />
        <RangeField
          label={labels.income}
          value={inputs.income}
          {...ranges.income}
          onChange={(income) => onChange({ income })}
          display={formatAed(inputs.income)}
          minLabel={formatAedShort(ranges.income.min)}
          maxLabel={`${formatAedShort(ranges.income.max)}+`}
        />
        <RangeField
          label={labels.commitments}
          value={inputs.commitments}
          {...ranges.commitments}
          onChange={(commitments) => onChange({ commitments })}
          display={formatAed(inputs.commitments)}
          minLabel="AED 0"
          maxLabel={formatAedShort(ranges.commitments.max)}
        />
      </div>
    </div>
  );
}
