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
}: {
  weekDates: string[];
  bookingsByDate: Record<string, BookingChip[]>;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {weekDates.map((dateISO, i) => {
        const day = DAYS[i] as Day;
        const bookings = bookingsByDate[dateISO] ?? [];
        return (
          <div key={dateISO} className="flex flex-col gap-2">
            <Link
              href={`/dashboard/bookings?view=day&date=${dateISO}`}
              className="text-sm font-medium hover:underline"
            >
              {DAY_LABELS[day]}
              <span className="text-muted-foreground ml-1 font-normal">
                {dateISO.slice(8, 10)}.{dateISO.slice(5, 7)}
              </span>
            </Link>
            <div className="flex flex-col gap-1">
              {bookings.length === 0 ? (
                <p className="text-muted-foreground text-xs">—</p>
              ) : (
                bookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/dashboard/bookings?view=day&date=${dateISO}`}
                    className="hover:bg-accent/50 rounded-md border px-2 py-1 text-xs"
                  >
                    <div className="font-medium">{formatTime(b.slotStartISO)}</div>
                    <div className="text-muted-foreground truncate">{b.clientName}</div>
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
