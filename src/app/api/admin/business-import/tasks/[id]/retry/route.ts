import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getSuperAdminUser();
  if (!admin) return unauthorized();
  try {
    const task = await prisma.businessImportTask.findUnique({ where: { id: (await context.params).id } });
    if (!task) return NextResponse.json({ error: "Task не знайдено" }, { status: 404 });
    if (task.status !== "FAILED") {
      return NextResponse.json({ error: "Повторно запустити можна лише failed task" }, { status: 409 });
    }
    await prisma.$transaction([
      prisma.businessImportTask.update({
        where: { id: task.id },
        data: {
          status: "PENDING",
          attempts: 0,
          errorMessage: null,
          lockedAt: null,
          startedAt: null,
          completedAt: null,
        },
      }),
      prisma.businessImportJob.update({
        where: { id: task.jobId },
        data: {
          status: "RUNNING",
          completedAt: null,
          completedTasks: { decrement: 1 },
          failedCount: { decrement: 1 },
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
