import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { mergeNameCategories } from "@/features/business-import/services/name-category-classifier";

const BATCH_SIZE = 200;

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
      return categories.length === current.length ? [] : [prisma.importedBusiness.update({ where: { id: business.id }, data: { categories } })];
    });
    if (updates.length) await prisma.$transaction(updates);
    const done = businesses.length < BATCH_SIZE;
    return NextResponse.json({ scanned: businesses.length, updated: updates.length, nextCursor: done ? null : businesses.at(-1)?.id ?? null, done });
  } catch (error) {
    return apiError(error);
  }
}
