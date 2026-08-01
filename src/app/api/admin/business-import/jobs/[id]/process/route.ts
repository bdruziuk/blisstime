import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { processImportTasks } from "@/features/business-import/workers/business-import-worker";
import { processImportJobSchema } from "@/features/business-import/validation/schemas";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getSuperAdminUser();
  if (!admin) return unauthorized();
  try {
    const raw = await request.json().catch(() => ({}));
    const input = processImportJobSchema.parse(raw);
    return NextResponse.json(await processImportTasks({ jobId: (await context.params).id, limit: input.limit }));
  } catch (error) {
    return apiError(error);
  }
}
