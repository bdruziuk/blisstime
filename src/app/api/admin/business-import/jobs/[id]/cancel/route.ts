import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { cancelImportJob } from "@/features/business-import/services/job-service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getSuperAdminUser();
  if (!admin) return unauthorized();
  try {
    const job = await cancelImportJob((await context.params).id);
    if (!job) return NextResponse.json({ error: "Імпорт не знайдено" }, { status: 404 });
    return NextResponse.json({ job });
  } catch (error) {
    return apiError(error);
  }
}
