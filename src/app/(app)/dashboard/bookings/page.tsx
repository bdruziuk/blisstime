import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDayBoundsUTC, BUSINESS_TIMEZONE } from "@/features/booking/slots";
import {
  shiftDateISO,
  getWeekStartISO,
  getWeekDates,
  getWeekRangeUTC,
  getMonthRangeUTC,
  shiftMonthISO,
} from "@/features/booking/calendar-ranges";
import { expireStaleHolds } from "@/features/booking/expiry";
import { AdminBookingsPanel } from "@/features/booking/components/admin-bookings-panel";
import { BookingsViewSwitcher, type BookingsView } from "@/features/booking/components/bookings-view-switcher";
import { BookingsListView } from "@/features/booking/components/bookings-list-view";
import { BookingsWeekView } from "@/features/booking/components/bookings-week-view";
import { BookingsMonthView } from "@/features/booking/components/bookings-month-view";

function todayISOInBusinessTz() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).format(new Date());
}

const VIEWS: BookingsView[] = ["list", "day", "week", "month"];

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string; cursor?: string; dir?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/register");
  if (!staff.onboardedAt) redirect("/onboarding/profile");

  await expireStaleHolds(staff.id);

  const { date, view, cursor, dir } = await searchParams;
  const todayISO = todayISOInBusinessTz();
  const dateISO = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISO;
  const viewMode: BookingsView = VIEWS.includes(view as BookingsView)
    ? (view as BookingsView)
    : "day";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Записи</h1>
        <BookingsViewSwitcher current={viewMode} dateISO={dateISO} />
      </div>

      {viewMode === "list" && (
        <BookingsListContent
          staffId={staff.id}
          cursor={cursor}
          dir={dir === "prev" ? "prev" : dir === "next" ? "next" : undefined}
        />
      )}

      {viewMode === "day" && (
        <BookingsDayContent staffId={staff.id} dateISO={dateISO} />
      )}

      {viewMode === "week" && <BookingsWeekContent staffId={staff.id} dateISO={dateISO} />}

      {viewMode === "month" && (
        <BookingsMonthContent staffId={staff.id} dateISO={dateISO} todayISO={todayISO} />
      )}
    </main>
  );
}

const LIST_PAGE_SIZE = 10;

async function BookingsListContent({
  staffId,
  cursor,
  dir,
}: {
  staffId: string;
  cursor?: string;
  dir?: "next" | "prev";
}) {
  const cursorDate = cursor ? new Date(cursor) : null;
  const validCursor = cursorDate && !Number.isNaN(cursorDate.getTime()) ? cursorDate : null;

  let bookings;
  if (!validCursor) {
    bookings = await prisma.booking.findMany({
      where: { staffId, slotStart: { gte: new Date() } },
      include: { client: true, service: true },
      orderBy: { slotStart: "asc" },
      take: LIST_PAGE_SIZE,
    });
  } else if (dir === "prev") {
    const rows = await prisma.booking.findMany({
      where: { staffId, slotStart: { lt: validCursor } },
      include: { client: true, service: true },
      orderBy: { slotStart: "desc" },
      take: LIST_PAGE_SIZE,
    });
    bookings = rows.reverse();
  } else {
    bookings = await prisma.booking.findMany({
      where: { staffId, slotStart: { gt: validCursor } },
      include: { client: true, service: true },
      orderBy: { slotStart: "asc" },
      take: LIST_PAGE_SIZE,
    });
  }

  const hasNext = dir === "prev" ? true : bookings.length === LIST_PAGE_SIZE;
  const hasPrev = !validCursor ? true : dir === "next" ? true : bookings.length === LIST_PAGE_SIZE;
  const nextCursor = bookings.at(-1)?.slotStart.toISOString();
  const prevCursor = bookings.at(0)?.slotStart.toISOString();

  const groups = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const key = b.slotStart.toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }

  return (
    <div className="flex flex-col gap-4">
      <BookingsListView
        bookingsByDate={[...groups.entries()].map(([dateISO, group]) => ({
          dateISO,
          bookings: group.map((b) => ({
            id: b.id,
            status: b.status,
            slotStartISO: b.slotStart.toISOString(),
            slotEndISO: b.slotEnd.toISOString(),
            clientName: b.client.name ?? b.client.phone,
            serviceName: b.service.displayName,
          })),
        }))}
      />

      <div className="flex items-center justify-between border-t pt-4 text-sm">
        {hasPrev && prevCursor ? (
          <Link
            href={`/dashboard/bookings?view=list&cursor=${encodeURIComponent(prevCursor)}&dir=prev`}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Попередні
          </Link>
        ) : (
          <span />
        )}
        {hasNext && nextCursor ? (
          <Link
            href={`/dashboard/bookings?view=list&cursor=${encodeURIComponent(nextCursor)}&dir=next`}
            className="text-muted-foreground hover:text-foreground"
          >
            Наступні →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

async function BookingsDayContent({ staffId, dateISO }: { staffId: string; dateISO: string }) {
  const { start, end } = getDayBoundsUTC(dateISO);

  const [bookings, services] = await Promise.all([
    prisma.booking.findMany({
      where: { staffId, slotStart: { gte: start, lte: end } },
      include: { client: true, service: true },
      orderBy: { slotStart: "asc" },
    }),
    prisma.staffService.findMany({ where: { staffId, isActive: true } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-sm">
        <Link
          href={`/dashboard/bookings?view=day&date=${shiftDateISO(dateISO, -1)}`}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Попередній день
        </Link>
        <span className="font-medium">{dateISO}</span>
        <Link
          href={`/dashboard/bookings?view=day&date=${shiftDateISO(dateISO, 1)}`}
          className="text-muted-foreground hover:text-foreground"
        >
          Наступний день →
        </Link>
      </div>

      <AdminBookingsPanel
        staffId={staffId}
        dateISO={dateISO}
        bookings={bookings.map((b) => ({
          id: b.id,
          status: b.status,
          slotStartISO: b.slotStart.toISOString(),
          slotEndISO: b.slotEnd.toISOString(),
          holdExpiresAtISO: b.holdExpiresAt ? b.holdExpiresAt.toISOString() : null,
          clientName: b.client.name ?? b.client.phone,
          clientPhone: b.client.phone,
          serviceId: b.serviceId,
          serviceName: b.service.displayName,
          durationMinutes: b.service.durationMinutes,
        }))}
        services={services.map((s) => ({
          id: s.id,
          displayName: s.displayName,
          durationMinutes: s.durationMinutes,
          priceCents: s.priceCents,
        }))}
      />
    </div>
  );
}

async function BookingsWeekContent({ staffId, dateISO }: { staffId: string; dateISO: string }) {
  const weekStartISO = getWeekStartISO(dateISO);
  const weekDates = getWeekDates(weekStartISO);
  const { start, end } = getWeekRangeUTC(weekStartISO);

  const bookings = await prisma.booking.findMany({
    where: {
      staffId,
      slotStart: { gte: start, lte: end },
      status: { notIn: ["CANCELLED", "DECLINED", "EXPIRED"] },
    },
    include: { client: true, service: true },
    orderBy: { slotStart: "asc" },
  });

  const bookingsByDate: Record<string, { id: string; slotStartISO: string; clientName: string; serviceName: string }[]> = {};
  for (const b of bookings) {
    const key = b.slotStart.toISOString().slice(0, 10);
    (bookingsByDate[key] ??= []).push({
      id: b.id,
      slotStartISO: b.slotStart.toISOString(),
      clientName: b.client.name ?? b.client.phone,
      serviceName: b.service.displayName,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-sm">
        <Link
          href={`/dashboard/bookings?view=week&date=${shiftDateISO(weekStartISO, -7)}`}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Попередній тиждень
        </Link>
        <span className="font-medium">
          {weekStartISO} — {shiftDateISO(weekStartISO, 6)}
        </span>
        <Link
          href={`/dashboard/bookings?view=week&date=${shiftDateISO(weekStartISO, 7)}`}
          className="text-muted-foreground hover:text-foreground"
        >
          Наступний тиждень →
        </Link>
      </div>

      <BookingsWeekView weekDates={weekDates} bookingsByDate={bookingsByDate} />
    </div>
  );
}

async function BookingsMonthContent({
  staffId,
  dateISO,
  todayISO,
}: {
  staffId: string;
  dateISO: string;
  todayISO: string;
}) {
  const { start, end } = getMonthRangeUTC(dateISO);

  const bookings = await prisma.booking.findMany({
    where: {
      staffId,
      slotStart: { gte: start, lte: end },
      status: { notIn: ["CANCELLED", "DECLINED", "EXPIRED"] },
    },
    select: { slotStart: true },
  });

  const countsByDate: Record<string, number> = {};
  for (const b of bookings) {
    const key = b.slotStart.toISOString().slice(0, 10);
    countsByDate[key] = (countsByDate[key] ?? 0) + 1;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-sm">
        <Link
          href={`/dashboard/bookings?view=month&date=${shiftMonthISO(dateISO, -1)}`}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Попередній місяць
        </Link>
        <span className="font-medium">{dateISO.slice(0, 7)}</span>
        <Link
          href={`/dashboard/bookings?view=month&date=${shiftMonthISO(dateISO, 1)}`}
          className="text-muted-foreground hover:text-foreground"
        >
          Наступний місяць →
        </Link>
      </div>

      <BookingsMonthView monthAnchorISO={dateISO} countsByDate={countsByDate} todayISO={todayISO} />
    </div>
  );
}
