import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDayBoundsUTC, BUSINESS_TIMEZONE } from "@/features/booking/slots";
import { expireStaleHolds } from "@/features/booking/expiry";
import { AdminBookingsPanel } from "@/features/booking/components/admin-bookings-panel";

function todayISOInBusinessTz() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).format(new Date());
}

function shiftDateISO(dateISO: string, days: number) {
  const d = new Date(`${dateISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/register");
  if (!staff.onboardedAt) redirect("/onboarding/profile");

  await expireStaleHolds(staff.id);

  const { date } = await searchParams;
  const dateISO = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISOInBusinessTz();

  const { start, end } = getDayBoundsUTC(dateISO);

  const [bookings, services] = await Promise.all([
    prisma.booking.findMany({
      where: { staffId: staff.id, slotStart: { gte: start, lte: end } },
      include: { client: true, service: true },
      orderBy: { slotStart: "asc" },
    }),
    prisma.staffService.findMany({ where: { staffId: staff.id, isActive: true } }),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Записи</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={`/dashboard/bookings?date=${shiftDateISO(dateISO, -1)}`}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Попередній день
          </Link>
          <span className="font-medium">{dateISO}</span>
          <Link
            href={`/dashboard/bookings?date=${shiftDateISO(dateISO, 1)}`}
            className="text-muted-foreground hover:text-foreground"
          >
            Наступний день →
          </Link>
        </div>
      </div>

      <AdminBookingsPanel
        staffId={staff.id}
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
    </main>
  );
}
