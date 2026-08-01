import { NextResponse } from "next/server";
import { processImportTasks } from "@/features/business-import/workers/business-import-worker";

const SECRET = process.env.CRON_SECRET?.trim();

function authorized(request: Request) {
  if (!SECRET) return process.env.NODE_ENV !== "production";
  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${SECRET}` || new URL(request.url).searchParams.get("key") === SECRET;
}

async function run(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await processImportTasks({}));
}

export const GET = run;
export const POST = run;
