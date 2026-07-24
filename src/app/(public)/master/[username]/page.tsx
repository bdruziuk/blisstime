import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, CalendarCheck, Sparkles, ArrowLeft, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingWidget } from "@/features/booking/components/booking-widget";
import { getStaffRatingStats } from "@/features/booking/rating";

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

  const ratingStats = await getStaffRatingStats(staff.id);

  const initials = staff.displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const categoryNames = [...new Set(staff.services.map((s) => s.category.name))];

  return (
    <main className="relative flex flex-col">
      <div
        aria-hidden
        className="from-accent/70 via-background to-background pointer-events-none absolute inset-0 h-72 bg-gradient-to-b"
      />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
        <Link
          href="/search"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Знайти іншого майстра
        </Link>

        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="bg-primary text-primary-foreground font-heading ring-background flex size-20 shrink-0 items-center justify-center rounded-3xl text-2xl font-bold shadow-lg ring-4">
            {initials}
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">{staff.displayName}</h1>
            {ratingStats && (
              <p className="flex items-center gap-1 text-sm font-semibold">
                <Star className="fill-primary text-primary size-4" />
                {ratingStats.avgRating.toFixed(1)}
                <span className="text-muted-foreground font-normal">
                  ({ratingStats.reviewCount}{" "}
                  {ratingStats.reviewCount === 1 ? "відгук" : "відгуків"})
                </span>
              </p>
            )}
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <MapPin className="size-4" />
              {staff.location.city}, {staff.location.address}
            </p>
            {categoryNames.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {categoryNames.map((name) => (
                  <span
                    key={name}
                    className="bg-accent text-accent-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >
                    <Sparkles className="size-3" />
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {staff.bio && (
          <p className="border-primary/30 text-muted-foreground border-l-2 pl-4 italic">
            {staff.bio}
          </p>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="text-primary size-5" />
              Записатися
            </CardTitle>
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
      </div>
    </main>
  );
}
