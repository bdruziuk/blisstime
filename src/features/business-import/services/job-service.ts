import { prisma } from "@/lib/prisma";
import { BEAUTY_IMPORT_CATEGORIES, getImportCategory, type BeautyImportCategoryKey } from "../config/categories";
import { IMPORT_CONFIG } from "../config/import-config";
import type { BusinessImportProvider } from "../domain/provider";
import { googlePlacesProvider } from "../providers/google-places";
import { buildGrid } from "./grid-builder";

const ACTIVE_STATUSES = ["PENDING", "RUNNING"] as const;

export async function createImportJob({
  cityExternalId,
  categories,
  includeDetails,
  createdById,
  provider = googlePlacesProvider,
}: {
  cityExternalId: string;
  categories: BeautyImportCategoryKey[];
  includeDetails: boolean;
  createdById: string;
  provider?: BusinessImportProvider;
}) {
  const uniqueCategories = [...new Set(categories)].sort();
  if (!uniqueCategories.every((key) => getImportCategory(key))) {
    throw new Error("Одна або кілька категорій не підтримуються");
  }
  const activeJobs = await prisma.businessImportJob.count({
    where: { status: { in: [...ACTIVE_STATUSES] } },
  });
  if (activeJobs >= IMPORT_CONFIG.maxActiveJobs) {
    throw new Error(`Досягнуто ліміт активних імпортів (${IMPORT_CONFIG.maxActiveJobs})`);
  }

  // Resolve server-side: client-supplied coordinates and viewport are never trusted.
  const resolved = await provider.resolveCity(cityExternalId);
  const city = await prisma.businessImportCity.upsert({
    where: { provider_externalId: { provider: resolved.provider, externalId: resolved.externalId } },
    update: {
      name: resolved.name,
      formattedName: resolved.formattedName,
      countryCode: resolved.countryCode,
      regionalCenter: resolved.regionalCenter,
      centerLat: resolved.centerLat,
      centerLng: resolved.centerLng,
      south: resolved.bounds.south,
      west: resolved.bounds.west,
      north: resolved.bounds.north,
      east: resolved.bounds.east,
    },
    create: {
      provider: resolved.provider,
      externalId: resolved.externalId,
      name: resolved.name,
      formattedName: resolved.formattedName,
      countryCode: resolved.countryCode,
      regionalCenter: resolved.regionalCenter,
      centerLat: resolved.centerLat,
      centerLng: resolved.centerLng,
      south: resolved.bounds.south,
      west: resolved.bounds.west,
      north: resolved.bounds.north,
      east: resolved.bounds.east,
    },
  });

  const existingJobs = await prisma.businessImportJob.findMany({
    where: { cityId: city.id, status: { in: [...ACTIVE_STATUSES] } },
    select: { categories: true },
  });
  const signature = JSON.stringify(uniqueCategories);
  if (existingJobs.some((job) => JSON.stringify([...(job.categories as string[])].sort()) === signature)) {
    throw new Error("Для цього міста й категорій уже виконується імпорт");
  }

  const areas = buildGrid(
    resolved.bounds,
    IMPORT_CONFIG.initialGridRows,
    IMPORT_CONFIG.initialGridColumns
  );
  const tasks = uniqueCategories.flatMap((key) => {
    const category = BEAUTY_IMPORT_CATEGORIES.find((item) => item.key === key)!;
    return category.searchQueries.flatMap((searchQuery) =>
      areas.map((area) => ({
        category: key,
        searchQuery,
        south: area.bounds.south,
        west: area.bounds.west,
        north: area.bounds.north,
        east: area.bounds.east,
        depth: area.depth,
      }))
    );
  });

  return prisma.businessImportJob.create({
    data: {
      cityId: city.id,
      provider: "GOOGLE",
      categories: uniqueCategories,
      includeDetails,
      createdById,
      totalTasks: tasks.length,
      tasks: { create: tasks },
    },
    include: { city: true },
  });
}

export async function cancelImportJob(jobId: string) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.businessImportJob.findUnique({ where: { id: jobId } });
    if (!job) return null;
    if (!["PENDING", "RUNNING"].includes(job.status)) return job;
    await tx.businessImportTask.updateMany({
      where: { jobId, status: { in: ["PENDING", "RUNNING"] } },
      data: { status: "CANCELLED", completedAt: new Date(), lockedAt: null },
    });
    return tx.businessImportJob.update({
      where: { id: jobId },
      data: { status: "CANCELLED", cancelledAt: new Date(), completedAt: new Date() },
    });
  });
}

export function listImportCategories() {
  return BEAUTY_IMPORT_CATEGORIES;
}
