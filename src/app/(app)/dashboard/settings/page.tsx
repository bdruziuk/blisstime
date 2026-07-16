import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/features/booking/components/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/register");
  if (!staff.onboardedAt) redirect("/onboarding/profile");

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Налаштування записів</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            defaultConfirmationMode={staff.confirmationMode}
            defaultHoldDurationMinutes={staff.holdDurationMinutes}
          />
        </CardContent>
      </Card>
    </main>
  );
}
