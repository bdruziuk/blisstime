import { prisma } from "@/lib/prisma";
import { tgSendMessage } from "@/lib/telegram";
import { formatBookingWhen, escapeHtml } from "./handle-update";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Notifies the master about a freshly created booking. PENDING requests get
 * inline confirm/decline buttons (one-tap, no login); auto-confirmed ones get
 * a plain heads-up. Best-effort — never throws into the booking flow.
 */
export async function notifyMasterNewBooking(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      staff: true,
      client: true,
      services: { include: { service: true } },
      service: true,
    },
  });
  if (!booking || !booking.staff.telegramChatId) return;

  const chatId = booking.staff.telegramChatId;
  const who = escapeHtml(booking.client.name ?? booking.client.phone);
  const phone = escapeHtml(booking.client.phone);
  const when = formatBookingWhen(booking.slotStart);
  const serviceNames =
    booking.services.length > 0
      ? booking.services.map((s) => s.service.displayName).join(" + ")
      : booking.service.displayName;

  if (booking.status === "PENDING") {
    const text =
      `🆕 <b>Нова заявка</b>\n` +
      `${who} (${phone})\n` +
      `${escapeHtml(serviceNames)}\n` +
      `🕐 ${when}`;
    await tgSendMessage(chatId, text, [
      [
        { text: "✅ Підтвердити", callback_data: `confirm:${booking.id}` },
        { text: "❌ Відхилити", callback_data: `decline:${booking.id}` },
      ],
      [{ text: "🕐 Інший час", url: `${APP_URL}/dashboard/bookings` }],
    ]);
  } else if (booking.status === "CONFIRMED") {
    const text =
      `✅ <b>Новий запис</b> (підтверджено автоматично)\n` +
      `${who} (${phone})\n` +
      `${escapeHtml(serviceNames)}\n` +
      `🕐 ${when}`;
    await tgSendMessage(chatId, text);
  }
}
