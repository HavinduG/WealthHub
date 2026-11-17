import { insightsExtras } from "@/lib/content/insights-extras";
import { cn } from "@/lib/utils";

/** "MARKET NEWS · 10 min read" */
export function CategoryMeta({
  category,
  readTime,
  className,
}: {
  category: string;
  readTime: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs leading-4 whitespace-nowrap", className)}>
      <span className="font-semibold tracking-[0.08em] text-primary uppercase">{category}</span>
      {readTime && (
        <>
          <span aria-hidden className="font-medium text-muted-foreground">
            ·
          </span>
          <span className="font-medium text-muted-foreground">{readTime}</span>
        </>
      )}
    </span>
  );
}

/** Avatar + author + date. There is no author field in WordPress yet, so the team is credited. */
export function AuthorRow({
  date,
  size = "sm",
  className,
}: {
  date: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { author } = insightsExtras;
  const avatar = { sm: "size-7", md: "size-10", lg: "size-11" }[size];

  if (size === "sm") {
    return (
      <span className={cn("flex items-center gap-2.5 text-xs leading-4 font-medium", className)}>
        <span
          aria-hidden
          className={cn("grid shrink-0 place-items-center rounded-full bg-emerald-2 text-[0.7rem] text-white", avatar)}
        >
          {author.initials}
        </span>
        <span className="text-foreground">{author.name}</span>
        {date && (
          <>
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
            <span className="text-muted-foreground">{date}</span>
          </>
        )}
      </span>
    );
  }

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden
        className={cn("grid shrink-0 place-items-center rounded-full bg-emerald-2 text-xs font-medium text-white", avatar)}
      >
        {author.initials}
      </span>
      <span className="flex flex-col gap-0.5 text-left">
        <span className="text-[1.0625rem] leading-6 font-semibold tracking-[-0.005em] text-foreground">
          {author.name}
        </span>
        <span className="text-xs leading-4 font-medium text-muted-foreground">
          {author.role}
          {date && ` · ${date}`}
        </span>
      </span>
    </span>
  );
}
