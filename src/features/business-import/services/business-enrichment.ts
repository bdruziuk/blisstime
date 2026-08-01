import { prisma } from "@/lib/prisma";
import { collectWebsitePriceText, parsePublicWebsite } from "./website-discovery";
import { extractServicesFromWebsite } from "./service-extraction";

export function websiteImportAvailable(websiteUri: string | null | undefined) {
  return Boolean(parsePublicWebsite(websiteUri));
}

export async function enrichImportedBusiness(id: string) {
  const business = await prisma.importedBusiness.findUnique({ where: { id } });
  if (!business) throw new Error("Заклад не знайдено");
  if (!websiteImportAvailable(business.websiteUri)) {
    return prisma.importedBusiness.update({ where: { id }, data: { enrichmentStatus: "NO_WEBSITE", enrichmentError: "Сайт не вказано або його адреса не підтримується", enrichmentCompletedAt: new Date() } });
  }
  await prisma.importedBusiness.update({ where: { id }, data: { enrichmentStatus: "PROCESSING", enrichmentError: null, enrichmentStartedAt: new Date(), enrichmentCompletedAt: null } });
  try {
    const website = await collectWebsitePriceText(business.websiteUri!);
    const items = await extractServicesFromWebsite(website.text, website.sourceUrls);
    await prisma.$transaction(async (tx) => {
      await tx.importedBusinessServiceDraft.deleteMany({ where: { businessId: id, status: "PENDING_REVIEW" } });
      for (const item of items) {
        const normalizedName = item.displayName.toLocaleLowerCase().replace(/\s+/g, " ").trim();
        await tx.importedBusinessServiceDraft.upsert({
          where: { businessId_normalizedName_priceMinor_currencyCode: { businessId: id, normalizedName, priceMinor: Math.round(item.priceAmount * 100), currencyCode: item.currencyCode.toUpperCase() } },
          create: { businessId: id, displayName: item.displayName, normalizedName, priceMinor: Math.round(item.priceAmount * 100), currencyCode: item.currencyCode.toUpperCase(), durationMinutes: item.durationMinutes ?? null, categorySlug: item.categorySlug ?? null, sourceUrl: item.sourceUrl },
          update: { displayName: item.displayName, durationMinutes: item.durationMinutes ?? null, categorySlug: item.categorySlug ?? null, sourceUrl: item.sourceUrl, status: "PENDING_REVIEW" },
        });
      }
      await tx.importedBusiness.update({ where: { id }, data: { enrichmentStatus: items.length ? "COMPLETED" : "NO_PRICES_FOUND", enrichmentError: items.length ? null : "На сайті не знайдено послуг з явними цінами", enrichmentCompletedAt: new Date() } });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Невідома помилка";
    await prisma.importedBusiness.update({ where: { id }, data: { enrichmentStatus: "FAILED", enrichmentError: message, enrichmentCompletedAt: new Date() } });
    throw new Error(message);
  }
  return prisma.importedBusiness.findUnique({ where: { id }, include: { serviceDrafts: { orderBy: { createdAt: "asc" } } } });
}
