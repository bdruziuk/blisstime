"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BOT_USERNAME } from "@/lib/telegram";

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/register");
  return staff;
}

/** Issues a fresh one-time link token and returns the t.me deep link. */
export async function generateTelegramLink(): Promise<{ url: string }> {
  const staff = await requireStaff();
  const token = randomUUID();
  await prisma.staff.update({
    where: { id: staff.id },
    data: { telegramLinkToken: token },
  });
  return { url: `https://t.me/${BOT_USERNAME}?start=${token}` };
}

export async function disconnectTelegram(): Promise<void> {
  const staff = await requireStaff();
  await prisma.staff.update({
    where: { id: staff.id },
    data: { telegramChatId: null, telegramLinkToken: null },
  });
  revalidatePath("/dashboard/settings");
}
