import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceForm } from "@/features/booking/components/service-form";
import { EditableServiceRow } from "@/features/booking/components/editable-service-row";
import { AiImportPanel } from "@/features/ai-import/components/ai-import-panel";

export default async function DashboardServicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({
    where: { userId: session.user.id },
    include: { services: true },
  });
  if (!staff) redirect("/register");
  if (!staff.onboardedAt) redirect("/onboarding/profile");

  const leafCategories = await prisma.serviceCategory.findMany({
    where: { parentId: { not: null } },
    include: { parent: true },
    orderBy: { name: "asc" },
  });
  const categories = leafCategories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    parentName: c.parent?.name ?? "",
  }));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="font-heading text-2xl font-bold">Послуги</h1>

      <Card>
        <CardContent className="p-5">
          {staff.services.length === 0 ? (
            <p className="text-muted-foreground text-sm">Послуг ще не додано.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {staff.services.map((s) => (
                <EditableServiceRow
                  key={s.id}
                  service={{
                    id: s.id,
                    displayName: s.displayName,
                    priceCents: s.priceCents,
                    durationMinutes: s.durationMinutes,
                    categoryId: s.categoryId,
                    rebookReminderWeeks: s.rebookReminderWeeks,
                  }}
                  categories={categories}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Додати послугу</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AiImportPanel categories={categories} />
          <ServiceForm categories={categories} />
        </CardContent>
      </Card>
    </main>
  );
}
