import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/dashboard", label: "Кабінет" },
  { href: "/dashboard/bookings", label: "Записи" },
  { href: "/dashboard/settings", label: "Налаштування" },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-border bg-card/60 border-b backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-heading text-xl font-semibold">
          BlissTime
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
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
              <button type="submit" className="text-muted-foreground hover:text-foreground">
                Вийти
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
