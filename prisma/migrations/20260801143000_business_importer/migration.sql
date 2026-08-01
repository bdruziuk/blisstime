CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED', 'CANCELLED');
CREATE TYPE "ImportTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "ImportedBusinessStatus" AS ENUM ('IMPORT_PENDING_REVIEW', 'PUBLISHED', 'REJECTED');
CREATE TYPE "EnrichmentStatus" AS ENUM ('NOT_STARTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'NO_WEBSITE', 'NO_PRICES_FOUND');

CREATE TABLE "BusinessImportCity" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "formattedName" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL,
  "centerLat" DOUBLE PRECISION NOT NULL,
  "centerLng" DOUBLE PRECISION NOT NULL,
  "south" DOUBLE PRECISION NOT NULL,
  "west" DOUBLE PRECISION NOT NULL,
  "north" DOUBLE PRECISION NOT NULL,
  "east" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessImportCity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessImportJob" (
  "id" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
  "categories" JSONB NOT NULL,
  "includeDetails" BOOLEAN NOT NULL DEFAULT true,
  "totalTasks" INTEGER NOT NULL DEFAULT 0,
  "completedTasks" INTEGER NOT NULL DEFAULT 0,
  "foundCount" INTEGER NOT NULL DEFAULT 0,
  "createdCount" INTEGER NOT NULL DEFAULT 0,
  "updatedCount" INTEGER NOT NULL DEFAULT 0,
  "duplicateCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessImportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessImportTask" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "searchQuery" TEXT NOT NULL,
  "status" "ImportTaskStatus" NOT NULL DEFAULT 'PENDING',
  "south" DOUBLE PRECISION NOT NULL,
  "west" DOUBLE PRECISION NOT NULL,
  "north" DOUBLE PRECISION NOT NULL,
  "east" DOUBLE PRECISION NOT NULL,
  "depth" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "foundCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "lockedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessImportTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportedBusiness" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "publicationStatus" "ImportedBusinessStatus" NOT NULL DEFAULT 'IMPORT_PENDING_REVIEW',
  "enrichmentStatus" "EnrichmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "manualReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  "countryCode" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "district" TEXT,
  "formattedAddress" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "nationalPhone" TEXT,
  "internationalPhone" TEXT,
  "normalizedPhone" TEXT,
  "websiteUri" TEXT,
  "normalizedDomain" TEXT,
  "googleMapsUri" TEXT,
  "rating" DOUBLE PRECISION,
  "userRatingCount" INTEGER,
  "primaryType" TEXT,
  "types" JSONB NOT NULL,
  "categories" JSONB NOT NULL,
  "regularOpeningHours" JSONB,
  "businessStatus" TEXT,
  "normalizedName" TEXT NOT NULL,
  "normalizedAddress" TEXT NOT NULL,
  "sourceFetchedAt" TIMESTAMP(3) NOT NULL,
  "lastSyncedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportedBusiness_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessImportResult" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessImportResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessImportCity_provider_externalId_key" ON "BusinessImportCity"("provider", "externalId");
CREATE INDEX "BusinessImportJob_status_idx" ON "BusinessImportJob"("status");
CREATE INDEX "BusinessImportJob_cityId_createdAt_idx" ON "BusinessImportJob"("cityId", "createdAt");
CREATE INDEX "BusinessImportTask_jobId_status_idx" ON "BusinessImportTask"("jobId", "status");
CREATE INDEX "BusinessImportTask_status_lockedAt_idx" ON "BusinessImportTask"("status", "lockedAt");
CREATE UNIQUE INDEX "ImportedBusiness_provider_externalId_key" ON "ImportedBusiness"("provider", "externalId");
CREATE UNIQUE INDEX "ImportedBusiness_slug_key" ON "ImportedBusiness"("slug");
CREATE INDEX "ImportedBusiness_publicationStatus_city_idx" ON "ImportedBusiness"("publicationStatus", "city");
CREATE INDEX "ImportedBusiness_normalizedPhone_idx" ON "ImportedBusiness"("normalizedPhone");
CREATE INDEX "ImportedBusiness_normalizedDomain_idx" ON "ImportedBusiness"("normalizedDomain");
CREATE INDEX "ImportedBusiness_normalizedName_normalizedAddress_idx" ON "ImportedBusiness"("normalizedName", "normalizedAddress");
CREATE UNIQUE INDEX "BusinessImportResult_jobId_businessId_key" ON "BusinessImportResult"("jobId", "businessId");
CREATE INDEX "BusinessImportResult_businessId_idx" ON "BusinessImportResult"("businessId");

ALTER TABLE "BusinessImportJob" ADD CONSTRAINT "BusinessImportJob_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "BusinessImportCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessImportJob" ADD CONSTRAINT "BusinessImportJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BusinessImportTask" ADD CONSTRAINT "BusinessImportTask_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessImportResult" ADD CONSTRAINT "BusinessImportResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessImportResult" ADD CONSTRAINT "BusinessImportResult_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "ImportedBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;
