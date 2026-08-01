import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Scissors,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { SiteHeader } from "@/components/site-header";
import { BUSINESS_TIMEZONE } from "@/features/booking/slots";

const dateTimeFormatter = new Intl.DateTimeFormat("uk-UA", {
  timeZone: BUSINESS_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  timeZone: BUSINESS_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const statusLabels: Record<string, string> = {
  PENDING: "очікує",
  CONFIRMED: "підтверджено",
  DECLINED: "відхилено",
  EXPIRED: "прострочено",
  COMPLETED: "завершено",
  CANCELLED: "скасовано",
  NO_SHOW: "не прийшов",
};

export default async function SuperAdminPage() {
  const session = await auth();
  const adminEmail = session?.user?.email;
  if (!isSuperAdminEmail(adminEmail)) notFound();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
      accounts: { select: { provider: true } },
      staff: {
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          onboardedAt: true,
          confirmationMode: true,
          telegramChatId: true,
          location: {
            select: {
              address: true,
              city: true,
              district: true,
              organization: { select: { name: true, type: true } },
            },
          },
          services: {
            select: { id: true, displayName: true, isActive: true },
          },
          bookings: {
            orderBy: { slotStart: "desc" },
            select: {
              id: true,
              status: true,
              slotStart: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  reliabilityScore: true,
                  noShowCount: true,
                  lateCancellationCount: true,
                  telegramChatId: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const allClientIds = new Set(
    users.flatMap((user) => user.staff?.bookings.map((booking) => booking.client.id) ?? [])
  );
  const onboardedUsers = users.filter((user) => Boolean(user.staff?.onboardedAt)).length;
  const totalBookings = users.reduce(
    (sum, user) => sum + (user.staff?.bookings.length ?? 0),
    0
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-primary mb-2 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4" />
              Суперадмін
            </div>
            <h1 className="font-heading text-3xl font-bold">Користувачі платформи</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Акаунти майстрів, їхні налаштування, активність і клієнти.
            </p>
          </div>
          <p className="text-muted-foreground text-sm">Вхід: {adminEmail}</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={UserRound} label="Акаунтів" value={users.length} />
          <StatCard icon={CheckCircle2} label="Завершили onboarding" value={onboardedUsers} />
          <StatCard icon={Users} label="Унікальних клієнтів" value={allClientIds.size} />
          <StatCard icon={CalendarDays} label="Усього записів" value={totalBookings} />
        </section>

        <section className="flex flex-col gap-4">
          {users.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <p className="font-medium">Зареєстрованих користувачів ще немає</p>
            </div>
          ) : (
            users.map((user) => {
              const staff = user.staff;
              const clients = new Map<
                string,
                {
                  client: NonNullable<typeof staff>["bookings"][number]["client"];
                  bookings: NonNullable<typeof staff>["bookings"];
                }
              >();

              for (const booking of staff?.bookings ?? []) {
                const existing = clients.get(booking.client.id);
                if (existing) existing.bookings.push(booking);
                else clients.set(booking.client.id, { client: booking.client, bookings: [booking] });
              }

              const activeServices = staff?.services.filter((service) => service.isActive).length ?? 0;

              return (
                <article key={user.id} className="border-border bg-card rounded-2xl border shadow-sm">
                  <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-xl font-semibold">
                          {staff?.displayName || user.name || "Без імені"}
                        </h2>
                        {isSuperAdminEmail(user.email) && (
                          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                            суперадмін
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            staff?.onboardedAt
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {staff?.onboardedAt ? "onboarding завершено" : "onboarding не завершено"}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <span>{user.email ?? "email відсутній"}</span>
                        <span>реєстрація: {dateTimeFormatter.format(user.createdAt)}</span>
                        <span>
                          вхід: {user.accounts.map((account) => account.provider).join(", ") || "credentials"}
                        </span>
                      </div>
                      {staff && (
                        <div className="text-muted-foreground mt-4 grid gap-2 text-sm sm:grid-cols-2">
                          <p className="flex items-center gap-2">
                            <MapPin className="size-4 shrink-0" />
                            {[staff.location.city, staff.location.district, staff.location.address]
                              .filter(Boolean)
                              .join(", ") || "Локацію не заповнено"}
                          </p>
                          <p>
                            Організація: {staff.location.organization.name} ({staff.location.organization.type})
                          </p>
                          <p className="flex items-center gap-2">
                            <Scissors className="size-4 shrink-0" />
                            Послуг: {activeServices} активних / {staff.services.length} усього
                          </p>
                          <p>Telegram: {staff.telegramChatId ? "підключено" : "не підключено"}</p>
                          <p>Підтвердження: {staff.confirmationMode}</p>
                          <p>ID користувача: {user.id}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-1 text-sm lg:items-end">
                      <span className="font-semibold">{staff?.bookings.length ?? 0} записів</span>
                      <span className="text-muted-foreground">{clients.size} клієнтів</span>
                      {staff && (
                        <Link
                          href={`/@${staff.username}`}
                          className="text-primary mt-2 inline-flex items-center gap-1 font-medium hover:underline"
                        >
                          Публічний профіль <ExternalLink className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <details className="border-border border-t">
                    <summary className="hover:bg-accent/40 cursor-pointer px-5 py-3 text-sm font-semibold transition-colors">
                      Клієнти ({clients.size})
                    </summary>
                    <div className="border-border overflow-x-auto border-t">
                      {clients.size === 0 ? (
                        <p className="text-muted-foreground px-5 py-8 text-center text-sm">
                          У цього користувача ще немає клієнтів.
                        </p>
                      ) : (
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="bg-muted/50 text-muted-foreground text-xs">
                            <tr>
                              <th className="px-5 py-3 font-medium">Клієнт</th>
                              <th className="px-3 py-3 font-medium">Телефон</th>
                              <th className="px-3 py-3 font-medium">Надійність</th>
                              <th className="px-3 py-3 font-medium">Записи</th>
                              <th className="px-3 py-3 font-medium">Останній запис</th>
                              <th className="px-5 py-3 font-medium">Telegram</th>
                            </tr>
                          </thead>
                          <tbody className="divide-border divide-y">
                            {[...clients.values()].map(({ client, bookings }) => {
                              const latest = bookings[0];
                              return (
                                <tr key={client.id} className="hover:bg-accent/20">
                                  <td className="px-5 py-3 font-medium">
                                    {client.name || "Без імені"}
                                    <div className="text-muted-foreground text-xs">
                                      з {dateFormatter.format(client.createdAt)}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3">{client.phone}</td>
                                  <td className="px-3 py-3">
                                    {client.reliabilityScore}
                                    <div className="text-muted-foreground text-xs">
                                      no-show: {client.noShowCount}, пізні: {client.lateCancellationCount}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3">{bookings.length}</td>
                                  <td className="px-3 py-3">
                                    {dateTimeFormatter.format(latest.slotStart)}
                                    <div className="text-muted-foreground text-xs">
                                      {statusLabels[latest.status] ?? latest.status}
                                    </div>
                                  </td>
                                  <td className="px-5 py-3">
                                    {client.telegramChatId ? "підключено" : "ні"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </details>
                </article>
              );
            })
          )}
        </section>
      </main>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: number;
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <Icon className="size-4" />
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
