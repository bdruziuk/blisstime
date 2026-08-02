import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
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
import { SalonManagementPanel } from "@/features/admin/salon-management-panel";

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
  if (!session?.user?.id) redirect("/login");

  // Read the current email from the database instead of trusting a potentially
  // stale JWT value (for example, after an account email was changed).
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!currentUser) redirect("/login");

  const adminEmail = currentUser.email;
  if (!isSuperAdminEmail(adminEmail)) {
    return <AccessDenied email={adminEmail} />;
  }

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
  const importedBusinesses = await prisma.importedBusiness.findMany({
    take: 0,
    where: { publicationStatus: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    include: { serviceDrafts: { where: { status: "APPROVED" }, orderBy: { displayName: "asc" } } },
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
            <Link
              href="/admin/business-import"
              className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              <Building2 className="size-4" />
              Імпорт салонів
            </Link>
          </div>
          <p className="text-muted-foreground text-sm">Вхід: {adminEmail}</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={UserRound} label="Акаунтів" value={users.length} />
          <StatCard icon={CheckCircle2} label="Завершили onboarding" value={onboardedUsers} />
          <StatCard icon={Users} label="Унікальних клієнтів" value={allClientIds.size} />
          <StatCard icon={CalendarDays} label="Усього записів" value={totalBookings} />
        </section>

        <SalonManagementPanel />

        <section className="hidden" aria-hidden="true">
          <div className="flex items-end justify-between gap-3">
            <div><h2 className="font-heading text-2xl font-bold">Імпортовані салони</h2><p className="text-muted-foreground text-sm">Опубліковані заклади без зареєстрованого акаунта власника.</p></div>
            <span className="text-muted-foreground text-sm">{importedBusinesses.length}</span>
          </div>
          {importedBusinesses.length === 0 ? <div className="rounded-xl border border-dashed py-10 text-center text-sm">Опублікованих імпортованих салонів ще немає.</div> : <div className="grid gap-3 sm:grid-cols-2">{importedBusinesses.map((business) => <article key={business.id} className="border-border bg-card rounded-2xl border p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-heading text-lg font-semibold">{business.name}</h3><p className="text-muted-foreground text-sm">{business.formattedAddress}</p></div><span className="bg-emerald-500/10 text-emerald-700 rounded-full px-2 py-0.5 text-xs">опубліковано</span></div><div className="text-muted-foreground mt-3 grid gap-1 text-sm"><p>Місто: {business.city}{business.district ? `, ${business.district}` : ""}</p><p>Рейтинг: {business.rating ?? "—"} ({business.userRatingCount ?? 0})</p><p>Підтверджених послуг: {business.serviceDrafts.length}</p><p>ID: {business.id}</p></div><div className="mt-3 flex gap-4 text-sm">{business.websiteUri && <a href={business.websiteUri} target="_blank" rel="noreferrer" className="text-primary hover:underline">Сайт</a>}{business.googleMapsUri && <a href={business.googleMapsUri} target="_blank" rel="noreferrer" className="text-primary hover:underline">Google Maps</a>}<Link href="/admin/business-import" className="text-primary ml-auto hover:underline">Модерація</Link></div>{business.serviceDrafts.length > 0 && <details className="mt-3 border-t pt-3"><summary className="cursor-pointer text-sm font-semibold">Послуги ({business.serviceDrafts.length})</summary><ul className="mt-2 space-y-1 text-sm">{business.serviceDrafts.map((service) => <li key={service.id} className="flex justify-between gap-3"><span>{service.displayName}</span><span>{(service.priceMinor / 100).toLocaleString("uk-UA", { style: "currency", currency: service.currencyCode })}</span></li>)}</ul></details>}</article>)}</div>}
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

function AccessDenied({ email }: { email: string | null }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 py-16">
        <div className="border-border bg-card w-full rounded-2xl border p-8 text-center shadow-sm">
          <div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="font-heading mt-5 text-2xl font-bold">Недостатньо прав</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Акаунт {email ? <strong className="text-foreground">{email}</strong> : "без email"} не має
            доступу до панелі суперадміна. Зверніться до власника платформи, щоб додати email до
            списку суперадмінів.
          </p>
          <Link
            href="/dashboard"
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="size-4" />
            Повернутися в кабінет
          </Link>
        </div>
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
