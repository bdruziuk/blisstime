"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { CalendarDays, LayoutDashboard, LogOut, Menu, Scissors, Settings, ShieldCheck, Users, Wallet, X } from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Кабінет", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Записи", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Клієнти", icon: Users },
  { href: "/dashboard/services", label: "Послуги", icon: Scissors },
  { href: "/dashboard/income", label: "Доходи", icon: Wallet },
  { href: "/dashboard/settings", label: "Налаштування", icon: Settings },
];

export function SiteHeaderMobileMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? "Закрити меню" : "Відкрити меню"} aria-expanded={open} className="hover:bg-accent rounded-md p-2">
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <div className="border-border bg-card absolute inset-x-0 top-full border-b p-3 shadow-lg">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1">
            {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className="text-primary hover:bg-primary/10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"><ShieldCheck className="size-4" />Адмін</Link>}
            {LINKS.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"><link.icon className="size-4" />{link.label}</Link>)}
            <button type="button" onClick={() => void signOut({ redirectTo: "/login" })} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium"><LogOut className="size-4" />Вийти</button>
          </nav>
        </div>
      )}
    </div>
  );
}
