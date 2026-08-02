CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Location_city_district_idx" ON "Location"("city", "district");
CREATE INDEX "Staff_isPublished_onboardedAt_idx" ON "Staff"("isPublished", "onboardedAt");
CREATE INDEX "Staff_locationId_idx" ON "Staff"("locationId");
CREATE INDEX "StaffService_staffId_isActive_categoryId_idx" ON "StaffService"("staffId", "isActive", "categoryId");
CREATE INDEX "StaffService_categoryId_isActive_priceCents_idx" ON "StaffService"("categoryId", "isActive", "priceCents");
CREATE INDEX "ImportedBusinessServiceDraft_status_categorySlug_priceMinor_idx" ON "ImportedBusinessServiceDraft"("status", "categorySlug", "priceMinor");

CREATE INDEX "Staff_displayName_trgm_idx" ON "Staff" USING GIN ("displayName" gin_trgm_ops);
CREATE INDEX "Staff_username_trgm_idx" ON "Staff" USING GIN ("username" gin_trgm_ops);
CREATE INDEX "Staff_bio_trgm_idx" ON "Staff" USING GIN ("bio" gin_trgm_ops);
CREATE INDEX "Organization_name_trgm_idx" ON "Organization" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Location_address_trgm_idx" ON "Location" USING GIN ("address" gin_trgm_ops);
CREATE INDEX "StaffService_displayName_trgm_idx" ON "StaffService" USING GIN ("displayName" gin_trgm_ops);
CREATE INDEX "ServiceCategory_name_trgm_idx" ON "ServiceCategory" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "ImportedBusiness_name_trgm_idx" ON "ImportedBusiness" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "ImportedBusiness_formattedAddress_trgm_idx" ON "ImportedBusiness" USING GIN ("formattedAddress" gin_trgm_ops);
CREATE INDEX "ImportedBusiness_websiteUri_trgm_idx" ON "ImportedBusiness" USING GIN ("websiteUri" gin_trgm_ops);
CREATE INDEX "ImportedBusinessServiceDraft_displayName_trgm_idx" ON "ImportedBusinessServiceDraft" USING GIN ("displayName" gin_trgm_ops);
