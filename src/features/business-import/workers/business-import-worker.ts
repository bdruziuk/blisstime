import { prisma } from "@/lib/prisma";
import type { BusinessImportProvider } from "../domain/provider";
import type { ImportedBusinessDetails, ImportedBusinessSummary } from "../domain/types";
import { IMPORT_CONFIG } from "../config/import-config";
import { googlePlacesProvider } from "../providers/google-places";
import { approximateCellSizeKm, containsCoordinates, splitArea } from "../services/grid-builder";
import { uniqueByExternalId } from "../services/deduplicator";
import { upsertImportedBusiness, type UpsertOutcome } from "../services/business-upsert";
import { canonicalCityName } from "../services/city-normalizer";
import { mergeNameCategories } from "../services/name-category-classifier";

type ClaimedTask = {
  id: string;
  jobId: string;
  category: string;
  searchQuery: string;
  south: number;
  west: number;
  north: number;
  east: number;
  depth: number;
  attempts: number;
};

function safeError(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : "Невідома помилка імпорту";
}

async function recoverStaleTasks(jobId?: string) {
  await prisma.businessImportTask.updateMany({
    where: {
      ...(jobId ? { jobId } : {}),
      status: "RUNNING",
      lockedAt: { lt: new Date(Date.now() - IMPORT_CONFIG.taskLockTimeoutMs) },
      attempts: { lt: IMPORT_CONFIG.maxAttempts },
      job: { status: { in: ["PENDING", "RUNNING"] } },
    },
    data: { status: "PENDING", lockedAt: null, errorMessage: "Worker перезапущено після timeout" },
  });
}

async function claimTask(jobId?: string): Promise<ClaimedTask | null> {
  for (let pass = 0; pass < 5; pass += 1) {
    const candidate = await prisma.businessImportTask.findFirst({
      where: {
        ...(jobId ? { jobId } : {}),
        status: "PENDING",
        attempts: { lt: IMPORT_CONFIG.maxAttempts },
        job: { status: { in: ["PENDING", "RUNNING"] } },
      },
      orderBy: { createdAt: "asc" },
    });
    if (!candidate) return null;
    const claimed = await prisma.businessImportTask.updateMany({
      where: { id: candidate.id, status: "PENDING" },
      data: {
        status: "RUNNING",
        lockedAt: new Date(),
        startedAt: candidate.startedAt ?? new Date(),
        attempts: { increment: 1 },
        errorMessage: null,
      },
    });
    if (claimed.count === 1) return { ...candidate, attempts: candidate.attempts + 1 };
  }
  return null;
}

function detailsFromSummary(summary: ImportedBusinessSummary): ImportedBusinessDetails {
  return {
    ...summary,
    addressComponents: [],
    nationalPhone: null,
    internationalPhone: null,
    websiteUri: null,
    googleMapsUri: null,
    rating: null,
    userRatingCount: null,
    regularOpeningHours: null,
    businessStatus: null,
    fetchedAt: new Date(),
  };
}

async function getFreshExisting(externalId: string) {
  const existing = await prisma.importedBusiness.findUnique({
    where: { provider_externalId: { provider: "GOOGLE", externalId } },
    select: { id: true, lastSyncedAt: true, categories: true },
  });
  if (!existing) return null;
  return existing.lastSyncedAt >= new Date(Date.now() - IMPORT_CONFIG.detailsRefreshDays * 86_400_000)
    ? existing
    : null;
}

async function recordJobResult(jobId: string, businessId: string, category: string, outcome: UpsertOutcome) {
  await prisma.businessImportResult.upsert({
    where: { jobId_businessId: { jobId, businessId } },
    update: { outcome },
    create: { jobId, businessId, category, outcome },
  });
}

async function completeWithChildren(task: ClaimedTask) {
  const children = splitArea({
    depth: task.depth,
    bounds: { south: task.south, west: task.west, north: task.north, east: task.east },
  });
  await prisma.$transaction([
    prisma.businessImportTask.createMany({
      data: children.map((area) => ({
        jobId: task.jobId,
        category: task.category,
        searchQuery: task.searchQuery,
        south: area.bounds.south,
        west: area.bounds.west,
        north: area.bounds.north,
        east: area.bounds.east,
        depth: area.depth,
      })),
    }),
    prisma.businessImportTask.update({
      where: { id: task.id },
      data: { status: "COMPLETED", completedAt: new Date(), lockedAt: null, foundCount: 0 },
    }),
    prisma.businessImportJob.update({
      where: { id: task.jobId },
      data: { totalTasks: { increment: children.length }, completedTasks: { increment: 1 } },
    }),
  ]);
}

async function processClaimedTask(task: ClaimedTask, provider: BusinessImportProvider) {
  const started = Date.now();
  const job = await prisma.businessImportJob.findUnique({
    where: { id: task.jobId },
    include: { city: true },
  });
  if (!job || job.status === "CANCELLED") {
    await prisma.businessImportTask.update({
      where: { id: task.id },
      data: { status: "CANCELLED", completedAt: new Date(), lockedAt: null },
    });
    return;
  }
  if (job.status === "PENDING") {
    await prisma.businessImportJob.update({
      where: { id: job.id },
      data: { status: "RUNNING", startedAt: job.startedAt ?? new Date() },
    });
  }

  const bounds = { south: task.south, west: task.west, north: task.north, east: task.east };
  const summaries: ImportedBusinessSummary[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < IMPORT_CONFIG.maxSearchPages; page += 1) {
    const result = await provider.searchBusinesses({
      query: `${task.searchQuery} ${job.city.name}`,
      bounds,
      pageToken,
      regionCode: job.city.countryCode,
      languageCode: "uk",
    });
    summaries.push(...result.businesses);
    pageToken = result.nextPageToken;
    if (!pageToken) break;
  }
  const saturated = Boolean(pageToken);
  if (
    saturated &&
    task.depth < IMPORT_CONFIG.maxGridDepth &&
    approximateCellSizeKm(bounds) > IMPORT_CONFIG.minCellSizeKm
  ) {
    await completeWithChildren(task);
    return;
  }

  const cityBounds = {
    south: job.city.south,
    west: job.city.west,
    north: job.city.north,
    east: job.city.east,
  };
  const unique = uniqueByExternalId(summaries).filter((item) =>
    containsCoordinates(cityBounds, item.lat, item.lng)
  );
  const counts: Record<UpsertOutcome | "failed", number> = {
    created: 0,
    updated: 0,
    duplicate: 0,
    failed: 0,
  };
  for (const summary of unique) {
    const latestJob = await prisma.businessImportJob.findUnique({
      where: { id: job.id },
      select: { status: true },
    });
    if (latestJob?.status === "CANCELLED") break;
    try {
      const freshExisting = await getFreshExisting(summary.externalId);
      if (freshExisting) {
        const categories = mergeNameCategories(summary.name, [
          ...(Array.isArray(freshExisting.categories) ? (freshExisting.categories as string[]) : []),
          task.category,
        ]);
        await prisma.importedBusiness.update({
          where: { id: freshExisting.id },
          data: { categories, city: canonicalCityName(job.city.name, job.city.countryCode), regionalCenter: job.city.regionalCenter },
        });
        await recordJobResult(job.id, freshExisting.id, task.category, "duplicate");
        counts.duplicate += 1;
        continue;
      }
      const details = job.includeDetails
        ? await provider.getBusinessDetails(summary.externalId)
        : detailsFromSummary(summary);
      const result = await upsertImportedBusiness({
        details,
        category: task.category,
        fallbackCity: job.city.name,
        fallbackCountryCode: job.city.countryCode,
        fallbackRegionalCenter: job.city.regionalCenter,
      });
      counts[result.outcome] += 1;
      await recordJobResult(job.id, result.businessId, task.category, result.outcome);
    } catch (error) {
      counts.failed += 1;
      console.error(
        JSON.stringify({
          event: "business_import_place_failed",
          jobId: job.id,
          taskId: task.id,
          externalId: summary.externalId,
          error: safeError(error),
        })
      );
    }
  }

  await prisma.$transaction([
    prisma.businessImportTask.update({
      where: { id: task.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        lockedAt: null,
        foundCount: unique.length,
        errorMessage: counts.failed ? `${counts.failed} закладів не оброблено` : null,
      },
    }),
    prisma.businessImportJob.update({
      where: { id: job.id },
      data: {
        completedTasks: { increment: 1 },
        foundCount: { increment: unique.length },
        createdCount: { increment: counts.created },
        updatedCount: { increment: counts.updated },
        duplicateCount: { increment: counts.duplicate },
        failedCount: { increment: counts.failed },
      },
    }),
  ]);
  console.info(
    JSON.stringify({
      event: "business_import_task_completed",
      jobId: job.id,
      taskId: task.id,
      cityId: job.cityId,
      category: task.category,
      foundCount: unique.length,
      durationMs: Date.now() - started,
    })
  );
}

async function failTask(task: ClaimedTask, error: unknown) {
  const finalAttempt = task.attempts >= IMPORT_CONFIG.maxAttempts;
  await prisma.$transaction([
    prisma.businessImportTask.update({
      where: { id: task.id },
      data: finalAttempt
        ? { status: "FAILED", completedAt: new Date(), lockedAt: null, errorMessage: safeError(error) }
        : { status: "PENDING", lockedAt: null, errorMessage: safeError(error) },
    }),
    ...(finalAttempt
      ? [
          prisma.businessImportJob.update({
            where: { id: task.jobId },
            data: { completedTasks: { increment: 1 }, failedCount: { increment: 1 } },
          }),
        ]
      : []),
  ]);
}

async function finalizeJob(jobId: string) {
  const [job, unfinished, failedTasks] = await Promise.all([
    prisma.businessImportJob.findUnique({ where: { id: jobId } }),
    prisma.businessImportTask.count({ where: { jobId, status: { in: ["PENDING", "RUNNING"] } } }),
    prisma.businessImportTask.count({ where: { jobId, status: "FAILED" } }),
  ]);
  if (!job || job.status === "CANCELLED" || unfinished > 0) return;
  await prisma.businessImportJob.update({
    where: { id: jobId },
    data: {
      status: failedTasks > 0 || job.failedCount > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
      completedAt: new Date(),
    },
  });
}

export async function processImportTasks({
  jobId,
  limit = IMPORT_CONFIG.concurrency,
  provider = googlePlacesProvider,
}: {
  jobId?: string;
  limit?: number;
  provider?: BusinessImportProvider;
}) {
  await recoverStaleTasks(jobId);
  const claimed = (
    await Promise.all(Array.from({ length: Math.min(limit, IMPORT_CONFIG.concurrency) }, () => claimTask(jobId)))
  ).filter((task): task is ClaimedTask => Boolean(task));
  await Promise.all(
    claimed.map(async (task) => {
      try {
        await processClaimedTask(task, provider);
      } catch (error) {
        await failTask(task, error);
      }
    })
  );
  for (const id of new Set(claimed.map((task) => task.jobId))) await finalizeJob(id);
  return { processed: claimed.length };
}
