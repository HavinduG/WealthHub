"use client";

import { motion } from "motion/react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SPRING } from "@/lib/animation/tokens";
import { cn } from "@/lib/utils";

/**
 * Segmented control built on shadcn Tabs. The white pill slides between
 * options with a Motion shared-layout animation (transform only).
 * `layoutId` must be unique per control on the page.
 */
export function OptionTabs<T extends string>({
  value,
  onChange,
  options,
  layoutId,
  label,
  size = "default",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  layoutId: string;
  label: string;
  size?: "default" | "lg";
  className?: string;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as T)} className={className}>
      <TabsList
        aria-label={label}
        className={cn(
          "h-auto w-full max-w-full justify-start gap-0.5 overflow-x-auto rounded-full bg-muted p-1 [scrollbar-width:none] sm:w-fit",
          size === "lg" && "p-1.5",
        )}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className={cn(
                "relative isolate h-auto flex-none rounded-full border-0 px-3.5 py-2 text-[0.8rem] text-foreground/60 data-active:bg-transparent data-active:text-foreground data-active:shadow-none sm:px-4 sm:text-sm",
                size === "lg" && "px-4 py-2.5 sm:px-6 sm:text-[0.95rem]",
              )}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  transition={SPRING.snappy}
                  className="absolute inset-0 -z-10 rounded-full bg-card shadow-soft ring-1 ring-black/5"
                />
              )}
              {option.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
