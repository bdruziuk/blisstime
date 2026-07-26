import { prisma } from "@/lib/prisma";
import { tgSendMessage } from "@/lib/telegram";
import { formatBookingWhen, escapeHtml } from "./handle-update";

const DAY_MS = 24 * 60 * 60 * 1000;

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
