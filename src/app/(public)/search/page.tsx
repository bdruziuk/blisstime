import { Search as SearchIcon } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { SearchFilters } from "@/features/search/components/search-filters";
import { MasterListingCard, type MasterListingItem } from "@/features/search/components/master-listing-card";
import { getRatingStatsForStaff } from "@/features/booking/rating";

type SearchPageParams = {
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
}: {
  searchParams: Promise<SearchPageParams>;
}) {
  const { category, city, district, type, minPrice, maxPrice, minRating, sort } =
    await searchParams;

  const [categories, cityRows, districtRows] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: { parentId: { not: null } },
      include: { parent: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { staff: { some: { onboardedAt: { not: null } } } },
      select: { city: true },
      distinct: ["city"],
    }),
    // Districts to offer — narrowed to the chosen city so the list stays relevant.
    prisma.location.findMany({
      where: {
        staff: { some: { onboardedAt: { not: null } } },
        district: { not: null },
        ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      },
      select: { district: true },
      distinct: ["district"],
    }),
  ]);
  const cities = [...new Set(cityRows.map((r) => r.city).filter(Boolean))].sort();
  const districts = [...new Set(districtRows.map((r) => r.district).filter((d): d is string => Boolean(d)))].sort();

  const minPriceCents = minPrice ? Math.round(Number(minPrice) * 100) : undefined;
  const maxPriceCents = maxPrice ? Math.round(Number(maxPrice) * 100) : undefined;

  const serviceFilter = {
    isActive: true,
    ...(category ? { categoryId: category } : {}),
    ...(minPriceCents !== undefined ? { priceCents: { gte: minPriceCents } } : {}),
    ...(maxPriceCents !== undefined ? { priceCents: { lte: maxPriceCents } } : {}),
  };

  // Build a single location filter — separate `location:` spreads would
  // overwrite each other, dropping the city filter when a type is also set.
  const locationFilter: Prisma.LocationWhereInput = {};
  if (city) locationFilter.city = { contains: city, mode: "insensitive" };
  if (district) locationFilter.district = { equals: district, mode: "insensitive" };
  if (type === "salon") locationFilter.organization = { type: "SALON" };
  if (type === "solo") locationFilter.organization = { type: "SOLO" };

  const staffRows = await prisma.staff.findMany({
    where: {
      onboardedAt: { not: null },
      ...(Object.keys(locationFilter).length ? { location: locationFilter } : {}),
      services: { some: serviceFilter },
    },
    include: {
      location: { include: { organization: true } },
      services: { where: serviceFilter, include: { category: true } },
    },
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
        city: s.location.city,
        address: s.location.address,
        organizationType: s.location.organization.type,
        categoryNames: [...new Set(s.services.map((sv) => sv.category.name))],
        minPriceCents: Math.min(...prices),
        maxPriceCents: Math.max(...prices),
        avgRating: stats?.avgRating,
        reviewCount: stats?.reviewCount,
      };
    });

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
        <h1 className="font-heading text-3xl font-bold">Знайти майстра</h1>
        <p className="text-muted-foreground mt-1">
          Оберіть послугу, місто й ціну — покажемо майстрів, які підходять.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <SearchFilters
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            parentName: c.parent?.name ?? "",
          }))}
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
          }}
        />

        <div className="flex-1">
          <p className="text-muted-foreground mb-4 text-sm">
            {results.length === 0
              ? "Нічого не знайдено"
              : `Знайдено майстрів: ${results.length}`}
          </p>

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
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((item) => (
                <MasterListingCard key={item.staffId} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
