import Link from "next/link";
import { Sparkles, CalendarDays, Settings, LogOut, LayoutDashboard, Scissors, Users } from "lucide-react";
import { auth, signOut } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/dashboard", label: "Кабінет", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Записи", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Клієнти", icon: Users },
  { href: "/dashboard/services", label: "Послуги", icon: Scissors },
  { href: "/dashboard/settings", label: "Налаштування", icon: Settings },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-border bg-card/70 sticky top-0 z-10 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-heading flex items-center gap-1.5 text-lg font-bold">
          <Sparkles className="text-primary size-5" strokeWidth={2.25} />
          BlissTime
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
          {session?.user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium"
              >
                <LogOut className="size-4" />
                Вийти
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
