import { distanceMeters, normalizeComparableText, normalizeDomain, normalizeImportedPhone } from "./normalizer";

export type DedupCandidate = {
  normalizedPhone?: string | null;
  normalizedDomain?: string | null;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
};

export type ExistingDedupRecord = DedupCandidate & { id: string };

export function findPotentialDuplicate(
  candidate: DedupCandidate,
  existing: ExistingDedupRecord[]
): ExistingDedupRecord | null {
  const phone = candidate.normalizedPhone ?? normalizeImportedPhone(candidate.normalizedPhone);
  const domain = candidate.normalizedDomain ?? normalizeDomain(candidate.normalizedDomain);
  const name = normalizeComparableText(candidate.name);
  const address = normalizeComparableText(candidate.formattedAddress);
  return (
    existing.find((record) => phone && record.normalizedPhone === phone) ??
    existing.find((record) => domain && record.normalizedDomain === domain) ??
    existing.find(
      (record) =>
        normalizeComparableText(record.name) === name &&
        normalizeComparableText(record.formattedAddress) === address
    ) ??
    existing.find(
      (record) =>
        normalizeComparableText(record.name) === name &&
        distanceMeters(candidate, record) <= 50
    ) ??
    null
  );
}

export function uniqueByExternalId<T extends { externalId: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.externalId, item])).values()];
}
