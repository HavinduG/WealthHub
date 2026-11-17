import { Lock, LockOpen } from "lucide-react";

import { insightsExtras } from "@/lib/content/insights-extras";
import { cn } from "@/lib/utils";

export type BadgeAccess = "locked" | "unlocked" | "free";

/**
 * Figma "Access badge": locked = members-only and the viewer isn't a member,
 * unlocked = members-only and the viewer is a paying member, free = free read.
 */
export function AccessBadge({ access, className }: { access: BadgeAccess; className?: string }) {
  const { badge } = insightsExtras;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-[11px] py-1.5 text-xs leading-4 font-medium whitespace-nowrap shadow-[0_4px_6px_oklch(0.25_0.03_160/0.08)]",
        access === "free" ? "bg-gold-soft text-foreground" : "bg-card text-primary",
        className,
      )}
    >
      {access === "locked" && <Lock aria-hidden className="size-3" strokeWidth={2.25} />}
      {access === "unlocked" && <LockOpen aria-hidden className="size-3" strokeWidth={2.25} />}
      {access === "locked" ? badge.locked : access === "unlocked" ? badge.unlocked : badge.free}
    </span>
  );
}
