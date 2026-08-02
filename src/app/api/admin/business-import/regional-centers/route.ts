import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { unauthorized } from "@/features/business-import/api-response";
import { canonicalCityName } from "@/features/business-import/services/city-normalizer";

const REGIONAL_CENTERS = [
  "Вінниця", "Луцьк", "Дніпро", "Донецьк", "Житомир", "Ужгород", "Запоріжжя", "Івано-Франківськ",
  "Київ", "Кропивницький", "Луганськ", "Львів", "Миколаїв", "Одеса", "Полтава", "Рівне",
  "Суми", "Тернопіль", "Харків", "Херсон", "Хмельницький", "Черкаси", "Чернівці", "Чернігів",
] as const;

type CityStat = {
  id: string;
  externalId: string;
  name: string;
  formattedName: string;
  countryCode: string;
  recordCount: bigint;
  latestImportAt: Date | null;
};

export async function GET() {
  if (!(await getSuperAdminUser())) return unauthorized();
  const rows = await prisma.$queryRaw<CityStat[]>`
    SELECT c.id, c."externalId", c.name, c."formattedName", c."countryCode",
           COUNT(DISTINCT r."businessId") AS "recordCount",
           MAX(j."createdAt") AS "latestImportAt"
    FROM "BusinessImportCity" c
    LEFT JOIN "BusinessImportJob" j ON j."cityId" = c.id
    LEFT JOIN "BusinessImportResult" r ON r."jobId" = j.id
    WHERE UPPER(c."countryCode") = 'UA'
    GROUP BY c.id
  `;
  const byName = new Map<string, CityStat>();
  for (const row of rows) {
    const key = canonicalCityName(row.name, "UA").toLocaleLowerCase("uk");
    const existing = byName.get(key);
    if (!existing || (row.latestImportAt?.getTime() ?? 0) > (existing.latestImportAt?.getTime() ?? 0)) byName.set(key, row);
  }
  return NextResponse.json({
    centers: REGIONAL_CENTERS.map((name) => {
      const city = byName.get(canonicalCityName(name, "UA").toLocaleLowerCase("uk"));
      return {
        name,
        imported: Boolean(city?.latestImportAt),
        recordCount: Number(city?.recordCount ?? 0),
        latestImportAt: city?.latestImportAt ?? null,
        city: city ? { externalId: city.externalId, name: city.name, formattedName: city.formattedName, countryCode: city.countryCode } : null,
      };
    }),
  });
}
