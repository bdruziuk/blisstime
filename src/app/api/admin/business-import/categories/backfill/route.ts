import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { mergeNameCategories } from "@/features/business-import/services/name-category-classifier";

const BATCH_SIZE = 200;
const UPDATE_CONCURRENCY = 20;

export async function POST(request: NextRequest) {
  if (!(await getSuperAdminUser())) return unauthorized();
  try {
    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const businesses = await prisma.importedBusiness.findMany({
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, name: true, categories: true },
    });
    const updates = businesses.flatMap((business) => {
      const current = Array.isArray(business.categories) ? business.categories.filter((value): value is string => typeof value === "string") : [];
      const categories = mergeNameCategories(business.name, current);
      return categories.length === current.length ? [] : [{ id: business.id, categories }];
    });
    let updated = 0;
    const failures: Array<{ id: string; error: string }> = [];
    for (let offset = 0; offset < updates.length; offset += UPDATE_CONCURRENCY) {
      const chunk = updates.slice(offset, offset + UPDATE_CONCURRENCY);
      const results = await Promise.allSettled(chunk.map((item) => prisma.importedBusiness.update({ where: { id: item.id }, data: { categories: item.categories } })));
      results.forEach((result, index) => {
        if (result.status === "fulfilled") updated += 1;
        else failures.push({ id: chunk[index].id, error: result.reason instanceof Error ? result.reason.message : String(result.reason) });
      });
    }
    const done = businesses.length < BATCH_SIZE;
    return NextResponse.json({ scanned: businesses.length, updated, failed: failures.length, failures, nextCursor: done ? null : businesses.at(-1)?.id ?? null, done });
  } catch (error) {
    return apiError(error);
  }
}
