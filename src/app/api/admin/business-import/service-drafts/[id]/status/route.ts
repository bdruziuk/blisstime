import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";

const schema = z.object({ status: z.enum(["APPROVED", "REJECTED", "PENDING_REVIEW"]) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getSuperAdminUser())) return unauthorized();
  try {
    const { id } = await context.params;
    const { status } = schema.parse(await request.json());
    const draft = await prisma.importedBusinessServiceDraft.update({ where: { id }, data: { status } });
    return NextResponse.json({ draft });
  } catch (error) {
    return apiError(error);
  }
}
