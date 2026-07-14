import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingWidget } from "@/features/booking/components/booking-widget";

export default async function MasterPublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const staff = await prisma.staff.findUnique({
    where: { username },
    include: {
      location: true,
      services: { where: { isActive: true }, include: { category: true } },
    },
  });

  if (!staff || !staff.onboardedAt) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">{staff.displayName}</h1>
        {staff.bio && <p className="text-muted-foreground mt-1">{staff.bio}</p>}
        <p className="text-muted-foreground mt-1 text-sm">
          {staff.location.city}, {staff.location.address}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Записатися</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.services.length === 0 ? (
            <p className="text-muted-foreground text-sm">Послуги ще не додано.</p>
          ) : (
            <BookingWidget
              staffId={staff.id}
              services={staff.services.map((s) => ({
                id: s.id,
                displayName: s.displayName,
                priceCents: s.priceCents,
                durationMinutes: s.durationMinutes,
                categoryName: s.category.name,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
