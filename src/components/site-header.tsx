import Link from "next/link";
import {
  CalendarDays,
  Settings,
  LogOut,
  LayoutDashboard,
  Scissors,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { Logo } from "@/components/logo";
import { SiteHeaderMobileMenu } from "@/components/site-header-mobile-menu";

const NAV_LINKS = [
  { href: "/dashboard", label: "Кабінет", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Записи", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Клієнти", icon: Users },
  { href: "/dashboard/services", label: "Послуги", icon: Scissors },
  { href: "/dashboard/income", label: "Доходи", icon: Wallet },
  { href: "/dashboard/settings", label: "Налаштування", icon: Settings },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-border bg-card/70 sticky top-0 z-10 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/dashboard">
          <Logo className="text-lg" />
        </Link>
        <nav className="hidden items-center gap-0.5 text-sm md:flex">
          {isSuperAdminEmail(session?.user?.email) && (
            <Link
              href="/admin"
              aria-label="Адмін"
              title="Адмін"
              className="text-primary hover:bg-primary/10 flex items-center gap-1.5 rounded-md p-2 font-medium xl:px-3"
            >
              <ShieldCheck className="size-4" />
              <span className="hidden xl:inline">Адмін</span>
            </Link>
          )}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              title={link.label}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-1.5 rounded-md p-2 font-medium xl:px-3"
            >
              <link.icon className="size-4" />
              <span className="hidden xl:inline">{link.label}</span>
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
                aria-label="Вийти"
                title="Вийти"
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-1.5 rounded-md p-2 font-medium xl:px-3"
              >
                <LogOut className="size-4" />
                <span className="hidden xl:inline">Вийти</span>
              </button>
            </form>
          )}
        </nav>
        {session?.user && <SiteHeaderMobileMenu isAdmin={isSuperAdminEmail(session.user.email)} />}
      </div>
    </header>
  );
}
