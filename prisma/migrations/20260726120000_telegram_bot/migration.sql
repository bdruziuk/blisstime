-- AlterTable: Telegram link fields for masters.
ALTER TABLE "Staff" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "Staff" ADD COLUMN "telegramLinkToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Staff_telegramLinkToken_key" ON "Staff"("telegramLinkToken");

-- AlterTable: track when the 24h reminder was sent.
ALTER TABLE "Booking" ADD COLUMN "masterReminderSentAt" TIMESTAMP(3);
