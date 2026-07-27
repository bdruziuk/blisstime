-- Client Telegram link token.
ALTER TABLE "Client" ADD COLUMN "telegramLinkToken" TEXT;
CREATE UNIQUE INDEX "Client_telegramLinkToken_key" ON "Client"("telegramLinkToken");

-- Per-service rebook reminder interval (weeks); null = don't remind.
ALTER TABLE "StaffService" ADD COLUMN "rebookReminderWeeks" INTEGER;

-- Dedupe flags for the client-facing Telegram nudges.
ALTER TABLE "Booking" ADD COLUMN "clientReminder24SentAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "clientReminder1SentAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "rebookReminderSentAt" TIMESTAMP(3);
