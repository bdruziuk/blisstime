"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "./phone";
import { getDayBoundsUTC } from "./slots";
import { BOT_USERNAME } from "@/lib/telegram";

export type WaitlistState =
  | { error: string }
  | { success: true; telegramDeepLink: string | null }
  | undefined;

/**
 * Puts a client on a staff member's waitlist for a given day. When a slot on
 * that day later frees up (a cancellation/decline), the bot offers it to
 * everyone waiting. Notifications go via Telegram, so we return a connect link
 * unless the client is already linked.
 */
export async function joinWaitlist(
  _prevState: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const staffId = String(formData.get("staffId") || "");
  const dateISO = String(formData.get("dateISO") || "");
  const clientName = String(formData.get("clientName") || "").trim();
  const clientPhone = String(formData.get("clientPhone") || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return { error: "Некоректна дата" };
  if (clientName.length < 2) return { error: "Вкажіть ім'я" };

  const phone = normalizePhone(clientPhone);
  if (!phone) return { error: "Некоректний номер телефону" };

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) return { error: "Майстра не знайдено" };

  const { start, end } = getDayBoundsUTC(dateISO);

  const client = await prisma.client.upsert({
    where: { phone },
    update: { name: clientName },
    create: { phone, name: clientName },
  });

  // Avoid duplicate waitlist rows for the same client/staff/day.
  const existing = await prisma.waitlistEntry.findFirst({
    where: { clientId: client.id, staffId, desiredFrom: start, desiredTo: end },
  });
  if (!existing) {
    await prisma.waitlistEntry.create({
      data: { clientId: client.id, staffId, desiredFrom: start, desiredTo: end },
    });
  }

  let telegramDeepLink: string | null = null;
  if (!client.telegramChatId) {
    const token = `c_${randomUUID()}`;
    await prisma.client.update({ where: { id: client.id }, data: { telegramLinkToken: token } });
    telegramDeepLink = `https://t.me/${BOT_USERNAME}?start=${token}`;
  }

  return { success: true, telegramDeepLink };
}
