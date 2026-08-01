import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { createImportJob } from "@/features/business-import/services/job-service";
import { createImportJobSchema } from "@/features/business-import/validation/schemas";

export async function GET() {
  const admin = await getSuperAdminUser();
  if (!admin) return unauthorized();
  const jobs = await prisma.businessImportJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      city: true,
      createdBy: { select: { name: true, email: true } },
    },
  });
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return unauthorized();
  try {
    const input = createImportJobSchema.parse(await request.json());
    const job = await createImportJob({ ...input, createdById: admin.id });
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
