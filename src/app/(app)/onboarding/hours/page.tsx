import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoursForm } from "@/features/booking/components/hours-form";

export default async function OnboardingHoursPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({
    where: { userId: session.user.id },
    include: { services: true },
  });
  if (!staff) redirect("/register");
  if (staff.services.length === 0) redirect("/onboarding/services");

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Крок 3/3 — Робочі години</CardTitle>
        </CardHeader>
        <CardContent>
          <HoursForm />
        </CardContent>
      </Card>
    </main>
  );
}
