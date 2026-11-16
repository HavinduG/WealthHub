"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Form from "next/form";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DURATION, EASE } from "@/lib/animation/tokens";
import { eligibility } from "@/lib/content/hero-extras";
import { cn } from "@/lib/utils";

/** Quick eligibility inputs. Submits as GET query params (?price=…&income=…). */
export function EligibilityBar({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.05, duration: DURATION.slow, ease: EASE.out }}
      id="eligibility"
      className={cn("scroll-mt-28", className)}
    >
      <Form
        action={eligibility.action}
        aria-label="Check your eligibility"
        className="grid grid-cols-2 gap-1.5 rounded-[1.75rem] bg-card/95 p-2 shadow-float ring-1 ring-black/5 backdrop-blur-md lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-center lg:gap-0 lg:rounded-full lg:p-2.5"
      >
        {eligibility.fields.map((field, index) => (
          <div
            key={field.name}
            className={cn(
              "relative min-w-0",
              index > 0 &&
                "lg:before:absolute lg:before:inset-y-2 lg:before:left-0 lg:before:w-px lg:before:bg-border",
            )}
          >
            <Select name={field.name} defaultValue={field.defaultValue} items={field.options}>
              <SelectTrigger className="h-auto w-full data-[size=default]:h-auto items-center rounded-2xl border-0 bg-muted/60 px-3.5 py-3 text-left hover:bg-muted focus-visible:ring-3 sm:px-4 lg:rounded-full lg:bg-transparent lg:px-6 lg:py-2.5 dark:bg-transparent">
                <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <span className="text-[0.7rem] font-normal text-muted-foreground sm:text-xs">
                    {field.label}
                  </span>
                  <SelectValue className="truncate text-sm font-semibold text-foreground sm:text-base" />
                </span>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="rounded-2xl p-1">
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="rounded-xl py-2">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <Button
          type="submit"
          className="group col-span-2 mt-1 h-13 gap-2 rounded-2xl px-7 text-[0.95rem] shadow-[0_10px_24px_-10px_oklch(0.33_0.058_166/0.7)] hover:bg-primary/90 lg:col-span-1 lg:mt-0 lg:ml-2 lg:h-12 lg:rounded-full"
        >
          {eligibility.submitLabel}
          <ArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-1" />
        </Button>
      </Form>
    </motion.div>
  );
}
