import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { unauthorized } from "@/features/business-import/api-response";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getSuperAdminUser();
  if (!admin) return unauthorized();
  const { id } = await context.params;
  const job = await prisma.businessImportJob.findUnique({
    where: { id },
    include: {
      city: true,
      createdBy: { select: { name: true, email: true } },
      tasks: { orderBy: [{ depth: "asc" }, { createdAt: "asc" }] },
      results: {
        orderBy: { updatedAt: "desc" },
        include: { business: true },
      },
    },
  });
  if (!job) return NextResponse.json({ error: "Імпорт не знайдено" }, { status: 404 });
  const businesses = job.results.map((result) => result.business);
  return NextResponse.json({ job, businesses });
}
