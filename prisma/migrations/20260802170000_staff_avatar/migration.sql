CREATE TABLE "StaffAvatar" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffAvatar_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffAvatar_staffId_key" ON "StaffAvatar"("staffId");
ALTER TABLE "StaffAvatar" ADD CONSTRAINT "StaffAvatar_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
