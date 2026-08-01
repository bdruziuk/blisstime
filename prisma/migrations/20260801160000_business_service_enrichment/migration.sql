CREATE TYPE "ImportedServiceDraftStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

ALTER TABLE "ImportedBusiness"
ADD COLUMN "enrichmentError" TEXT,
ADD COLUMN "enrichmentStartedAt" TIMESTAMP(3),
ADD COLUMN "enrichmentCompletedAt" TIMESTAMP(3);

CREATE TABLE "ImportedBusinessServiceDraft" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "priceMinor" INTEGER NOT NULL,
  "currencyCode" TEXT NOT NULL,
  "durationMinutes" INTEGER,
  "categorySlug" TEXT,
  "sourceUrl" TEXT NOT NULL,
  "status" "ImportedServiceDraftStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportedBusinessServiceDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImportedBusinessServiceDraft_businessId_normalizedName_priceMinor_currencyCode_key"
ON "ImportedBusinessServiceDraft"("businessId", "normalizedName", "priceMinor", "currencyCode");
CREATE INDEX "ImportedBusinessServiceDraft_businessId_status_idx"
ON "ImportedBusinessServiceDraft"("businessId", "status");
ALTER TABLE "ImportedBusinessServiceDraft" ADD CONSTRAINT "ImportedBusinessServiceDraft_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "ImportedBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;
