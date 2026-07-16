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

  const initials = staff.displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center gap-4">
        <div className="bg-accent text-accent-foreground font-heading flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold">
          {initials}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">{staff.displayName}</h1>
          <p className="text-muted-foreground text-sm">
            {staff.location.city}, {staff.location.address}
          </p>
        </div>
      </div>

      {staff.bio && <p className="text-muted-foreground">{staff.bio}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Записатися</CardTitle>
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
