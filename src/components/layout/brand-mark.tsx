import Image from "next/image";

import type { SiteImage } from "@/lib/content/home";
import { cn } from "@/lib/utils";

/** Logo from WordPress (`header_image`), or the default emerald-and-gold mark. */
export function BrandMark({ logo, className }: { logo: SiteImage | null; className?: string }) {
  if (logo) {
    return (
      <Image
        src={logo.src}
        alt=""
        width={logo.width}
        height={logo.height}
        className={cn("size-9 rounded-xl object-contain", className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-primary shadow-[inset_0_1px_0_oklch(1_0_0/0.12)]",
        className,
      )}
    >
      <span className="size-3 rotate-45 rounded-[3px] border-2 border-gold" />
    </span>
  );
}
