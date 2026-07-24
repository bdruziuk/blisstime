import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { getRatingStatsForStaff } from "@/features/booking/rating";
import type { MasterListingItem } from "@/features/search/components/master-listing-card";

export type CatalogCombo = {
  citySlug: string;
  city: string;
  categorySlug: string;
  categoryName: string;
  count: number;
};

/** All (city, top-level category) pairs that currently have at least one onboarded master with an active service — the universe of real, crawlable catalog pages. Never fabricated. */
export async function getCatalogCombos(): Promise<CatalogCombo[]> {
  const staffRows = await prisma.staff.findMany({
    where: { onboardedAt: { not: null } },
    select: {
      location: { select: { city: true } },
      services: {
        where: { isActive: true },
        select: {
          category: {
            select: { slug: true, name: true, parent: { select: { slug: true, name: true } } },
          },
        },
      },
    },
  });

  const combos = new Map<string, CatalogCombo>();
  for (const staff of staffRows) {
    const city = staff.location.city;
    const citySlug = slugify(city);
    for (const service of staff.services) {
      const top = service.category.parent ?? service.category;
      const key = `${citySlug}/${top.slug}`;
      const existing = combos.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        combos.set(key, {
          citySlug,
          city,
          categorySlug: top.slug,
          categoryName: top.name,
          count: 1,
        });
      }
    }
  }

  return [...combos.values()].sort((a, b) => b.count - a.count);
}

export async function resolveCityFromSlug(citySlug: string): Promise<string | null> {
  const rows = await prisma.location.findMany({
    where: { staff: { some: { onboardedAt: { not: null } } } },
    select: { city: true },
    distinct: ["city"],
  });
  const match = rows.find((r) => slugify(r.city) === citySlug);
  return match?.city ?? null;
}

export async function resolveCategoryFromSlug(
  categorySlug: string
): Promise<{ id: string; name: string; slug: string; childIds: string[] } | null> {
  const category = await prisma.serviceCategory.findUnique({
    where: { slug: categorySlug },
    include: { children: { select: { id: true } } },
  });
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    childIds: category.children.map((c) => c.id),
  };
}

export async function getCatalogListings(
  city: string,
  categoryIds: string[]
): Promise<(MasterListingItem & { staffId: string })[]> {
  const serviceFilter = { isActive: true, categoryId: { in: categoryIds } };

  const staffRows = await prisma.staff.findMany({
    where: {
      onboardedAt: { not: null },
      location: { city: { equals: city, mode: "insensitive" } },
      services: { some: serviceFilter },
    },
    include: {
      location: { include: { organization: true } },
      services: { where: serviceFilter, include: { category: true } },
    },
  });

  const ratingStats = await getRatingStatsForStaff(staffRows.map((s) => s.id));

  return staffRows
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
}
