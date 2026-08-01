import { shiftMonthISO } from "@/features/booking/calendar-ranges";
import { BUSINESS_TIMEZONE } from "@/features/booking/slots";
import { DateStripCarousel, type StripItem } from "./date-strip-carousel";

const MONTHS_BEFORE = 6;
const MONTHS_AFTER = 12;

const MONTH_FMT = new Intl.DateTimeFormat("uk-UA", {
  month: "short",
  timeZone: BUSINESS_TIMEZONE,
});

function buildMonthItems(currentMonthISO: string, todayMonthISO: string): StripItem[] {
  const items: StripItem[] = [];
  for (let offset = -MONTHS_BEFORE; offset <= MONTHS_AFTER; offset++) {
    const monthISO = shiftMonthISO(todayMonthISO, offset);
    const d = new Date(`${monthISO}T12:00:00Z`);
    const isCurrentMonth = monthISO.slice(0, 7) === todayMonthISO.slice(0, 7);
    items.push({
      key: monthISO.slice(0, 7),
      href: `/dashboard/bookings?view=month&date=${monthISO}`,
      selected: monthISO.slice(0, 7) === currentMonthISO.slice(0, 7),
      emphasized: isCurrentMonth,
      top: String(d.getUTCFullYear()),
      main: MONTH_FMT.format(d).replace(".", ""),
      bottom: isCurrentMonth ? "поточний" : "",
    });
  }
  return items;
}

/** Horizontal month strip for the dashboard month view. */
export function BookingsMonthCarousel({
  monthISO,
  todayISO,
}: {
  monthISO: string;
  todayISO: string;
}) {
  const todayMonthISO = `${todayISO.slice(0, 7)}-01`;
  const items = buildMonthItems(monthISO, todayMonthISO);
  return (
    <DateStripCarousel
      items={items}
      prevLabel="Попередні місяці"
      nextLabel="Наступні місяці"
      chipWidthClass="w-16"
    />
  );
}
