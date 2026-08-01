import { BUSINESS_TIMEZONE } from "@/features/booking/slots";
import { DateStripCarousel, type StripItem } from "./date-strip-carousel";

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

function buildDayItems(dateISO: string, todayISO: string): StripItem[] {
  const base = new Date();
  const items: StripItem[] = [];
  for (let offset = -DAYS_BEFORE; offset <= DAYS_AFTER; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    const iso = DAY_KEY_FMT.format(d);
    const isToday = iso === todayISO;
    items.push({
      key: iso,
      href: `/dashboard/bookings?view=day&date=${iso}`,
      selected: iso === dateISO,
      emphasized: isToday,
      top: WEEKDAY_FMT.format(d).replace(".", ""),
      main: String(d.getDate()),
      bottom: isToday ? "сьогодні" : MONTH_FMT.format(d).replace(".", ""),
    });
  }
  return items;
}

/** Horizontal day strip for the dashboard day view. */
export function BookingsDateCarousel({
  dateISO,
  todayISO,
}: {
  dateISO: string;
  todayISO: string;
}) {
  const items = buildDayItems(dateISO, todayISO);
  return <DateStripCarousel items={items} prevLabel="Попередні дати" nextLabel="Наступні дати" />;
}
