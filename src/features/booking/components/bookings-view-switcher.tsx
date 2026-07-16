import Link from "next/link";

export type BookingsView = "list" | "day" | "week" | "month";

const VIEWS: { key: BookingsView; label: string }[] = [
  { key: "list", label: "Список" },
  { key: "day", label: "День" },
  { key: "week", label: "Тиждень" },
  { key: "month", label: "Місяць" },
];

export function BookingsViewSwitcher({
  current,
  dateISO,
}: {
  current: BookingsView;
  dateISO: string;
}) {
  return (
    <div className="border-border inline-flex gap-1 rounded-md border p-1 text-sm">
      {VIEWS.map((v) => (
        <Link
          key={v.key}
          href={`/dashboard/bookings?view=${v.key}&date=${dateISO}`}
          className={
            current === v.key
              ? "bg-accent text-accent-foreground rounded px-3 py-1"
              : "text-muted-foreground hover:text-foreground rounded px-3 py-1"
          }
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
