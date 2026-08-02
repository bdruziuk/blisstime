import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { catalogCityName } from "@/features/business-import/services/city-normalizer";
import { nearestRegionalCenter, UKRAINE_REGIONAL_CENTERS } from "@/features/search/regional-centers";

export const dynamic = "force-dynamic";

export async function GET() {
  const [locations, imported] = await Promise.all([
    prisma.location.findMany({ where: { staff: { some: { onboardedAt: { not: null }, isPublished: true } }, lat: { not: null }, lng: { not: null } }, select: { city: true, regionalCenter: true, lat: true, lng: true } }),
    prisma.importedBusiness.findMany({ where: { publicationStatus: "PUBLISHED" }, select: { city: true, regionalCenter: true, countryCode: true, lat: true, lng: true, importResults: { take: 1, orderBy: { createdAt: "desc" }, select: { job: { select: { city: { select: { name: true, countryCode: true, regionalCenter: true } } } } } } } }),
  ]);
  const grouped = new Map<string, { city: string; regionalCenter: string | null; lat: number; lng: number; count: number }>();
  const add = (city: string, regionalCenter: string | null, lat: number, lng: number) => {
    const current = grouped.get(city);
    if (current) { current.lat += lat; current.lng += lng; current.count += 1; current.regionalCenter ||= regionalCenter; }
    else grouped.set(city, { city, regionalCenter, lat, lng, count: 1 });
  };
  for (const row of locations) { const city = catalogCityName(row.city, "UA"); if (city && row.lat !== null && row.lng !== null) add(city, row.regionalCenter, row.lat, row.lng); }
  for (const row of imported) { const city = catalogCityName(row.importResults[0]?.job.city.name ?? row.city, row.importResults[0]?.job.city.countryCode ?? row.countryCode); if (city) add(city, row.regionalCenter ?? row.importResults[0]?.job.city.regionalCenter ?? null, row.lat, row.lng); }
  for (const center of UKRAINE_REGIONAL_CENTERS) if (!grouped.has(center.city)) grouped.set(center.city, { ...center, regionalCenter: center.city, count: 1 });
  const regionalNames = new Set<string>(UKRAINE_REGIONAL_CENTERS.map((center) => center.city));
  const cities = [...grouped.values()].map((row) => {
    const lat = row.lat / row.count;
    const lng = row.lng / row.count;
    return { city: row.city, lat, lng, regionalCenter: row.regionalCenter ?? (regionalNames.has(row.city) ? row.city : nearestRegionalCenter(lat, lng)), isRegionalCenter: regionalNames.has(row.city) };
  }).sort((a, b) => a.city.localeCompare(b.city, "uk"));
  return NextResponse.json({ cities }, { headers: { "Cache-Control": "no-store" } });
}
