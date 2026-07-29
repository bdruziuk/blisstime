import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Phone, Star, Send } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientDetail } from "@/features/crm/queries";
import { ClientNoteForm } from "@/features/crm/components/client-note-form";
import { BUSINESS_TIMEZONE } from "@/features/booking/slots";
import { getPrepaymentAdvice } from "@/features/booking/reliability";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує",
  CONFIRMED: "Підтверджено",
  DECLINED: "Відхилено",
  EXPIRED: "Прострочено",
  COMPLETED: "Завершено",
  CANCELLED: "Скасовано",
  NO_SHOW: "Не з'явився",
};

const dtFmt = new Intl.DateTimeFormat("uk-UA", {
  timeZone: BUSINESS_TIMEZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/register");
  if (!staff.onboardedAt) redirect("/onboarding/profile");

  const { clientId } = await params;
  const client = await getClientDetail(staff.id, clientId);
  if (!client) notFound();

  const completedVisits = client.visits.filter((v) => v.status === "COMPLETED").length;
  const advice = getPrepaymentAdvice({
    reliabilityScore: client.reliabilityScore,
    noShowCount: client.noShowCount,
    isNewClient: completedVisits === 0,
  });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <Link
        href="/dashboard/clients"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Усі клієнти
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">{client.name ?? client.phone}</h1>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1">
            <Phone className="size-3.5" />
            {client.phone}
          </span>
          <span className="flex items-center gap-1">
            <Star className="size-3.5" />
            надійність {client.reliabilityScore}
          </span>
          {client.noShowCount > 0 && <span>не з&apos;явився: {client.noShowCount}</span>}
          {client.lateCancellationCount > 0 && (
            <span>пізніх скасувань: {client.lateCancellationCount}</span>
          )}
          {client.telegramLinked && (
            <span className="flex items-center gap-1 text-[#229ED9]">
              <Send className="size-3.5" />
              Telegram
            </span>
          )}
        </div>
      </div>

      {advice.message && (
        <div
          className={`rounded-xl border p-3 text-sm ${
            advice.level === "risky"
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "border-border bg-accent/40 text-foreground"
          }`}
        >
          ⚠️ {advice.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Нотатка</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientNoteForm clientId={client.id} note={client.note} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Історія візитів ({client.visits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {client.visits.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="truncate">{v.serviceNames}</div>
                  <div className="text-muted-foreground text-xs">{dtFmt.format(v.slotStart)}</div>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {STATUS_LABELS[v.status] ?? v.status}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
