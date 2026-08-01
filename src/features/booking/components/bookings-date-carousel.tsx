"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BUSINESS_TIMEZONE } from "@/features/booking/slots";

// A window around today, so the master can look back at past days too.
const DAYS_BEFORE = 7;
const DAYS_AFTER = 30;

const WEEKDAY_FMT = new Intl.DateTimeFormat("uk-UA", {
  weekday: "short",
  timeZone: BUSINESS_TIMEZONE,
});
const MONTH_FMT = new Intl.DateTimeFormat("uk-UA", {
  month: "short",
  timeZone: BUSINESS_TIMEZONE,
});
const DAY_KEY_FMT = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE });

function buildDays() {
  const out: { iso: string; day: string; weekday: string; month: string }[] = [];
  const base = new Date();
  for (let offset = -DAYS_BEFORE; offset <= DAYS_AFTER; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    out.push({
      iso: DAY_KEY_FMT.format(d),
      day: String(d.getDate()),
      weekday: WEEKDAY_FMT.format(d).replace(".", ""),
      month: MONTH_FMT.format(d).replace(".", ""),
    });
  }
  return out;
}

/** Horizontal day strip for the dashboard day view; each day is a link. */
export function BookingsDateCarousel({
  dateISO,
  todayISO,
}: {
  dateISO: string;
  todayISO: string;
}) {
  const days = useMemo(buildDays, []);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Centre the active day (the strip starts a week in the past, so without this
  // the selected date can sit off-screen). Measured from rects rather than a
  // ref on <Link>, which doesn't reliably hand back the anchor element.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector<HTMLElement>('[aria-current="date"]');
    if (!scroller || !active) return;
    const sRect = scroller.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    const left =
      scroller.scrollLeft + aRect.left - sRect.left - (sRect.width - aRect.width) / 2;
    // "instant" so the strip is already centred on paint — the element sets
    // scroll-behavior: smooth for the arrow buttons, which would otherwise
    // animate this on every load.
    scroller.scrollTo({ left, behavior: "instant" });
  }, [dateISO]);

  function scrollBy(direction: -1 | 1) {
    scrollerRef.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Попередні дати"
        className="border-border text-muted-foreground hover:border-primary hover:text-primary hidden size-8 shrink-0 items-center justify-center rounded-full border sm:flex"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div
        ref={scrollerRef}
        className="flex flex-1 gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((d) => {
          const selected = d.iso === dateISO;
          const isToday = d.iso === todayISO;
          return (
            <Link
              key={d.iso}
              href={`/dashboard/bookings?view=day&date=${d.iso}`}
              aria-current={selected ? "date" : undefined}
              className={`flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2 transition-all ${
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : isToday
                    ? "border-primary/40 hover:bg-accent/40"
                    : "border-border hover:border-primary/40 hover:bg-accent/40"
              }`}
            >
              <span className="text-[0.65rem] uppercase opacity-75">{d.weekday}</span>
              <span className="font-heading text-lg leading-none font-bold">{d.day}</span>
              <span className="text-[0.65rem] opacity-75">{isToday ? "сьогодні" : d.month}</span>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Наступні дати"
        className="border-border text-muted-foreground hover:border-primary hover:text-primary hidden size-8 shrink-0 items-center justify-center rounded-full border sm:flex"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
