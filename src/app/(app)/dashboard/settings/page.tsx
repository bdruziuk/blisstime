import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/features/booking/components/settings-form";
import { ScheduleBlocksPanel } from "@/features/booking/components/schedule-blocks-panel";
import { TelegramConnect } from "@/features/telegram/components/telegram-connect";
import { LocationForm } from "@/features/booking/components/location-form";
import { AvatarUpload } from "@/features/booking/components/avatar-upload";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({
    where: { userId: session.user.id },
    include: { location: true },
  });
  if (!staff) redirect("/register");
  if (!staff.onboardedAt) redirect("/onboarding/profile");

  const blocks = await prisma.scheduleBlock.findMany({
    where: { staffId: staff.id, endsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });
  const avatar = await prisma.staffAvatar.findUnique({ where: { staffId: staff.id }, select: { updatedAt: true } });

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-10">
      <Card>
        <CardHeader><CardTitle>Фото профілю</CardTitle></CardHeader>
        <CardContent>
          <AvatarUpload username={staff.username} initialAvatarUrl={avatar ? `/api/avatar/${encodeURIComponent(staff.username)}?v=${avatar.updatedAt.getTime()}` : null} />
        </CardContent>
      </Card>
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

      <Card>
        <CardHeader>
          <CardTitle>Локація</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationForm
            defaultCity={staff.location.city}
            defaultAddress={staff.location.address}
            defaultDistrict={staff.location.district ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram-сповіщення</CardTitle>
        </CardHeader>
        <CardContent>
          <TelegramConnect connected={Boolean(staff.telegramChatId)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Вихідні та перерви</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleBlocksPanel
            blocks={blocks.map((b) => ({
              id: b.id,
              startsAtISO: b.startsAt.toISOString(),
              endsAtISO: b.endsAt.toISOString(),
              reason: b.reason,
            }))}
          />
        </CardContent>
      </Card>
    </main>
  );
}
