import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, ShieldCheck, UserRound, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SalonManagementPanel } from "@/features/admin/salon-management-panel";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminEmail } from "@/lib/super-admin";

export default async function SuperAdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!currentUser) redirect("/login");
  if (!isSuperAdminEmail(currentUser.email)) return <AccessDenied email={currentUser.email} />;

  const [users, unownedSalons] = await Promise.all([
    prisma.user.findMany({
      select: {
        staff: {
          select: {
            onboardedAt: true,
            bookings: { select: { clientId: true } },
          },
        },
      },
    }),
    prisma.importedBusiness.count({ where: { claimedByStaffId: null } }),
  ]);
  const clientIds = new Set(users.flatMap((user) => user.staff?.bookings.map((booking) => booking.clientId) ?? []));
  const onboardedUsers = users.filter((user) => user.staff?.onboardedAt).length;
  const totalBookings = users.reduce((sum, user) => sum + (user.staff?.bookings.length ?? 0), 0);

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
            <h1 className="font-heading text-3xl font-bold">Салони та майстри</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Єдиний список імпортованих, створених вручну та прив’язаних до власника записів.
            </p>
            <Link href="/admin/business-import" className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
              <Building2 className="size-4" />
              Імпорт салонів
            </Link>
          </div>
          <p className="text-muted-foreground text-sm">Вхід: {currentUser.email}</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={UserRound} label="Акаунтів" value={users.length} />
          <StatCard icon={CheckCircle2} label="Завершили onboarding" value={onboardedUsers} />
          <StatCard icon={Users} label="Унікальних клієнтів" value={clientIds.size} />
          <StatCard icon={CalendarDays} label="Усього записів" value={totalBookings} />
          <StatCard icon={Building2} label="Салонів без власника" value={unownedSalons} />
        </section>

        <SalonManagementPanel />
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
            Акаунт {email ? <strong className="text-foreground">{email}</strong> : "без email"} не має доступу до панелі суперадміна.
          </p>
          <Link href="/dashboard" className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
            <ArrowLeft className="size-4" />
            Повернутися в кабінет
          </Link>
        </div>
      </main>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: number }) {
  return (
    <div className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <p className="text-muted-foreground flex items-center gap-2 text-xs"><Icon className="size-4" />{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
