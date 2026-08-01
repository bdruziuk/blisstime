import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { GooglePlacesError } from "./providers/google-places";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Некоректні дані" }, { status: 400 });
  }
  if (error instanceof GooglePlacesError) {
    return NextResponse.json({ error: error.message }, { status: error.status >= 500 ? 502 : error.status });
  }
  const message = error instanceof Error ? error.message : "Внутрішня помилка";
  const conflict = /вже виконується|ліміт активних/.test(message);
  console.error(JSON.stringify({ event: "business_import_api_error", error: message.slice(0, 500) }));
  return NextResponse.json({ error: message.slice(0, 500) }, { status: conflict ? 409 : 500 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Недостатньо прав" }, { status: 403 });
}
