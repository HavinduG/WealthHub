import { LogOut } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentMember } from "@/lib/auth/dal";
import { cn } from "@/lib/utils";

const linkClass = cn(
  buttonVariants({ variant: "ghost" }),
  "h-10 rounded-full px-4 text-sm text-foreground/80 hover:bg-secondary",
);

/** Logged-out state; also the Suspense fallback while the session is read. */
export function LoginLink({ label = "Log in" }: { label?: string }) {
  return (
    <Link href="/login" className={linkClass}>
      {label}
    </Link>
  );
}

function initialsOf(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "WH";
}

/** Reads the session (request time), so it must be rendered inside <Suspense>. */
export async function AccountMenu({ loginLabel }: { loginLabel?: string }) {
  const member = await getCurrentMember();
  if (!member) return <LoginLink label={loginLabel} />;

  const active = member.membership.active;
  const firstName = (member.name.trim() || member.email.split("@")[0]).split(/\s+/)[0];
  return (
    <div className="flex items-center gap-1">
      <div title={member.name || member.email} className="flex items-center gap-2.5 pr-1">
        <span
          aria-hidden
          className="relative grid size-9 shrink-0 place-items-center rounded-full bg-emerald-2 text-xs font-semibold tracking-wide text-white shadow-sm ring-2 ring-white"
        >
          {initialsOf(member.name, member.email)}
          {active && (
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-gold" />
          )}
        </span>
        <span className="hidden flex-col leading-tight xl:flex">
          <span className="max-w-32 truncate text-sm font-semibold text-foreground">{firstName}</span>
          <span className={cn("text-[0.6875rem] font-medium", active ? "text-primary" : "text-muted-foreground")}>
            {active ? "Insider member" : "Free account"}
          </span>
        </span>
        <span className="sr-only">
          Logged in as {member.name || member.email}
          {active ? ", Insider member" : ", free account"}
        </span>
      </div>
      <form action={logoutAction}>
        {/* Icon button: the centred nav leaves no room for a label beside the name. */}
        <button type="submit" title="Log out" className={cn(linkClass, "size-10 px-0")}>
          <LogOut aria-hidden className="size-4" />
          <span className="sr-only">Log out</span>
        </button>
      </form>
    </div>
  );
}
