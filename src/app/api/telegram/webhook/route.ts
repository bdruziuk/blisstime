import { NextResponse } from "next/server";
import { handleUpdate } from "@/features/telegram/handle-update";

// Telegram delivers updates here in production (set via setWebhook). If a
// webhook secret is configured, Telegram echoes it in this header — we reject
// anything that doesn't match so only Telegram can drive the bot.
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

export async function POST(request: Request) {
  if (SECRET) {
    const got = request.headers.get("x-telegram-bot-api-secret-token");
    if (got !== SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: unknown;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await handleUpdate(update as Parameters<typeof handleUpdate>[0]);
  } catch (err) {
    // Always 200 so Telegram doesn't retry-storm a bug; we log for ourselves.
    console.error("[telegram] webhook handler error:", err);
  }

  return NextResponse.json({ ok: true });
}
