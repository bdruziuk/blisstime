import { prisma } from "@/lib/prisma";
import { tgSendMessage, type InlineButton } from "@/lib/telegram";
import { formatBookingWhen, escapeHtml } from "./handle-update";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Telegram rejects inline-button URLs pointing at localhost/127.0.0.1, so we
// only attach the "other time" link when the app is on a real public host.
function isPublicUrl(url: string): boolean {
  return /^https?:\/\//.test(url) && !/localhost|127\.0\.0\.1/.test(url);
}

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
    const keyboard: InlineButton[][] = [
      [
        { text: "✅ Підтвердити", callback_data: `confirm:${booking.id}` },
        { text: "❌ Відхилити", callback_data: `decline:${booking.id}` },
      ],
    ];
    const dashboardUrl = `${APP_URL}/dashboard/bookings`;
    if (isPublicUrl(dashboardUrl)) {
      keyboard.push([{ text: "🕐 Інший час", url: dashboardUrl }]);
    }
    await tgSendMessage(chatId, text, keyboard);
  } else if (booking.status === "CONFIRMED") {
    const text =
      `✅ <b>Новий запис</b> (підтверджено автоматично)\n` +
      `${who} (${phone})\n` +
      `${escapeHtml(serviceNames)}\n` +
      `🕐 ${when}`;
    await tgSendMessage(chatId, text);
  }
}

async function bookingForClientMessage(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      staff: true,
      client: true,
      services: { include: { service: true } },
      service: true,
    },
  });
}

function serviceNamesOf(b: {
  services: { service: { displayName: string } }[];
  service: { displayName: string };
}): string {
  return b.services.length > 0
    ? b.services.map((s) => s.service.displayName).join(" + ")
    : b.service.displayName;
}

/** Tells the client their booking was confirmed (if they linked Telegram). */
export async function notifyClientBookingConfirmed(bookingId: string): Promise<void> {
  const booking = await bookingForClientMessage(bookingId);
  if (!booking?.client.telegramChatId) return;

  const when = formatBookingWhen(booking.slotStart);
  await tgSendMessage(
    booking.client.telegramChatId,
    `✅ <b>Ваш запис підтверджено!</b>\n` +
      `${escapeHtml(booking.staff.displayName)}\n` +
      `${escapeHtml(serviceNamesOf(booking))}\n` +
      `🕐 ${when}\nДо зустрічі! 💛`
  );
}

/** Asks the client for a review after a completed visit (if they linked Telegram). */
export async function sendClientReviewRequest(bookingId: string): Promise<void> {
  const booking = await bookingForClientMessage(bookingId);
  if (!booking?.client.telegramChatId) return;

  const reviewUrl = `${APP_URL}/review/${booking.id}`;
  const text =
    `Дякуємо за візит до ${escapeHtml(booking.staff.displayName)}! 💛\n` +
    `Як вам ${escapeHtml(serviceNamesOf(booking))}? Залиште, будь ласка, відгук.`;

  if (isPublicUrl(reviewUrl)) {
    await tgSendMessage(booking.client.telegramChatId, text, [
      [{ text: "⭐ Залишити відгук", url: reviewUrl }],
    ]);
  } else {
    await tgSendMessage(booking.client.telegramChatId, `${text}\n${reviewUrl}`);
  }
}
