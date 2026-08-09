import { prisma } from "@/lib/prisma";
import { BUSINESS_TIMEZONE } from "@/features/booking/slots";
import { tgSendMessage, tgAnswerCallbackQuery, tgEditMessageText } from "@/lib/telegram";

// Minimal shapes of the Telegram update fields we use.
type TgUpdate = {
  message?: { chat: { id: number }; text?: string };
  callback_query?: {
    id: string;
    data?: string;
    message?: { chat: { id: number }; message_id: number };
  };
};

export function formatBookingWhen(slotStart: Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: BUSINESS_TIMEZONE,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(slotStart);
}

/** Framework-agnostic entry point shared by the webhook route and the dev poller. */
export async function handleUpdate(update: TgUpdate): Promise<void> {
  if (update.message?.text) {
    await handleMessage(update.message.chat.id, update.message.text);
    return;
  }
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }
}

async function handleMessage(chatId: number, text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("/start")) {
    const linkToken = trimmed.split(/\s+/)[1];
    if (!linkToken) {
      await tgSendMessage(
        chatId,
        "Вітаємо! Щоб підключити кабінет, натисніть кнопку «Підключити Telegram» у налаштуваннях Get Node."
      );
      return;
    }

    // Client link tokens are prefixed "c_"; anything else is a master token.
    if (linkToken.startsWith("c_")) {
      const client = await prisma.client.findUnique({ where: { telegramLinkToken: linkToken } });
      if (!client) {
        await tgSendMessage(chatId, "Посилання недійсне або застаріле.");
        return;
      }
      await prisma.client.update({
        where: { id: client.id },
        data: { telegramChatId: String(chatId), telegramLinkToken: null },
      });
      await tgSendMessage(
        chatId,
        "✅ Готово! Тут ви отримаєте підтвердження запису, нагадування та запит відгуку."
      );
      return;
    }

    const staff = await prisma.staff.findUnique({ where: { telegramLinkToken: linkToken } });
    if (!staff) {
      await tgSendMessage(chatId, "Посилання недійсне або застаріле. Згенеруйте нове в налаштуваннях.");
      return;
    }

    // Consume the token so the link can't be reused to hijack notifications.
    await prisma.staff.update({
      where: { id: staff.id },
      data: { telegramChatId: String(chatId), telegramLinkToken: null },
    });
    await tgSendMessage(
      chatId,
      `✅ Кабінет <b>${escapeHtml(staff.displayName)}</b> підключено. Сюди надходитимуть нові заявки й нагадування.`
    );
    return;
  }

  await tgSendMessage(chatId, "Я надсилаю заявки на запис і нагадування. Керуйте кабінетом у Get Node.");
}

async function handleCallback(cb: NonNullable<TgUpdate["callback_query"]>) {
  const chatId = cb.message?.chat.id;
  const messageId = cb.message?.message_id;
  const [action, bookingId] = (cb.data ?? "").split(":");

  if (!chatId || !messageId || !bookingId || (action !== "confirm" && action !== "decline")) {
    await tgAnswerCallbackQuery(cb.id);
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { staff: true, client: true },
  });

  // Authorize purely by the chat the tap came from — only the linked master's
  // chat may act on their own bookings.
  if (!booking || booking.staff.telegramChatId !== String(chatId)) {
    await tgAnswerCallbackQuery(cb.id, "Немає доступу до цього запису");
    return;
  }

  if (booking.status !== "PENDING") {
    await tgAnswerCallbackQuery(cb.id, "Заявку вже опрацьовано");
    await tgEditMessageText(chatId, messageId, statusLine(booking.status, booking));
    return;
  }

  const when = formatBookingWhen(booking.slotStart);
  const who = booking.client.name ?? booking.client.phone;

  if (action === "confirm") {
    await prisma.booking.updateMany({
      where: { id: booking.id, status: "PENDING" },
      data: { status: "CONFIRMED", respondedAt: new Date(), holdExpiresAt: null },
    });
    await tgAnswerCallbackQuery(cb.id, "Підтверджено ✅");
    await tgEditMessageText(chatId, messageId, `✅ <b>Підтверджено</b>\n${who} — ${when}`);
    // Let the client know too (if they linked Telegram).
    try {
      const { notifyClientBookingConfirmed } = await import("./notify");
      await notifyClientBookingConfirmed(booking.id);
    } catch (err) {
      console.error("[telegram] client confirm notify failed:", err);
    }
  } else {
    await prisma.booking.updateMany({
      where: { id: booking.id, status: "PENDING" },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
    await tgAnswerCallbackQuery(cb.id, "Відхилено");
    await tgEditMessageText(chatId, messageId, `❌ <b>Відхилено</b>\n${who} — ${when}`);
    // Offer the freed slot to the waitlist.
    if (booking.slotStart > new Date()) {
      try {
        const { notifyWaitlistForFreedSlot } = await import("./notify");
        await notifyWaitlistForFreedSlot(booking.staffId, booking.slotStart);
      } catch (err) {
        console.error("[telegram] waitlist notify failed:", err);
      }
    }
  }
}

function statusLine(
  status: string,
  booking: { slotStart: Date; client: { name: string | null; phone: string } }
): string {
  const when = formatBookingWhen(booking.slotStart);
  const who = booking.client.name ?? booking.client.phone;
  const label =
    status === "CONFIRMED" ? "✅ Підтверджено" : status === "DECLINED" ? "❌ Відхилено" : status;
  return `${label}\n${who} — ${when}`;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
