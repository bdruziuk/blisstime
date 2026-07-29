import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, StickyNote, Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientsForStaff } from "@/features/crm/queries";
import { BUSINESS_TIMEZONE } from "@/features/booking/slots";

const dayFmt = new Intl.DateTimeFormat("uk-UA", {
  timeZone: BUSINESS_TIMEZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/register");
  if (!staff.onboardedAt) redirect("/onboarding/profile");

  const clients = await getClientsForStaff(staff.id);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="font-heading text-2xl font-semibold">Клієнти</h1>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-full">
            <Users className="size-6" />
          </div>
          <p className="font-medium">Клієнтів поки немає</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Тут з&apos;являться всі, хто до вас записувався — з історією візитів і нотатками.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/clients/${c.id}`}
                className="border-border hover:border-primary hover:bg-accent/40 flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold">{c.name ?? c.phone}</span>
                    {c.hasNote && <StickyNote className="text-muted-foreground size-3.5 shrink-0" />}
                  </div>
                  <p className="text-muted-foreground text-xs">{c.phone}</p>
                </div>
                <div className="text-muted-foreground flex shrink-0 flex-col items-end gap-0.5 text-xs">
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5" />
                    надійність {c.reliabilityScore}
                  </span>
                  <span>
                    візитів: {c.completedVisits}
                    {c.lastVisit ? ` · ост. ${dayFmt.format(c.lastVisit)}` : ""}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
