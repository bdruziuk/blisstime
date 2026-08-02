ALTER TABLE "Location" ADD COLUMN "regionalCenter" TEXT;
ALTER TABLE "BusinessImportCity" ADD COLUMN "regionalCenter" TEXT;
ALTER TABLE "ImportedBusiness" ADD COLUMN "regionalCenter" TEXT;
CREATE INDEX "ImportedBusiness_publicationStatus_regionalCenter_idx" ON "ImportedBusiness"("publicationStatus", "regionalCenter");
