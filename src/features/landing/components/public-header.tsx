"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { VERTICALS } from "@/features/landing/verticals";
import { CitySelector } from "./city-selector";
import { slugify } from "@/lib/slugify";
import { canonicalCityName } from "@/features/business-import/services/city-normalizer";

export function PublicHeader({ user }: { user: { name: string | null; email: string | null } | null }) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const readCity = () => canonicalCityName(decodeURIComponent(document.cookie.split("; ").find((item) => item.startsWith("catalog_city="))?.split("=")[1] ?? ""), "UA");
    setSelectedCity(readCity());
    const update = (event: Event) => setSelectedCity((event as CustomEvent<string>).detail || readCity());
    window.addEventListener("catalog-city-change", update);
    return () => window.removeEventListener("catalog-city-change", update);
  }, []);

  const searchHref = (service = "all") => selectedCity
    ? selectedCity === "Київ"
      ? `/${slugify(selectedCity)}/all/${service}`
      : `/${slugify(selectedCity)}/${service}`
    : `/all/${service}`;

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    const href = searchHref();
    window.location.href = `${href}${href.includes("?") ? "&" : "?"}q=${encodeURIComponent(query)}`;
  }

  useEffect(() => {
    if (!servicesOpen) return;
    function onPointer(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [servicesOpen]);

  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="text-foreground md:hidden"
          aria-label="Меню"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
        <Link href="/">
          <Logo className="text-lg" />
        </Link>
        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <div ref={servicesRef} className="relative">
            <button
              type="button"
              onClick={() => setServicesOpen((o) => !o)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium"
            >
              Послуги
              <ChevronDown className={`size-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
            </button>
            {servicesOpen && (
              <div className="border-border bg-popover absolute left-0 mt-1 w-72 overflow-hidden rounded-xl border p-2 shadow-lg">
                {VERTICALS.map((v) => (
                  <Link
                    key={v.slug}
                    href={searchHref(v.slug)}
                    onClick={() => setServicesOpen(false)}
                    className="hover:bg-accent/60 block rounded-lg px-2.5 py-2"
                  >
                    <span className="block text-sm font-semibold">{v.name}</span>
                    <span className="text-muted-foreground block text-xs">{v.blurb}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={submitSearch} className="border-input bg-background flex h-10 w-[22rem] items-center overflow-visible rounded-md border shadow-xs xl:w-[27rem]">
            <div className="shrink-0"><Suspense fallback={<span className="text-muted-foreground px-2 text-xs">Місто…</span>}><CitySelector /></Suspense></div>
            <div className="relative min-w-0 flex-1 border-l">
              <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Салон або послуга" className="h-9 border-0 pr-9 text-sm shadow-none focus-visible:ring-0" aria-label="Пошук" />
              <button type="submit" aria-label="Знайти" className="text-muted-foreground hover:text-foreground absolute right-0 top-0 flex size-9 items-center justify-center"><Search className="size-4" /></button>
            </div>
          </form>
          <Link
            href="/register"
            className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium"
          >
            Для бізнесу
          </Link>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <span
            aria-hidden
            title="Незабаром: вибір мови"
            className="text-muted-foreground border-border rounded-md border px-2 py-1 text-xs font-medium"
          >
            УКР
          </span>
          {user ? <><Button render={<Link href="/dashboard" />} nativeButton={false} variant="ghost" size="sm" className="max-w-56"><UserRound /><span className="truncate">{user.name || user.email || "Кабінет"}</span></Button><Button type="button" variant="ghost" size="sm" onClick={() => void signOut({ redirectTo: "/" })}><LogOut />Вийти</Button></> : <><Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">Увійти</Button><Button render={<Link href="/register" />} nativeButton={false} size="sm" className="rounded-full">Почати безкоштовно</Button></>}
        </div>

      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-border bg-background border-t px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <form onSubmit={submitSearch} className="border-input mb-3 flex min-w-0 flex-col overflow-visible rounded-md border sm:flex-row sm:items-center">
              <div className="shrink-0 border-b sm:border-b-0 sm:border-r"><Suspense fallback={<span className="text-muted-foreground px-2 text-xs">Місто…</span>}><CitySelector /></Suspense></div>
              <div className="relative min-w-0 flex-1">
                <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Салон, майстер або послуга" className="border-0 pr-10 shadow-none focus-visible:ring-0" aria-label="Пошук" />
                <button type="submit" aria-label="Знайти" className="text-muted-foreground absolute right-0 top-0 flex size-9 items-center justify-center"><Search className="size-4" /></button>
              </div>
            </form>
            <p className="text-muted-foreground px-1 pt-1 text-xs font-semibold uppercase">Послуги</p>
            {VERTICALS.map((v) => (
              <Link
                key={v.slug}
                href={searchHref(v.slug)}
                onClick={() => setMobileOpen(false)}
                className="hover:bg-accent/60 rounded-lg px-2 py-2 text-sm"
              >
                {v.name}
              </Link>
            ))}
            <Link href="/register" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2 text-sm font-medium">
              Для бізнесу
            </Link>
            <div className="mt-2 flex gap-2">{user ? <><Button render={<Link href="/dashboard" onClick={() => setMobileOpen(false)} />} nativeButton={false} variant="outline" size="sm" className="flex-1"><UserRound />{user.name || user.email || "Кабінет"}</Button><Button type="button" variant="outline" size="sm" onClick={() => void signOut({ redirectTo: "/" })} aria-label="Вийти"><LogOut /></Button></> : <><Button render={<Link href="/login" />} nativeButton={false} variant="outline" size="sm" className="flex-1">Увійти</Button><Button render={<Link href="/register" />} nativeButton={false} size="sm" className="flex-1">Почати</Button></>}</div>
          </div>
        </div>
      )}
    </header>
  );
}
