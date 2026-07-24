import { Search as SearchIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SearchFilters } from "@/features/search/components/search-filters";
import { MasterListingCard, type MasterListingItem } from "@/features/search/components/master-listing-card";
import { getRatingStatsForStaff } from "@/features/booking/rating";

type SearchPageParams = {
  category?: string;
  city?: string;
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
  const { category, city, type, minPrice, maxPrice, minRating, sort } = await searchParams;

  const [categories, cityRows] = await Promise.all([
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
  ]);
  const cities = [...new Set(cityRows.map((r) => r.city).filter(Boolean))].sort();

  const minPriceCents = minPrice ? Math.round(Number(minPrice) * 100) : undefined;
  const maxPriceCents = maxPrice ? Math.round(Number(maxPrice) * 100) : undefined;

  const serviceFilter = {
    isActive: true,
    ...(category ? { categoryId: category } : {}),
    ...(minPriceCents !== undefined ? { priceCents: { gte: minPriceCents } } : {}),
    ...(maxPriceCents !== undefined ? { priceCents: { lte: maxPriceCents } } : {}),
  };

  const staffRows = await prisma.staff.findMany({
    where: {
      onboardedAt: { not: null },
      ...(city ? { location: { city: { contains: city, mode: "insensitive" } } } : {}),
      ...(type === "salon" ? { location: { organization: { type: "SALON" } } } : {}),
      ...(type === "solo" ? { location: { organization: { type: "SOLO" } } } : {}),
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
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-heading text-3xl font-bold">Знайти майстра</h1>
        <p className="text-muted-foreground mt-1">
          Оберіть послугу, місто й ціну — покажемо майстрів, які підходять.
        </p>
      </div>

      <SearchFilters
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          parentName: c.parent?.name ?? "",
        }))}
        cities={cities}
        defaultValues={{
          category,
          city,
          type: type ?? "all",
          minPrice,
          maxPrice,
          minRating,
          sort: sort ?? "default",
        }}
      />

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
    </main>
  );
}
