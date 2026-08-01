import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { revalidatePath } from "next/cache";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  status: z.enum(["PUBLISHED", "REJECTED"]),
});

export async function POST(request: Request) {
  if (!(await getSuperAdminUser())) return unauthorized();
  try {
    const input = schema.parse(await request.json());
    const ids = [...new Set(input.ids)];
    const existing = await prisma.importedBusiness.findMany({ where: { id: { in: ids } }, select: { id: true } });
    if (!existing.length) return NextResponse.json({ error: "Вибрані салони не знайдено" }, { status: 404 });
    const result = await prisma.importedBusiness.updateMany({
      where: { id: { in: existing.map((business) => business.id) } },
      data: { publicationStatus: input.status },
    });
    revalidatePath("/", "layout");
    revalidatePath("/search");
    return NextResponse.json({ updatedCount: result.count, requestedCount: ids.length, status: input.status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
