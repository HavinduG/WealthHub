"use client";

import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const inputClass =
  "h-auto rounded-[14px] border-border bg-card px-[18px] py-4 text-base leading-[1.625rem] font-semibold placeholder:font-normal placeholder:text-muted-foreground/70 aria-invalid:border-destructive";

/** Figma "Field": small label above a tall rounded input, with an inline error. */
export function FormField({
  label,
  error,
  hint,
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input"> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={id} className="text-xs leading-4 font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputClass, isPassword && "pr-20")}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-pressed={visible}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-2 my-auto h-9 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {visible ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs leading-4 font-medium text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs leading-4 font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
