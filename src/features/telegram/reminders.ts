import { prisma } from "@/lib/prisma";
import { tgSendMessage } from "@/lib/telegram";
import { formatBookingWhen, escapeHtml } from "./handle-update";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

function isPublicUrl(url: string): boolean {
  return /^https?:\/\//.test(url) && !/localhost|127\.0\.0\.1/.test(url);
}

function serviceNamesOf(b: {
  services: { service: { displayName: string } }[];
  service: { displayName: string };
}): string {
  return b.services.length > 0
    ? b.services.map((s) => s.service.displayName).join(" + ")
    : b.service.displayName;
}

/**
 * Sends the master a heads-up for confirmed bookings starting within the next
 * 24 hours that haven't been reminded yet. Idempotent via masterReminderSentAt,
 * so it's safe to run hourly (or more often). Returns how many were sent.
 */
export async function sendDueMasterReminders(now: Date = new Date()): Promise<number> {
  const windowEnd = new Date(now.getTime() + DAY_MS);

  const due = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      masterReminderSentAt: null,
      slotStart: { gt: now, lte: windowEnd },
      staff: { telegramChatId: { not: null } },
    },
    include: {
      staff: true,
      client: true,
      services: { include: { service: true } },
      service: true,
    },
  });

  let sent = 0;
  for (const booking of due) {
    const chatId = booking.staff.telegramChatId;
    if (!chatId) continue;

    const who = escapeHtml(booking.client.name ?? booking.client.phone);
    const phone = escapeHtml(booking.client.phone);
    const when = formatBookingWhen(booking.slotStart);
    const serviceNames =
      booking.services.length > 0
        ? booking.services.map((s) => s.service.displayName).join(" + ")
        : booking.service.displayName;

    await tgSendMessage(
      chatId,
      `⏰ <b>Нагадування</b>\nЗавтра запис:\n${who} (${phone})\n${escapeHtml(serviceNames)}\n🕐 ${when}`
    );
    await prisma.booking.update({
      where: { id: booking.id },
      data: { masterReminderSentAt: new Date() },
    });
    sent += 1;
  }

  return sent;
}

/**
 * Sends the client a reminder 24h and again 1h before a confirmed visit
 * (only if they linked Telegram). Each nudge is deduped via its own flag, so
 * running hourly fires the 24h one first and the 1h one near the visit.
 */
export async function sendDueClientReminders(now: Date = new Date()): Promise<number> {
  const include = {
    staff: true,
    client: true,
    services: { include: { service: true } },
    service: true,
  } as const;

  const [due24, due1] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        clientReminder24SentAt: null,
        slotStart: { gt: now, lte: new Date(now.getTime() + DAY_MS) },
        client: { telegramChatId: { not: null } },
      },
      include,
    }),
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        clientReminder1SentAt: null,
        slotStart: { gt: now, lte: new Date(now.getTime() + HOUR_MS) },
        client: { telegramChatId: { not: null } },
      },
      include,
    }),
  ]);

  let sent = 0;

  for (const booking of due24) {
    const chatId = booking.client.telegramChatId;
    if (!chatId) continue;
    await tgSendMessage(
      chatId,
      `⏰ <b>Нагадування</b>\nЗавтра ваш візит до ${escapeHtml(booking.staff.displayName)}\n` +
        `${escapeHtml(serviceNamesOf(booking))}\n🕐 ${formatBookingWhen(booking.slotStart)}`
    );
    await prisma.booking.update({
      where: { id: booking.id },
      data: { clientReminder24SentAt: new Date() },
    });
    sent += 1;
  }

  for (const booking of due1) {
    const chatId = booking.client.telegramChatId;
    if (!chatId) continue;
    await tgSendMessage(
      chatId,
      `⏰ <b>Вже за годину</b>\nВізит до ${escapeHtml(booking.staff.displayName)}\n` +
        `${escapeHtml(serviceNamesOf(booking))}\n🕐 ${formatBookingWhen(booking.slotStart)}`
    );
    await prisma.booking.update({
      where: { id: booking.id },
      data: { clientReminder1SentAt: new Date() },
    });
    sent += 1;
  }

  return sent;
}

/**
 * Camback: nudges the client to rebook N weeks after a completed visit, where
 * N is the primary service's rebookReminderWeeks. Services with no interval set
 * are never reminded. Deduped via rebookReminderSentAt.
 */
export async function sendDueRebookReminders(now: Date = new Date()): Promise<number> {
  const candidates = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      rebookReminderSentAt: null,
      client: { telegramChatId: { not: null } },
      service: { rebookReminderWeeks: { not: null } },
    },
    include: { staff: true, client: true, service: true },
  });

  let sent = 0;
  for (const booking of candidates) {
    const weeks = booking.service.rebookReminderWeeks;
    if (!weeks) continue;
    const dueAt = booking.slotStart.getTime() + weeks * 7 * DAY_MS;
    if (dueAt > now.getTime()) continue;

    const chatId = booking.client.telegramChatId;
    if (!chatId) continue;

    const bookUrl = `${APP_URL}/@${booking.staff.username}`;
    const text =
      `💛 Час оновити «${escapeHtml(booking.service.displayName)}»?\n` +
      `Запишіться до ${escapeHtml(booking.staff.displayName)} на зручний час.`;
    if (isPublicUrl(bookUrl)) {
      await tgSendMessage(chatId, text, [[{ text: "Записатися", url: bookUrl }]]);
    } else {
      await tgSendMessage(chatId, `${text}\n${bookUrl}`);
    }
    await prisma.booking.update({
      where: { id: booking.id },
      data: { rebookReminderSentAt: new Date() },
    });
    sent += 1;
  }

  return sent;
}
