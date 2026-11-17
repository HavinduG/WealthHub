import { splitAccent } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * Text with an italic serif accent, as in the Figma headings
 * ("Latest from *our advisors.*"). Wrap the accent in asterisks.
 */
export function AccentTitle({
  text,
  accentWords = 2,
  accentClassName,
}: {
  text: string;
  accentWords?: number;
  accentClassName?: string;
}) {
  const { before, accent, after } = splitAccent(text, accentWords);
  return (
    <>
      {before}
      {accent && (
        <em
          className={cn(
            "font-serif text-[1.18em] leading-none font-normal tracking-[-0.01em] text-primary",
            accentClassName,
          )}
        >
          {accent}
        </em>
      )}
      {after}
    </>
  );
}
