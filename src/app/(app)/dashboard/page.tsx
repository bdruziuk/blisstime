import Link from "next/link";
import { redirect } from "next/navigation";
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
        <h1 className="font-heading text-3xl font-semibold">Привіт, {staff.displayName}!</h1>
        <p className="text-muted-foreground mt-1">
          {staff.location.city}, {staff.location.address}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-sm">Публічна сторінка</p>
            <Link
              href={`/@${staff.username}`}
              className="text-primary mt-1 block font-medium underline underline-offset-4"
            >
              /@{staff.username}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-sm">Послуг додано</p>
            <p className="mt-1 text-2xl font-semibold">{staff.services.length}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
