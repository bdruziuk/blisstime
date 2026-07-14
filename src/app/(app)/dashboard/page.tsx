import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold">Привіт, {staff.displayName}!</h1>
      <Link href={`/@${staff.username}`} className="text-muted-foreground underline">
        Ваша публічна сторінка: /@{staff.username}
      </Link>
      <p className="text-muted-foreground">
        {staff.location.city}, {staff.location.address}
      </p>
      <p className="text-muted-foreground">Послуг додано: {staff.services.length}</p>
    </main>
  );
}
