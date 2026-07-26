import { NextResponse } from "next/server";
import { sendDueMasterReminders } from "@/features/telegram/reminders";

// Triggered by a scheduler (e.g. Vercel Cron, hourly). Protected by a shared
// secret so it can't be invoked by anyone. Configure CRON_SECRET in the env
// and call with ?key=<secret> or an Authorization: Bearer <secret> header.
const SECRET = process.env.CRON_SECRET?.trim();

function authorized(request: Request): boolean {
  if (!SECRET) return true; // no secret configured (dev) — allow
  const url = new URL(request.url);
  if (url.searchParams.get("key") === SECRET) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${SECRET}`;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const sent = await sendDueMasterReminders();
  return NextResponse.json({ ok: true, sent });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
