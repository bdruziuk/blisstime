import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, Scissors, MapPin, ArrowUpRight, CalendarDays, Clock, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BUSINESS_TIMEZONE, getDayBoundsUTC } from "@/features/booking/slots";
import type { Prisma } from "@/generated/prisma/client";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує підтвердження",
  CONFIRMED: "Підтверджено",
  COMPLETED: "Завершено",
  NO_SHOW: "Не прийшов",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({
    where: { userId: session.user.id },
    include: { services: true, location: true },
  });
  if (!staff) redirect("/register");
  if (!staff.onboardedAt) redirect("/onboarding/profile");

  const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).format(new Date());
  const { start, end } = getDayBoundsUTC(todayISO);
  const bookingWhere: Prisma.BookingWhereInput = {
    staffId: staff.id,
    slotStart: { gte: start, lt: end },
    status: { notIn: ["DECLINED", "CANCELLED", "EXPIRED"] },
  };
  const [todayBookings, todayBookingsCount] = await Promise.all([
    prisma.booking.findMany({
      where: bookingWhere,
      orderBy: { slotStart: "asc" },
      take: 5,
      include: { client: true, service: true, services: { include: { service: true } } },
    }),
    prisma.booking.count({ where: bookingWhere }),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-heading text-3xl font-bold">Привіт, {staff.displayName}!</h1>
        <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5">
          <MapPin className="size-4" />
          {staff.location.city}, {staff.location.address}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="card-hover">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <Globe className="size-4" />
                Публічна сторінка
              </p>
              <Link
                href={`/@${staff.username}`}
                className="text-primary mt-1.5 flex items-center gap-1 font-semibold"
              >
                /@{staff.username}
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="flex h-full flex-col p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <Scissors className="size-4" />
                Послуг додано
              </p>
              <span className="text-2xl font-bold">{staff.services.length}</span>
            </div>
            {staff.services.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t pt-3">
                {staff.services.slice(0, 3).map((service) => (
                  <li key={service.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{service.displayName}</span>
                    <span className="text-muted-foreground shrink-0">{(service.priceCents / 100).toLocaleString("uk-UA")} грн</span>
                  </li>
                ))}
                {staff.services.length > 3 && <li className="text-muted-foreground text-xs">Ще {staff.services.length - 3}</li>}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-4 border-t pt-3 text-sm">Послуг ще не додано.</p>
            )}
            <Button render={<Link href="/dashboard/services" />} nativeButton={false} variant="outline" size="sm" className="mt-4 w-full">
              <Pencil />Редагувати послуги
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm"><CalendarDays className="size-4" />Записи на сьогодні</p>
              <p className="mt-1 text-2xl font-bold">{todayBookingsCount}</p>
            </div>
            <Button render={<Link href="/dashboard/bookings" />} nativeButton={false} variant="outline" size="sm">
              Подивитися всі записи <ArrowUpRight />
            </Button>
          </div>

          {todayBookings.length > 0 ? (
            <ul className="mt-4 divide-y border-t">
              {todayBookings.map((booking) => {
                const services = booking.services.length > 0
                  ? booking.services.map((item) => item.service.displayName).join(" + ")
                  : booking.service.displayName;
                return (
                  <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{booking.client.name || booking.client.phone}</p>
                      <p className="text-muted-foreground truncate text-xs">{services}</p>
                    </div>
                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1 font-semibold"><Clock className="size-3.5" />{new Intl.DateTimeFormat("uk-UA", { timeZone: BUSINESS_TIMEZONE, hour: "2-digit", minute: "2-digit" }).format(booking.slotStart)}</p>
                      <p className="text-muted-foreground text-xs">{STATUS_LABELS[booking.status] ?? booking.status}</p>
                    </div>
                  </li>
                );
              })}
              {todayBookingsCount > todayBookings.length && <li className="text-muted-foreground py-3 text-xs">Ще записів: {todayBookingsCount - todayBookings.length}</li>}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-4 border-t pt-4 text-sm">На сьогодні активних записів немає.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
