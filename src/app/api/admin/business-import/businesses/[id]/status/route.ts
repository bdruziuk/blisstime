import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { importedBusinessStatusSchema } from "@/features/business-import/validation/schemas";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getSuperAdminUser();
  if (!admin) return unauthorized();
  try {
    const input = importedBusinessStatusSchema.parse(await request.json());
    const business = await prisma.importedBusiness.update({
      where: { id: (await context.params).id },
      data: { publicationStatus: input.status },
    });
    return NextResponse.json({ business });
  } catch (error) {
    return apiError(error);
  }
}
