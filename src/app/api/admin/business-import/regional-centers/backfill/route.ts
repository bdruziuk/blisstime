import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { googlePlacesProvider } from "@/features/business-import/providers/google-places";

const BATCH_SIZE = 5;

export async function POST(request: NextRequest) {
  if (!(await getSuperAdminUser())) return unauthorized();
  try {
    const force = request.nextUrl.searchParams.get("force") === "true";
    if (force) {
      await prisma.$transaction([
        prisma.businessImportCity.updateMany({ where: { countryCode: "UA" }, data: { regionalCenter: null } }),
        prisma.importedBusiness.updateMany({ where: { countryCode: "UA" }, data: { regionalCenter: null } }),
        prisma.location.updateMany({ data: { regionalCenter: null } }),
      ]);
    }
    const cities = await prisma.businessImportCity.findMany({
      where: { countryCode: "UA", regionalCenter: null },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      select: { id: true, externalId: true, name: true },
    });
    const cityResults = await Promise.allSettled(cities.map(async (city) => {
      const resolved = await googlePlacesProvider.resolveCity(city.externalId);
      if (!resolved.regionalCenter) throw new Error("Обласний центр не визначено");
      await prisma.$transaction([
        prisma.businessImportCity.update({ where: { id: city.id }, data: { regionalCenter: resolved.regionalCenter } }),
        prisma.importedBusiness.updateMany({
          where: { importResults: { some: { job: { cityId: city.id } } } },
          data: { regionalCenter: resolved.regionalCenter },
        }),
      ]);
      return { kind: "import" as const, value: city.name };
    }));
    const locations = cities.length < BATCH_SIZE ? await prisma.location.findMany({
      where: { regionalCenter: null, lat: { not: null }, lng: { not: null } },
      distinct: ["city"],
      take: BATCH_SIZE - cities.length,
      select: { city: true },
    }) : [];
    const locationResults = await Promise.allSettled(locations.map(async (location) => {
      const candidate = (await googlePlacesProvider.searchCities(location.city, "UA"))[0];
      if (!candidate) throw new Error("Місто не знайдено");
      const resolved = await googlePlacesProvider.resolveCity(candidate.externalId);
      if (!resolved.regionalCenter) throw new Error("Обласний центр не визначено");
      await prisma.location.updateMany({
        where: { city: { equals: location.city, mode: "insensitive" } },
        data: { regionalCenter: resolved.regionalCenter },
      });
      return { kind: "location" as const, value: location.city };
    }));
    const [remainingImportCities, remainingLocations] = await Promise.all([
      prisma.businessImportCity.count({ where: { countryCode: "UA", regionalCenter: null } }),
      prisma.location.count({ where: { regionalCenter: null, lat: { not: null }, lng: { not: null } } }),
    ]);
    const results = [...cityResults, ...locationResults];
    const failures = results.flatMap((result, index) => {
      if (result.status !== "rejected") return [];
      const source = index < cities.length
        ? { kind: "import", value: cities[index].name }
        : { kind: "location", value: locations[index - cities.length].city };
      return [{ ...source, error: result.reason instanceof Error ? result.reason.message : String(result.reason) }];
    });
    const remaining = remainingImportCities + remainingLocations;
    return NextResponse.json({
      processed: results.filter((result) => result.status === "fulfilled").length,
      failed: results.filter((result) => result.status === "rejected").length,
      failures,
      remaining,
      done: remaining === 0,
      reset: force,
    });
  } catch (error) {
    return apiError(error);
  }
}
