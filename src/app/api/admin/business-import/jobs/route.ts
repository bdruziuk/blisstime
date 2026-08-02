import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { createImportJob } from "@/features/business-import/services/job-service";
import { createImportJobSchema } from "@/features/business-import/validation/schemas";

export async function GET(request: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return unauthorized();
  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);
  const limit = Math.min(5, Math.max(1, Number(url.searchParams.get("limit") ?? 1) || 1));
  const [jobs, total] = await Promise.all([
    prisma.businessImportJob.findMany({
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        city: true,
        createdBy: { select: { name: true, email: true } },
      },
    }),
    prisma.businessImportJob.count(),
  ]);
  return NextResponse.json({ jobs, total, hasMore: offset + jobs.length < total });
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
