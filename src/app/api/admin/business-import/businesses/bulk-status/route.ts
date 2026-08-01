import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  status: z.enum(["PUBLISHED", "REJECTED"]),
});

export async function POST(request: Request) {
  if (!(await getSuperAdminUser())) return unauthorized();
  try {
    const input = schema.parse(await request.json());
    const result = await prisma.importedBusiness.updateMany({
      where: { id: { in: [...new Set(input.ids)] } },
      data: { publicationStatus: input.status },
    });
    return NextResponse.json({ updatedCount: result.count });
  } catch (error) {
    return apiError(error);
  }
}
