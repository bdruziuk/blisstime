import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { isSuperAdminEmail } from "@/lib/super-admin";

const schema = z.object({ type: z.enum(["masters", "salons"]), ids: z.array(z.string().min(1)).min(1).max(500) });

export async function POST(request: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return unauthorized();
  try {
    const input = schema.parse(await request.json());
    const ids = [...new Set(input.ids)];
    if (input.type === "salons") {
      const result = await prisma.importedBusiness.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ deletedCount: result.count, skippedCount: ids.length - result.count });
    }

    const users = await prisma.user.findMany({ where: { id: { in: ids }, staff: { isNot: null } }, select: { id: true, email: true, staff: { select: { id: true, locationId: true, location: { select: { organizationId: true } } } } } });
    const deletable = users.filter((user) => user.id !== admin.id && !isSuperAdminEmail(user.email) && user.staff);
    await prisma.$transaction(async (tx) => {
      const staffIds = deletable.map((user) => user.staff!.id);
      if (staffIds.length) await tx.booking.deleteMany({ where: { staffId: { in: staffIds } } });
      if (deletable.length) await tx.user.deleteMany({ where: { id: { in: deletable.map((user) => user.id) } } });
      const locationIds = deletable.map((user) => user.staff!.locationId);
      if (locationIds.length) await tx.location.deleteMany({ where: { id: { in: locationIds }, staff: { none: {} } } });
      const organizationIds = deletable.map((user) => user.staff!.location.organizationId);
      if (organizationIds.length) await tx.organization.deleteMany({ where: { id: { in: organizationIds }, locations: { none: {} } } });
    });
    return NextResponse.json({ deletedCount: deletable.length, skippedCount: ids.length - deletable.length });
  } catch (error) {
    return apiError(error);
  }
}
