import { BUSINESS_TIMEZONE } from "@/features/booking/slots";
import { shiftDateISO, getWeekStartISO } from "@/features/booking/calendar-ranges";
import { DateStripCarousel, type StripItem } from "./date-strip-carousel";

const WEEKS_BEFORE = 4;
const WEEKS_AFTER = 16;

const MONTH_FMT = new Intl.DateTimeFormat("uk-UA", {
  month: "short",
  timeZone: BUSINESS_TIMEZONE,
});

function dayAndMonth(dateISO: string) {
  const d = new Date(`${dateISO}T12:00:00Z`);
  return { day: d.getUTCDate(), month: MONTH_FMT.format(d).replace(".", "") };
}

function buildWeekItems(currentWeekStartISO: string, todayWeekStartISO: string): StripItem[] {
  const items: StripItem[] = [];
  for (let offset = -WEEKS_BEFORE; offset <= WEEKS_AFTER; offset++) {
    const weekStartISO = shiftDateISO(todayWeekStartISO, offset * 7);
    const weekEndISO = shiftDateISO(weekStartISO, 6);
    const start = dayAndMonth(weekStartISO);
    const end = dayAndMonth(weekEndISO);
    const isCurrentWeek = weekStartISO === todayWeekStartISO;
    items.push({
      key: weekStartISO,
      href: `/dashboard/bookings?view=week&date=${weekStartISO}`,
      selected: weekStartISO === currentWeekStartISO,
      emphasized: isCurrentWeek,
      top: start.month === end.month ? start.month : `${start.month}–${end.month}`,
      main: `${start.day}–${end.day}`,
      bottom: isCurrentWeek ? "поточний" : "",
    });
  }
  return items;
}

/** Horizontal week strip for the dashboard week view — each chip is a week's date range. */
export function BookingsWeekCarousel({
  weekStartISO,
  todayISO,
}: {
  weekStartISO: string;
  todayISO: string;
}) {
  const todayWeekStartISO = getWeekStartISO(todayISO);
  const items = buildWeekItems(weekStartISO, todayWeekStartISO);
  return (
    <DateStripCarousel
      items={items}
      prevLabel="Попередні тижні"
      nextLabel="Наступні тижні"
      chipWidthClass="w-20"
      scrollStep={280}
    />
  );
}
