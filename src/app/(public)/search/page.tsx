import { Search as SearchIcon } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { SearchFilters } from "@/features/search/components/search-filters";
import type { MasterListingItem } from "@/features/search/components/master-listing-card";
import { LazyListingGrid } from "@/features/search/components/lazy-listing-grid";
import { SearchSort } from "@/features/search/components/search-sort";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getRatingStatsForStaff } from "@/features/booking/rating";
import { canonicalCityName, catalogCityName, sameCanonicalCity } from "@/features/business-import/services/city-normalizer";
import { slugify } from "@/lib/slugify";
import { canonicalKyivDistrict, sameKyivDistrict } from "@/features/business-import/services/kyiv-district-normalizer";

type SearchPageParams = {
  q?: string;
  category?: string;
  city?: string;
  district?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  sort?: string;
};

export default async function SearchPage({
  searchParams,
  pathBased = false,
}: {
  searchParams: Promise<SearchPageParams>;
  pathBased?: boolean;
}) {
  const params = await searchParams;
  const { category, district: districtParam, type, minPrice, maxPrice, minRating, sort } = params;
  const q = params.q?.trim().slice(0, 100);
  const savedCity = (await cookies()).get("catalog_city")?.value;
  const city = params.city || savedCity || undefined;
  if (city && !pathBased) {
    const citySlug = slugify(city);
    const path = sameCanonicalCity(city, "Київ", "UA")
      ? `/${citySlug}/${districtParam ? slugify(districtParam) : "all"}/${category || "all"}`
      : `/${citySlug}/${category || "all"}`;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ q, type, minPrice, maxPrice, minRating, sort })) if (value && value !== "all" && value !== "default") query.set(key, value);
    redirect(query.size ? `${path}?${query}` : path);
  }

  const [categories, cityRows, districtRows] = await Promise.all([
    // Top-level verticals (services attach to their leaves); "misc" is hidden.
    prisma.serviceCategory.findMany({
      where: { parentId: null, slug: { not: "misc" } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.location.findMany({
      where: { staff: { some: { onboardedAt: { not: null }, isPublished: true } } },
      select: { city: true },
      distinct: ["city"],
    }),
    // Districts to offer — narrowed to the chosen city so the list stays relevant.
    prisma.location.findMany({
      where: {
        staff: { some: { onboardedAt: { not: null }, isPublished: true } },
        district: { not: null },
      },
      select: { district: true, city: true },
      distinct: ["district"],
    }),
  ]);
  const importedLocationRows = await prisma.importedBusiness.findMany({
    where: { publicationStatus: "PUBLISHED" },
    select: { id: true, city: true, district: true, countryCode: true, importResults: { take: 1, orderBy: { createdAt: "desc" }, select: { job: { select: { city: { select: { name: true, countryCode: true } } } } } } },
  });
  const importedCatalogCity = (row: (typeof importedLocationRows)[number]) => catalogCityName(row.importResults[0]?.job.city.name ?? row.city, row.importResults[0]?.job.city.countryCode ?? row.countryCode) ?? "";
  const cities = [...new Set([...cityRows.map((r) => catalogCityName(r.city, "UA")), ...importedLocationRows.map(importedCatalogCity)].filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "uk"));
  const districtOptions = [...new Set([...districtRows.filter((r) => !city || sameCanonicalCity(r.city, city, "UA")).map((r) => canonicalKyivDistrict(r.district)), ...importedLocationRows.filter((r) => !city || sameCanonicalCity(importedCatalogCity(r), city, r.countryCode)).map((r) => canonicalKyivDistrict(r.district))].filter((d): d is string => Boolean(d)))].sort((a, b) => a.localeCompare(b, "uk"));
  const isKyiv = Boolean(city && sameCanonicalCity(city, "Київ", "UA"));
  const districts = isKyiv ? districtOptions : [];
  const requestedDistrict = canonicalKyivDistrict(districtParam);
  const district = isKyiv && requestedDistrict && districtOptions.includes(requestedDistrict) ? requestedDistrict : undefined;
  const selectedCategoryName = category ? categories.find((item) => item.slug === category)?.name : undefined;
  const pageTitle = selectedCategoryName
    ? `${selectedCategoryName} у місті ${city ?? "вашому місті"}`
    : `Послуги салонів краси у місті ${city ?? "вашому місті"}`;

  const minPriceCents = minPrice ? Math.round(Number(minPrice) * 100) : undefined;
  const maxPriceCents = maxPrice ? Math.round(Number(maxPrice) * 100) : undefined;

  // `category` is a top-level vertical slug; match services whose (leaf)
  // category is that vertical or sits under it.
  const serviceFilter: Prisma.StaffServiceWhereInput = {
    isActive: true,
    ...(category
      ? { category: { OR: [{ slug: category }, { parent: { slug: category } }] } }
      : {}),
    ...(minPriceCents !== undefined ? { priceCents: { gte: minPriceCents } } : {}),
    ...(maxPriceCents !== undefined ? { priceCents: { lte: maxPriceCents } } : {}),
  };

  // Build a single location filter — separate `location:` spreads would
  // overwrite each other, dropping the city filter when a type is also set.
  const locationFilter: Prisma.LocationWhereInput = {};
  if (type === "salon") locationFilter.organization = { type: "SALON" };
  if (type === "solo") locationFilter.organization = { type: "SOLO" };
  if (city) {
    const cityVariants = cityRows.filter((row) => sameCanonicalCity(row.city, city, "UA")).map((row) => row.city);
    locationFilter.city = { in: cityVariants.length ? cityVariants : [city], mode: "insensitive" };
  }
  if (district) {
    const districtVariants = districtRows
      .filter((row) => sameKyivDistrict(row.district, district))
      .map((row) => row.district)
      .filter((value): value is string => Boolean(value));
    locationFilter.district = { in: districtVariants.length ? districtVariants : [district], mode: "insensitive" };
  }

  const staffTextFilter: Prisma.StaffWhereInput | undefined = q ? {
    OR: [
      { displayName: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { bio: { contains: q, mode: "insensitive" } },
      { location: { address: { contains: q, mode: "insensitive" } } },
      { location: { organization: { name: { contains: q, mode: "insensitive" } } } },
      { services: { some: { isActive: true, displayName: { contains: q, mode: "insensitive" } } } },
      { services: { some: { isActive: true, category: { name: { contains: q, mode: "insensitive" } } } } },
    ],
  } : undefined;

  let staffRows = await prisma.staff.findMany({
    where: {
      onboardedAt: { not: null },
      isPublished: true,
      ...(Object.keys(locationFilter).length ? { location: locationFilter } : {}),
      services: { some: serviceFilter },
      ...(staffTextFilter ?? {}),
    },
    include: {
      location: { include: { organization: true } },
      services: { where: serviceFilter, include: { category: true } },
      avatar: { select: { updatedAt: true } },
    },
  });
  if (city) staffRows = staffRows.filter((staff) => sameCanonicalCity(staff.location.city, city, "UA"));
  if (district) staffRows = staffRows.filter((staff) => sameKyivDistrict(staff.location.district, district));

  const matchingImportedIds = (city || district)
    ? importedLocationRows.filter((row) => {
        const rowCity = importedCatalogCity(row);
        return (!city || sameCanonicalCity(rowCity, city, row.countryCode)) && (!district || sameKyivDistrict(row.district, district));
      }).map((row) => row.id)
    : null;
  const importedServiceFilter: Prisma.ImportedBusinessServiceDraftWhereInput = {
    status: "APPROVED",
    ...(category ? { OR: [{ categorySlug: category }, { categorySlug: { startsWith: `${category}.` } }] } : {}),
    ...(minPriceCents !== undefined ? { priceMinor: { gte: minPriceCents } } : {}),
    ...(maxPriceCents !== undefined ? { priceMinor: { lte: maxPriceCents } } : {}),
  };
  const importedRows = type === "solo" || matchingImportedIds?.length === 0 ? [] : await prisma.importedBusiness.findMany({
    where: {
      publicationStatus: "PUBLISHED",
      ...(matchingImportedIds ? { id: { in: matchingImportedIds } } : {}),
      ...((category || minPriceCents !== undefined || maxPriceCents !== undefined) ? { serviceDrafts: { some: importedServiceFilter } } : {}),
      ...(q ? { OR: [
        { name: { contains: q, mode: "insensitive" } },
        { formattedAddress: { contains: q, mode: "insensitive" } },
        { nationalPhone: { contains: q } },
        { internationalPhone: { contains: q } },
        { websiteUri: { contains: q, mode: "insensitive" } },
        { serviceDrafts: { some: { status: "APPROVED", displayName: { contains: q, mode: "insensitive" } } } },
      ] } : {}),
    },
    include: { serviceDrafts: { where: { status: "APPROVED" } }, importResults: { take: 1, orderBy: { createdAt: "desc" }, include: { job: { include: { city: true } } } } },
  });

  const ratingStats = await getRatingStatsForStaff(staffRows.map((s) => s.id));

  let results: (MasterListingItem & { staffId: string })[] = staffRows
    .filter((s) => s.services.length > 0)
    .map((s) => {
      const prices = s.services.map((sv) => sv.priceCents);
      const stats = ratingStats.get(s.id);
      return {
        staffId: s.id,
        username: s.username,
        displayName: s.displayName,
        bio: s.bio,
        city: canonicalCityName(s.location.city, "UA"),
        address: s.location.address,
        organizationType: s.location.organization.type,
        categoryNames: [...new Set(s.services.map((sv) => sv.category.name))],
        minPriceCents: Math.min(...prices),
        maxPriceCents: Math.max(...prices),
        avgRating: stats?.avgRating,
        reviewCount: stats?.reviewCount,
        ratingSource: "platform" as const,
        avatarUrl: s.avatar ? `/api/avatar/${encodeURIComponent(s.username)}?v=${s.avatar.updatedAt.getTime()}` : undefined,
        searchTerms: s.services.map((service) => service.displayName),
      };
    });

  for (const salon of importedRows) {
    const salonCity = canonicalCityName(salon.importResults[0]?.job.city.name ?? salon.city, salon.importResults[0]?.job.city.countryCode ?? salon.countryCode);
    if (city && !sameCanonicalCity(salonCity, city, salon.countryCode)) continue;
    if (district && !sameKyivDistrict(salon.district, district)) continue;
    let drafts = salon.serviceDrafts;
    if (category) drafts = drafts.filter((draft) => draft.categorySlug === category || draft.categorySlug?.startsWith(`${category}.`));
    if (minPriceCents !== undefined) drafts = drafts.filter((draft) => draft.priceMinor >= minPriceCents);
    if (maxPriceCents !== undefined) drafts = drafts.filter((draft) => draft.priceMinor <= maxPriceCents);
    if ((category || minPriceCents !== undefined || maxPriceCents !== undefined) && drafts.length === 0) continue;
    const prices = drafts.map((draft) => draft.priceMinor);
    const categoryNames = [...new Set(drafts.map((draft) => draft.categorySlug).filter((value): value is string => Boolean(value)))];
    results.push({
      staffId: `imported:${salon.id}`,
      username: salon.slug,
      displayName: salon.name,
      bio: null,
      city: salonCity,
      address: salon.formattedAddress,
      organizationType: "SALON",
      categoryNames,
      minPriceCents: prices.length ? Math.min(...prices) : 0,
      maxPriceCents: prices.length ? Math.max(...prices) : 0,
      currencyCode: drafts[0]?.currencyCode,
      avgRating: salon.rating ?? undefined,
      reviewCount: salon.userRatingCount ?? undefined,
      ratingSource: "google",
      profileHref: salon.websiteUri ?? salon.googleMapsUri ?? undefined,
      actionLabel: salon.websiteUri ? "Відкрити сайт" : "Google Maps",
      phone: salon.internationalPhone ?? salon.nationalPhone ?? undefined,
      searchTerms: drafts.map((draft) => draft.displayName),
    });
  }

  if (q) {
    const normalizedQuery = q.toLocaleLowerCase("uk");
    results = results.filter((result) => [
      result.displayName,
      result.username,
      result.bio,
      result.city,
      result.address,
      result.phone,
      result.organizationType,
      ...result.categoryNames,
      ...(result.searchTerms ?? []),
    ]
      .some((value) => value?.toLocaleLowerCase("uk").includes(normalizedQuery)));
  }

  const minRatingNum = minRating ? Number(minRating) : undefined;
  if (minRatingNum !== undefined && !Number.isNaN(minRatingNum)) {
    results = results.filter((r) => (r.avgRating ?? 0) >= minRatingNum);
  }

  if (sort === "price_asc") {
    results.sort((a, b) => a.minPriceCents - b.minPriceCents);
  } else if (sort === "price_desc") {
    results.sort((a, b) => b.minPriceCents - a.minPriceCents);
  } else if (sort === "rating_desc") {
    results.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-heading text-3xl font-bold">{pageTitle}</h1>
        <p className="text-muted-foreground mt-1">
          Оберіть послугу, місто й ціну — покажемо майстрів, які підходять.
        </p>
      </div>

      <form method="get" className="flex w-full gap-2">
        {type && type !== "all" && <input type="hidden" name="type" value={type} />}
        {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
        {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
        {minRating && <input type="hidden" name="minRating" value={minRating} />}
        {sort && sort !== "default" && <input type="hidden" name="sort" value={sort} />}
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input name="q" defaultValue={q} placeholder="Назва салону, майстер, послуга або адреса" className="pl-9" aria-label="Пошуковий запит" />
        </div>
        <Button type="submit"><SearchIcon />Знайти</Button>
      </form>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <SearchFilters
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          cities={cities}
          districts={districts}
          defaultValues={{
            category,
            city,
            district,
            type: type ?? "all",
            minPrice,
            maxPrice,
            minRating,
            sort: sort ?? "default",
            q,
          }}
        />

        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-muted-foreground text-sm">{results.length === 0 ? "Нічого не знайдено" : `Знайдено результатів: ${results.length}`}</p><SearchSort value={sort ?? "default"} /></div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
              <div className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-full">
                <SearchIcon className="size-6" />
              </div>
              <p className="font-medium">Поки немає майстрів за вашим запитом</p>
              <p className="text-muted-foreground max-w-sm text-sm">
                Спробуйте змінити фільтри — інше місто, ширший ціновий діапазон або іншу послугу.
              </p>
            </div>
          ) : (
            <LazyListingGrid key={`${city ?? "all"}:${district ?? "all"}:${category ?? "all"}:${type ?? "all"}:${sort ?? "default"}`} items={results} />
          )}
        </div>
      </div>
    </main>
  );
}
