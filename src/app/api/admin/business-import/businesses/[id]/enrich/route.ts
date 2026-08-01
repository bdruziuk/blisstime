import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { enrichImportedBusiness } from "@/features/business-import/services/business-enrichment";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getSuperAdminUser())) return unauthorized();
  try {
    const { id } = await context.params;
    const business = await enrichImportedBusiness(id);
    return NextResponse.json({ business });
  } catch (error) {
    return apiError(error);
  }
}
