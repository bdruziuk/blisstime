import { redirect } from "next/navigation";
import { TrendingUp, Wallet, Users, Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIncomeSummary } from "@/features/income/queries";

function uah(cents: number): string {
  return `${Math.round(cents / 100).toLocaleString("uk-UA")} грн`;
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border-border bg-card flex flex-col gap-1 rounded-xl border p-4">
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-heading text-xl font-bold">{value}</span>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}

export default async function IncomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/register");
  if (!staff.onboardedAt) redirect("/onboarding/profile");

  const income = await getIncomeSummary(staff.id);
  const maxMonth = Math.max(1, ...income.months.map((m) => m.incomeCents));

  const delta = income.thisMonthCents - income.lastMonthCents;
  const deltaHint =
    income.lastMonthCents > 0
      ? `${delta >= 0 ? "+" : ""}${uah(delta)} до минулого`
      : "перший місяць з доходом";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="font-heading text-2xl font-semibold">Доходи</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi icon={Wallet} label="Цей місяць" value={uah(income.thisMonthCents)} hint={deltaHint} />
        <Kpi
          icon={Users}
          label="Візитів цього місяця"
          value={String(income.thisMonthVisits)}
        />
        <Kpi icon={Receipt} label="Середній чек" value={uah(income.avgCheckCents)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="text-primary size-4" />
            Останні 6 місяців
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {income.months.map((m) => (
            <div key={m.key} className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground w-28 shrink-0 capitalize">{m.label}</span>
              <div className="bg-accent/40 h-5 flex-1 overflow-hidden rounded">
                <div
                  className="bg-primary/70 h-full rounded"
                  style={{ width: `${Math.round((m.incomeCents / maxMonth) * 100)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right font-medium">{uah(m.incomeCents)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Топ послуг цього місяця</CardTitle>
        </CardHeader>
        <CardContent>
          {income.topServices.length === 0 ? (
            <p className="text-muted-foreground text-sm">Цього місяця ще немає завершених візитів.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {income.topServices.map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {s.name} <span className="text-muted-foreground text-xs">×{s.count}</span>
                  </span>
                  <span className="shrink-0 font-medium">{uah(s.incomeCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Дохід рахується із завершених візитів за поточними цінами послуг. Без урахування витрат.
      </p>
    </main>
  );
}
