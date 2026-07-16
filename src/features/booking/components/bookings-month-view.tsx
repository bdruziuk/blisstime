import Link from "next/link";
import { getMonthInfo, shiftDateISO } from "@/features/booking/calendar-ranges";

const WEEKDAY_HEADERS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export function BookingsMonthView({
  monthAnchorISO,
  countsByDate,
  todayISO,
}: {
  monthAnchorISO: string;
  countsByDate: Record<string, number>;
  todayISO: string;
}) {
  const { firstDayISO, daysInMonth, leadingBlanks } = getMonthInfo(monthAnchorISO);

  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => shiftDateISO(firstDayISO, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground grid grid-cols-7 gap-2 text-center text-xs font-medium">
        {WEEKDAY_HEADERS.map((h) => (
          <div key={h}>{h}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((dateISO, i) => {
          if (!dateISO) return <div key={`blank-${i}`} />;
          const count = countsByDate[dateISO] ?? 0;
          const isToday = dateISO === todayISO;
          return (
            <Link
              key={dateISO}
              href={`/dashboard/bookings?view=day&date=${dateISO}`}
              className={`hover:bg-accent/50 flex aspect-square flex-col items-center justify-center gap-1 rounded-md border text-sm ${
                isToday ? "border-primary" : "border-border"
              }`}
            >
              <span>{Number(dateISO.slice(8, 10))}</span>
              {count > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[0.65rem]">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
