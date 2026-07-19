import Link from "next/link";
import { DAY_LABELS, type Day, DAYS } from "@/features/booking/schemas";
import { formatTime } from "@/features/booking/format";

type BookingChip = {
  id: string;
  slotStartISO: string;
  clientName: string;
  serviceName: string;
};

export function BookingsWeekView({
  weekDates,
  bookingsByDate,
  todayISO,
}: {
  weekDates: string[];
  bookingsByDate: Record<string, BookingChip[]>;
  todayISO: string;
}) {
  return (
    <div className="divide-border flex flex-col divide-y">
      {weekDates.map((dateISO, i) => {
        const day = DAYS[i] as Day;
        const bookings = bookingsByDate[dateISO] ?? [];
        const isToday = dateISO === todayISO;
        return (
          <div
            key={dateISO}
            className={`flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4 ${
              isToday ? "bg-accent/30 -mx-3 rounded-md px-3" : ""
            }`}
          >
            <Link
              href={`/dashboard/bookings?view=day&date=${dateISO}`}
              className="text-sm font-semibold hover:underline sm:w-36 sm:shrink-0"
            >
              {DAY_LABELS[day]}
              <span className="text-muted-foreground ml-1 font-normal">
                {dateISO.slice(8, 10)}.{dateISO.slice(5, 7)}
              </span>
              {isToday && <span className="text-primary ml-1.5 text-xs">сьогодні</span>}
            </Link>
            <div className="flex flex-1 flex-wrap gap-2">
              {bookings.length === 0 ? (
                <p className="text-muted-foreground text-xs">Немає записів</p>
              ) : (
                bookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/dashboard/bookings?view=day&date=${dateISO}`}
                    className="hover:bg-accent/50 rounded-md border px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-semibold">{formatTime(b.slotStartISO)}</span>
                    <span className="text-muted-foreground"> · {b.clientName}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
