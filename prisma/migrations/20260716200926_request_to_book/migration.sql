-- CreateEnum
CREATE TYPE "ConfirmationMode" AS ENUM ('MANUAL', 'AUTO_ALL', 'AUTO_TRUSTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'DECLINED';
ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "holdExpiresAt" TIMESTAMP(3),
ADD COLUMN     "respondedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "confirmationMode" "ConfirmationMode" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "holdDurationMinutes" INTEGER NOT NULL DEFAULT 180;
