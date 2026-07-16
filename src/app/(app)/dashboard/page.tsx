import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, Scissors, MapPin, ArrowUpRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({
    where: { userId: session.user.id },
    include: { services: true, location: true },
  });
  if (!staff) redirect("/register");
  if (!staff.onboardedAt) redirect("/onboarding/profile");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-heading text-3xl font-bold">Привіт, {staff.displayName}!</h1>
        <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5">
          <MapPin className="size-4" />
          {staff.location.city}, {staff.location.address}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="card-hover">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <Globe className="size-4" />
                Публічна сторінка
              </p>
              <Link
                href={`/@${staff.username}`}
                className="text-primary mt-1.5 flex items-center gap-1 font-semibold"
              >
                /@{staff.username}
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-5">
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Scissors className="size-4" />
              Послуг додано
            </p>
            <p className="mt-1.5 text-2xl font-bold">{staff.services.length}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
