"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type StripItem = {
  key: string;
  href: string;
  selected: boolean;
  /** Extra emphasis (e.g. "this is today/this week/this month") when not selected. */
  emphasized?: boolean;
  top: string;
  main: string;
  bottom: string;
};

/**
 * Shared horizontal chip strip used by the day/week/month carousels on the
 * bookings dashboard: scrollable, arrow controls, auto-centers the selected
 * chip. Centering uses an instant jump — the strip sets scroll-behavior:
 * smooth for the arrow buttons, which would otherwise animate this on every
 * navigation.
 */
export function DateStripCarousel({
  items,
  scrollStep = 240,
  prevLabel = "Попередні",
  nextLabel = "Наступні",
  chipWidthClass = "w-16",
}: {
  items: StripItem[];
  scrollStep?: number;
  prevLabel?: string;
  nextLabel?: string;
  chipWidthClass?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedKey = items.find((it) => it.selected)?.key;

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!scroller || !active) return;
    const sRect = scroller.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    const left = scroller.scrollLeft + aRect.left - sRect.left - (sRect.width - aRect.width) / 2;
    scroller.scrollTo({ left, behavior: "instant" });
  }, [selectedKey]);

  function scrollBy(direction: -1 | 1) {
    scrollerRef.current?.scrollBy({ left: direction * scrollStep, behavior: "smooth" });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label={prevLabel}
        className="border-border text-muted-foreground hover:border-primary hover:text-primary hidden size-8 shrink-0 items-center justify-center rounded-full border sm:flex"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div
        ref={scrollerRef}
        className="flex flex-1 gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it) => (
          <Link
            key={it.key}
            href={it.href}
            aria-current={it.selected ? "true" : undefined}
            className={`flex ${chipWidthClass} shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2 transition-all ${
              it.selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : it.emphasized
                  ? "border-primary/40 hover:bg-accent/40"
                  : "border-border hover:border-primary/40 hover:bg-accent/40"
            }`}
          >
            <span className="w-full truncate text-center text-[0.65rem] uppercase opacity-75">
              {it.top}
            </span>
            <span className="font-heading text-lg leading-none font-bold">{it.main}</span>
            <span className="w-full truncate text-center text-[0.65rem] opacity-75">
              {it.bottom || " "}
            </span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label={nextLabel}
        className="border-border text-muted-foreground hover:border-primary hover:text-primary hidden size-8 shrink-0 items-center justify-center rounded-full border sm:flex"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
