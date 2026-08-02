import type { ImportedBusinessDetails } from "../domain/types";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { slugify } from "@/lib/slugify";
import { findPotentialDuplicate } from "./deduplicator";
import { normalizeComparableText, normalizeDomain, normalizeImportedPhone } from "./normalizer";
import { canonicalCityName } from "./city-normalizer";
import { mergeNameCategories } from "./name-category-classifier";

export type UpsertOutcome = "created" | "updated" | "duplicate";
export type UpsertResult = { outcome: UpsertOutcome; businessId: string };

function component(details: ImportedBusinessDetails, type: string): string | null {
  return details.addressComponents.find((item) => item.types.includes(type))?.longText || null;
}

function jsonValue(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function upsertImportedBusiness({
  details,
  category,
  fallbackCity,
  fallbackCountryCode,
  fallbackRegionalCenter,
}: {
  details: ImportedBusinessDetails;
  category: string;
  fallbackCity: string;
  fallbackCountryCode: string;
  fallbackRegionalCenter: string | null;
}): Promise<UpsertResult> {
  const existing = await prisma.importedBusiness.findUnique({
    where: { provider_externalId: { provider: "GOOGLE", externalId: details.externalId } },
  });
  const normalizedPhone = normalizeImportedPhone(details.internationalPhone ?? details.nationalPhone);
  const normalizedDomain = normalizeDomain(details.websiteUri);
  const normalizedName = normalizeComparableText(details.name);
  const normalizedAddress = normalizeComparableText(details.formattedAddress);
  const categories = mergeNameCategories(details.name, [
    ...(Array.isArray(existing?.categories) ? (existing.categories as string[]) : []),
    category,
  ]);
  // Google frequently returns a suburb/locality (for example Sofiivska
  // Borshchahivka) for a place inside the selected import area. The selected
  // import city is the authoritative catalog city; locality remains in address.
  const city = canonicalCityName(fallbackCity, fallbackCountryCode);
  const district =
    component(details, "sublocality_level_1") ?? component(details, "administrative_area_level_2");
  const countryCode =
    details.addressComponents.find((item) => item.types.includes("country"))?.shortText.toUpperCase() ??
    fallbackCountryCode;

  const importedData = {
    name: details.name,
    countryCode,
    city,
    district,
    regionalCenter: fallbackRegionalCenter,
    formattedAddress: details.formattedAddress,
    lat: details.lat,
    lng: details.lng,
    nationalPhone: details.nationalPhone,
    internationalPhone: details.internationalPhone,
    normalizedPhone,
    websiteUri: details.websiteUri,
    normalizedDomain,
    googleMapsUri: details.googleMapsUri,
    rating: details.rating,
    userRatingCount: details.userRatingCount,
    primaryType: details.primaryType,
    types: details.types,
    categories,
    regularOpeningHours: jsonValue(details.regularOpeningHours),
    businessStatus: details.businessStatus,
    normalizedName,
    normalizedAddress,
    sourceFetchedAt: details.fetchedAt,
    lastSyncedAt: new Date(),
  };

  if (existing) {
    await prisma.importedBusiness.update({ where: { id: existing.id }, data: importedData });
    return { outcome: "updated", businessId: existing.id };
  }

  const possibleMatches = await prisma.importedBusiness.findMany({
    where: {
      OR: [
        ...(normalizedPhone ? [{ normalizedPhone }] : []),
        ...(normalizedDomain ? [{ normalizedDomain }] : []),
        { normalizedName },
      ],
    },
    select: {
      id: true,
      normalizedPhone: true,
      normalizedDomain: true,
      name: true,
      formattedAddress: true,
      lat: true,
      lng: true,
    },
    take: 25,
  });
  const possibleDuplicate = findPotentialDuplicate(
    { normalizedPhone, normalizedDomain, name: details.name, formattedAddress: details.formattedAddress, lat: details.lat, lng: details.lng },
    possibleMatches
  );
  const baseSlug = slugify(details.name) || "salon";
  const suffix = details.externalId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase();
  const created = await prisma.importedBusiness.create({
    data: {
      provider: "GOOGLE",
      externalId: details.externalId,
      slug: `${baseSlug}-${suffix}`,
      manualReviewRequired: Boolean(possibleDuplicate),
      ...importedData,
    },
  });
  return { outcome: possibleDuplicate ? "duplicate" : "created", businessId: created.id };
}
