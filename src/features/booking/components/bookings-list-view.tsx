import Link from "next/link";
import { STATUS_LABELS, formatTime, formatDateLabel } from "@/features/booking/format";

type BookingListItem = {
  id: string;
  status: string;
  slotStartISO: string;
  slotEndISO: string;
  clientName: string;
  serviceName: string;
};

export function BookingsListView({
  bookingsByDate,
}: {
  bookingsByDate: { dateISO: string; bookings: BookingListItem[] }[];
}) {
  const nonEmpty = bookingsByDate.filter((g) => g.bookings.length > 0);

  if (nonEmpty.length === 0) {
    return <p className="text-muted-foreground text-sm">Найближчим часом записів немає.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {nonEmpty.map((group) => (
        <div key={group.dateISO}>
          <h2 className="text-muted-foreground mb-2 text-sm font-medium capitalize">
            {formatDateLabel(group.dateISO)}
          </h2>
          <ul className="flex flex-col gap-2">
            {group.bookings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/dashboard/bookings?view=day&date=${group.dateISO}`}
                  className="hover:bg-accent/50 flex items-center justify-between rounded-md border px-4 py-3 text-sm"
                >
                  <span>
                    {formatTime(b.slotStartISO)}–{formatTime(b.slotEndISO)} · {b.serviceName} ·{" "}
                    {b.clientName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
