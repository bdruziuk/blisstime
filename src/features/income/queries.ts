import { prisma } from "@/lib/prisma";
import { BUSINESS_TIMEZONE } from "@/features/booking/slots";

export type MonthIncome = { key: string; label: string; incomeCents: number; visits: number };
export type TopService = { name: string; incomeCents: number; count: number };

export type IncomeSummary = {
  thisMonthCents: number;
  thisMonthVisits: number;
  avgCheckCents: number;
  lastMonthCents: number;
  totalCents: number;
  months: MonthIncome[]; // chronological, oldest → newest (6 entries)
  topServices: TopService[]; // this month, by revenue desc
};

// Month key ("YYYY-MM") for a date, in the business timezone.
function monthKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  })
    .format(d)
    .slice(0, 7);
}

function monthLabel(year: number, monthIndex0: number): string {
  // Mid-month, TZ-neutral date so the month name never shifts.
  return new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, monthIndex0, 15, 12))
  );
}

/** Simple income: revenue from COMPLETED visits (sum of the booking's services'
 * current prices). No expenses, no bookkeeping. */
export async function getIncomeSummary(staffId: string): Promise<IncomeSummary> {
  const completed = await prisma.booking.findMany({
    where: { staffId, status: "COMPLETED" },
    select: {
      slotStart: true,
      service: { select: { displayName: true, priceCents: true } },
      services: { select: { service: { select: { displayName: true, priceCents: true } } } },
    },
  });

  const revenueOf = (b: (typeof completed)[number]) =>
    b.services.length > 0
      ? b.services.reduce((sum, s) => sum + s.service.priceCents, 0)
      : b.service.priceCents;

  // Current Kyiv year/month.
  const nowKey = monthKey(new Date());
  const [ny, nm] = nowKey.split("-").map(Number);

  // Build the last 6 month keys ending at the current month.
  const monthDefs: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const idx = nm - 1 - i; // 0-based month index, may be negative
    const y = ny + Math.floor(idx / 12);
    const m = ((idx % 12) + 12) % 12;
    monthDefs.push({ key: `${y}-${String(m + 1).padStart(2, "0")}`, label: monthLabel(y, m) });
  }

  const byMonth = new Map<string, { incomeCents: number; visits: number }>();
  let totalCents = 0;
  const thisMonthServices = new Map<string, TopService>();

  for (const b of completed) {
    const rev = revenueOf(b);
    totalCents += rev;
    const key = monthKey(b.slotStart);
    const bucket = byMonth.get(key) ?? { incomeCents: 0, visits: 0 };
    bucket.incomeCents += rev;
    bucket.visits += 1;
    byMonth.set(key, bucket);

    if (key === nowKey) {
      const names = b.services.length > 0 ? b.services.map((s) => s.service) : [b.service];
      for (const svc of names) {
        const t = thisMonthServices.get(svc.displayName) ?? {
          name: svc.displayName,
          incomeCents: 0,
          count: 0,
        };
        t.incomeCents += svc.priceCents;
        t.count += 1;
        thisMonthServices.set(svc.displayName, t);
      }
    }
  }

  const months: MonthIncome[] = monthDefs.map((d) => ({
    key: d.key,
    label: d.label,
    incomeCents: byMonth.get(d.key)?.incomeCents ?? 0,
    visits: byMonth.get(d.key)?.visits ?? 0,
  }));

  const thisMonth = byMonth.get(nowKey) ?? { incomeCents: 0, visits: 0 };
  const lastMonthKey = monthDefs[monthDefs.length - 2]?.key;
  const lastMonthCents = lastMonthKey ? (byMonth.get(lastMonthKey)?.incomeCents ?? 0) : 0;

  return {
    thisMonthCents: thisMonth.incomeCents,
    thisMonthVisits: thisMonth.visits,
    avgCheckCents: thisMonth.visits > 0 ? Math.round(thisMonth.incomeCents / thisMonth.visits) : 0,
    lastMonthCents,
    totalCents,
    months,
    topServices: [...thisMonthServices.values()]
      .sort((a, b) => b.incomeCents - a.incomeCents)
      .slice(0, 5),
  };
}
