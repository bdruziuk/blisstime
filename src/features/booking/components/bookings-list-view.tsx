import Link from "next/link";
import { Clock, Scissors, UserRound } from "lucide-react";
import { STATUS_LABELS, formatTime, formatDateLabel } from "@/features/booking/format";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CONFIRMED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  COMPLETED: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  CANCELLED: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  DECLINED: "bg-red-500/10 text-red-700 dark:text-red-400",
  EXPIRED: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  NO_SHOW: "bg-red-500/10 text-red-700 dark:text-red-400",
};

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
                  className="hover:bg-accent/50 flex min-w-0 flex-col gap-3 rounded-xl border p-3 text-sm transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-4"
                >
                  <div className="min-w-0 space-y-1.5">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <Clock className="text-primary size-4 shrink-0" />
                      {formatTime(b.slotStartISO)}–{formatTime(b.slotEndISO)}
                    </p>
                    <p className="text-muted-foreground flex min-w-0 items-start gap-1.5 text-xs">
                      <Scissors className="mt-0.5 size-3.5 shrink-0" />
                      <span className="break-words">{b.serviceName}</span>
                    </p>
                    <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
                      <UserRound className="size-3.5 shrink-0" />
                      <span className="truncate">{b.clientName}</span>
                    </p>
                  </div>
                  <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status] ?? "bg-muted text-muted-foreground"}`}>
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
