import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceForm } from "@/features/booking/components/service-form";
import { goToHoursStep, removeService } from "@/features/booking/actions";

export default async function OnboardingServicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({
    where: { userId: session.user.id },
    include: { services: { include: { category: true } } },
  });
  if (!staff) redirect("/register");

  const leafCategories = await prisma.serviceCategory.findMany({
    where: { parentId: { not: null } },
    include: { parent: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Крок 2/3 — Послуги</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {staff.services.length > 0 && (
            <ul className="flex flex-col gap-2">
              {staff.services.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>
                    {service.displayName} — {(service.priceCents / 100).toFixed(2)} грн,{" "}
                    {service.durationMinutes} хв
                  </span>
                  <form action={removeService.bind(null, service.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Видалити
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <ServiceForm
            categories={leafCategories.map((c) => ({
              id: c.id,
              name: c.name,
              parentName: c.parent?.name ?? "",
            }))}
          />

          <form action={goToHoursStep}>
            <Button type="submit" disabled={staff.services.length === 0} className="w-full">
              Далі
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
