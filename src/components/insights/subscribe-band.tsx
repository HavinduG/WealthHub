import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Magnetic } from "@/components/motion/magnetic";
import { insightsExtras } from "@/lib/content/insights-extras";
import { splitAccent } from "@/lib/text";

/** Figma "Subscribe band": dark emerald call to join Insider. */
export function SubscribeBand({ next = "/insights" }: { next?: string }) {
  const { subscribeBand } = insightsExtras;
  const title = splitAccent(subscribeBand.title);
  const query = `next=${encodeURIComponent(next)}`;

  return (
    <div
      data-fade
      className="relative isolate flex flex-col gap-10 overflow-hidden rounded-[2rem] bg-primary p-8 text-white sm:rounded-[2.75rem] sm:p-12 lg:flex-row lg:items-center lg:justify-between lg:p-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 -z-10 size-96 rounded-full"
        style={{ background: "radial-gradient(closest-side, oklch(0.76 0.085 75 / 0.25), transparent)" }}
      />
      <div className="flex max-w-[680px] flex-col gap-[18px]">
        <p className="text-xs leading-4 font-semibold tracking-[0.08em] text-gold uppercase">{subscribeBand.eyebrow}</p>
        <h2 className="text-[2rem] leading-[1.12] font-semibold tracking-[-0.03em] sm:text-[3.25rem] sm:leading-[3.625rem]">
          <span className="block">{title.before}</span>
          <em className="font-serif text-[1.15em] font-normal tracking-[-0.01em] text-gold-soft">{title.accent}</em>
        </h2>
        <p className="max-w-[520px] text-base leading-[1.625rem] text-white/75">{subscribeBand.text}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Magnetic>
          <Link
            href={`/register?plan=yearly&${query}`}
            className="group inline-flex items-center gap-2.5 rounded-full bg-gold py-4 pr-[22px] pl-[26px] text-[0.9375rem] leading-5 font-semibold text-foreground outline-none transition-colors hover:bg-[oklch(0.8_0.085_75)] focus-visible:ring-4 focus-visible:ring-gold/40"
          >
            {subscribeBand.primary}
            <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Magnetic>
        <Link
          href={`/login?${query}`}
          className="inline-flex items-center rounded-full bg-white px-[26px] py-4 text-[0.9375rem] leading-5 font-semibold text-primary outline-none transition-colors hover:bg-white/90 focus-visible:ring-4 focus-visible:ring-white/40"
        >
          {subscribeBand.secondary}
        </Link>
      </div>
    </div>
  );
}
