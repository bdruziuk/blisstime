import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";

const schema = z.object({
  items: z.array(z.object({
    id: z.string().min(1),
    kind: z.enum(["manual", "imported_unowned", "imported_owned"]),
  })).min(1).max(500),
});

export async function POST(request: Request) {
  if (!(await getSuperAdminUser())) return unauthorized();
  try {
    const { items } = schema.parse(await request.json());
    const importedIds = [...new Set(items.filter((item) => item.kind !== "manual").map((item) => item.id))];
    const staffIds = [...new Set(items.filter((item) => item.kind === "manual").map((item) => item.id))];
    const claimed = importedIds.length
      ? await prisma.importedBusiness.findMany({ where: { id: { in: importedIds } }, select: { claimedByStaffId: true } })
      : [];
    for (const item of claimed) if (item.claimedByStaffId) staffIds.push(item.claimedByStaffId);

    const [imported, staff] = await prisma.$transaction([
      prisma.importedBusiness.updateMany({
        where: { id: { in: importedIds } },
        data: { publicationStatus: "PUBLISHED" },
      }),
      prisma.staff.updateMany({
        where: { id: { in: [...new Set(staffIds)] } },
        data: { isPublished: true },
      }),
    ]);
    return NextResponse.json({ publishedCount: imported.count + staff.count });
  } catch (error) {
    return apiError(error);
  }
}
