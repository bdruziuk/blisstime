"use server";

import { randomUUID } from "crypto";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "./phone";
import { BUSINESS_TIMEZONE } from "./slots";
import { BOT_USERNAME } from "@/lib/telegram";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

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
  const dateFrom = String(formData.get("dateFrom") || "");
  const dateToRaw = String(formData.get("dateTo") || "").trim();
  const dateTo = dateToRaw || dateFrom;
  const timeFromRaw = String(formData.get("timeFrom") || "").trim();
  const timeToRaw = String(formData.get("timeTo") || "").trim();
  const clientName = String(formData.get("clientName") || "").trim();
  const clientPhone = String(formData.get("clientPhone") || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    return { error: "Некоректна дата" };
  }
  if (dateTo < dateFrom) return { error: "Кінцева дата раніше за початкову" };
  if (clientName.length < 2) return { error: "Вкажіть ім'я" };

  // Optional time window within the day span; default is the whole day.
  const timeFrom = timeFromRaw || "00:00";
  const timeTo = timeToRaw || "23:59";
  if (!TIME_REGEX.test(timeFrom) || !TIME_REGEX.test(timeTo)) {
    return { error: "Некоректний час" };
  }

  const phone = normalizePhone(clientPhone);
  if (!phone) return { error: "Некоректний номер телефону" };

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) return { error: "Майстра не знайдено" };

  // Continuous [desiredFrom, desiredTo] window the notify logic matches against.
  const desiredFrom = fromZonedTime(`${dateFrom}T${timeFrom}:00`, BUSINESS_TIMEZONE);
  const desiredTo = fromZonedTime(`${dateTo}T${timeTo}:00`, BUSINESS_TIMEZONE);
  if (desiredTo <= desiredFrom) return { error: "Кінець періоду має бути пізніше за початок" };

  const client = await prisma.client.upsert({
    where: { phone },
    update: { name: clientName },
    create: { phone, name: clientName },
  });

  // Avoid duplicate waitlist rows for the same client/staff/window.
  const existing = await prisma.waitlistEntry.findFirst({
    where: { clientId: client.id, staffId, desiredFrom, desiredTo },
  });
  if (!existing) {
    await prisma.waitlistEntry.create({
      data: { clientId: client.id, staffId, desiredFrom, desiredTo },
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
