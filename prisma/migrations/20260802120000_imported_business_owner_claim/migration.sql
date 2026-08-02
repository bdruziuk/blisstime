ALTER TABLE "ImportedBusiness" ADD COLUMN "ownerClaimToken" TEXT;
ALTER TABLE "ImportedBusiness" ADD COLUMN "claimedByStaffId" TEXT;
CREATE UNIQUE INDEX "ImportedBusiness_ownerClaimToken_key" ON "ImportedBusiness"("ownerClaimToken");
CREATE UNIQUE INDEX "ImportedBusiness_claimedByStaffId_key" ON "ImportedBusiness"("claimedByStaffId");
ALTER TABLE "ImportedBusiness" ADD CONSTRAINT "ImportedBusiness_claimedByStaffId_fkey" FOREIGN KEY ("claimedByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
