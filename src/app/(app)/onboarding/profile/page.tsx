import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/features/booking/components/profile-form";

export default async function OnboardingProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({
    where: { userId: session.user.id },
  });
  if (!staff) redirect("/register");

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Крок 1/3 — Профіль</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultDisplayName={staff.displayName}
            defaultUsername={staff.username}
            defaultBio={staff.bio ?? ""}
          />
        </CardContent>
      </Card>
    </main>
  );
}
