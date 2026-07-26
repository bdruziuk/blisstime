// Thin Telegram Bot API client (fetch-based, no SDK dependency). All calls
// are best-effort: if the token is missing or Telegram errors, we log and
// return null rather than throwing, so a bot hiccup never breaks a booking.

const API_BASE = "https://api.telegram.org";

function token(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

export const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME?.trim() || "EasyServiceBookingBot";

export type InlineButton = { text: string; callback_data?: string; url?: string };

async function call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T | null> {
  const t = token();
  if (!t) {
    console.warn(`[telegram] ${method} skipped: TELEGRAM_BOT_TOKEN not set`);
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}/bot${t}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error(`[telegram] ${method} failed:`, data.description);
      return null;
    }
    return data.result as T;
  } catch (err) {
    console.error(`[telegram] ${method} error:`, err);
    return null;
  }
}

export function tgSendMessage(
  chatId: string | number,
  text: string,
  inlineKeyboard?: InlineButton[][]
) {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(inlineKeyboard ? { reply_markup: { inline_keyboard: inlineKeyboard } } : {}),
  });
}

export function tgAnswerCallbackQuery(callbackQueryId: string, text?: string) {
  return call("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

/** Replaces a message's text and drops its buttons — used after the master acts. */
export function tgEditMessageText(chatId: string | number, messageId: number, text: string) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [] },
  });
}
