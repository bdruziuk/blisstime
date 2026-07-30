"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VERTICALS } from "@/features/landing/verticals";

export function PublicHeader() {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

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
        <Link href="/" className="font-heading flex items-center gap-1.5 text-lg font-bold">
          <Sparkles className="text-primary size-5" strokeWidth={2.25} />
          EasyService
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
                    href="/search"
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
          <Link
            href="/search"
            className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium"
          >
            Знайти майстра
          </Link>
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
          <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">
            Увійти
          </Button>
          <Button
            render={<Link href="/register" />}
            nativeButton={false}
            size="sm"
            className="rounded-full"
          >
            Почати безкоштовно
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="text-foreground md:hidden"
          aria-label="Меню"
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-border bg-background border-t px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground px-1 pt-1 text-xs font-semibold uppercase">Послуги</p>
            {VERTICALS.map((v) => (
              <Link
                key={v.slug}
                href="/search"
                onClick={() => setMobileOpen(false)}
                className="hover:bg-accent/60 rounded-lg px-2 py-2 text-sm"
              >
                {v.name}
              </Link>
            ))}
            <Link href="/search" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2 text-sm font-medium">
              Знайти майстра
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2 text-sm font-medium">
              Для бізнесу
            </Link>
            <div className="mt-2 flex gap-2">
              <Button render={<Link href="/login" />} nativeButton={false} variant="outline" size="sm" className="flex-1">
                Увійти
              </Button>
              <Button render={<Link href="/register" />} nativeButton={false} size="sm" className="flex-1">
                Почати
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
