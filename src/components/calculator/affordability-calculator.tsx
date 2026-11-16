"use client";

import { useMemo, useState } from "react";

import { calculateCost, type CostInputs } from "@/lib/calculator/math";
import type { CalculatorSettings } from "@/lib/calculator/settings";
import { calculatorExtras } from "@/lib/content/calculator-extras";

import { CostInputsPanel, defaultCostInputs } from "./cost-inputs";
import { DebtCard } from "./debt-card";
import { RepaymentCard } from "./repayment-card";

const { labels } = calculatorExtras;

/** Query string that opens the calculator page with the same numbers. */
export function costQuery(inputs: CostInputs) {
  const params = new URLSearchParams({
    mode: "cost",
    type: inputs.type,
    price: String(inputs.price),
    down: String(Math.round(inputs.downPercent)),
    years: String(inputs.years),
    income: String(inputs.income),
    commitments: String(inputs.commitments),
  });
  return params.toString();
}

/**
 * Home page calculator: property type, price, deposit, term, income and
 * commitments, with the repayment and debt-to-income results beside them.
 * GSAP reveals the two columns (`data-stagger-item` wrappers); Motion animates
 * everything inside.
 */
export function AffordabilityCalculator({ settings }: { settings: CalculatorSettings }) {
  const [inputs, setInputs] = useState<CostInputs>(() => defaultCostInputs(settings));
  const result = useMemo(() => calculateCost(settings, inputs), [settings, inputs]);
  const update = (patch: Partial<CostInputs>) => setInputs((current) => ({ ...current, ...patch }));

  return (
    <div data-stagger className="grid items-start gap-4 lg:grid-cols-12 lg:gap-6">
      <div data-stagger-item className="min-w-0 lg:col-span-7">
        <CostInputsPanel
          idPrefix="home-calc"
          inputs={inputs}
          onChange={update}
          result={result}
          settings={settings}
        />
      </div>

      <div data-stagger-item className="min-w-0 space-y-4 lg:col-span-5">
        <RepaymentCard
          heading={labels.monthlyRepayment}
          headline={result.payment}
          headlineSuffix="/mo"
          principalShare={result.principalShare}
          rows={[
            { label: labels.loanAmount, value: result.loan, kind: "aed" },
            { label: labels.deposit, value: result.deposit, kind: "aed" },
            { label: labels.exampleRate, value: result.rate, kind: "percent2", suffix: "p.a." },
          ]}
          cta={{
            label: labels.exactFigures,
            href: `/calculator?${costQuery({ ...inputs, downPercent: result.downPercent })}`,
          }}
        />
        <DebtCard dbr={result.dbr} limit={settings.dbrLimit} status={result.status} />
      </div>
    </div>
  );
}
