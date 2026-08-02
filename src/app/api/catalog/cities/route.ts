import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { catalogCityName } from "@/features/business-import/services/city-normalizer";

export const dynamic = "force-dynamic";

export async function GET() {
  const [locations, imported] = await Promise.all([
    prisma.location.findMany({ where: { staff: { some: { onboardedAt: { not: null }, isPublished: true } }, lat: { not: null }, lng: { not: null } }, select: { city: true, lat: true, lng: true } }),
    prisma.importedBusiness.findMany({ where: { publicationStatus: "PUBLISHED" }, select: { city: true, countryCode: true, lat: true, lng: true, importResults: { take: 1, orderBy: { createdAt: "desc" }, select: { job: { select: { city: { select: { name: true, countryCode: true } } } } } } } }),
  ]);
  const grouped = new Map<string, { city: string; lat: number; lng: number; count: number }>();
  const add = (city: string, lat: number, lng: number) => {
    const current = grouped.get(city);
    if (current) { current.lat += lat; current.lng += lng; current.count += 1; }
    else grouped.set(city, { city, lat, lng, count: 1 });
  };
  for (const row of locations) { const city = catalogCityName(row.city, "UA"); if (city && row.lat !== null && row.lng !== null) add(city, row.lat, row.lng); }
  for (const row of imported) { const city = catalogCityName(row.importResults[0]?.job.city.name ?? row.city, row.importResults[0]?.job.city.countryCode ?? row.countryCode); if (city) add(city, row.lat, row.lng); }
  const cities = [...grouped.values()].map((row) => ({ city: row.city, lat: row.lat / row.count, lng: row.lng / row.count })).sort((a, b) => a.city.localeCompare(b.city, "uk"));
  return NextResponse.json({ cities }, { headers: { "Cache-Control": "no-store" } });
}
