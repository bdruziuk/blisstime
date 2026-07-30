import { prisma } from "@/lib/prisma";
import { getRatingStatsForStaff } from "@/features/booking/rating";

// All landing queries use explicit `select` (never `include`) so a future
// column addition can't break the build-time prerender against a stale DB.

/** Real count of onboarded masters offering each top-level category. */
export async function getVerticalCounts(): Promise<Map<string, number>> {
  const staffRows = await prisma.staff.findMany({
    where: { onboardedAt: { not: null } },
    select: {
      id: true,
      services: {
        where: { isActive: true },
        select: { category: { select: { slug: true, parent: { select: { slug: true } } } } },
      },
    },
  });

  const counts = new Map<string, number>();
  for (const staff of staffRows) {
    const topSlugs = new Set<string>();
    for (const s of staff.services) {
      topSlugs.add(s.category.parent?.slug ?? s.category.slug);
    }
    for (const slug of topSlugs) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return counts;
}

export type TopMaster = {
  username: string;
  displayName: string;
  city: string;
  categoryNames: string[];
  avgRating: number;
  reviewCount: number;
};

/** Highest-rated onboarded masters (real reviews only), best first. */
export async function getTopMasters(limit = 6): Promise<TopMaster[]> {
  const staffRows = await prisma.staff.findMany({
    where: { onboardedAt: { not: null } },
    select: {
      id: true,
      username: true,
      displayName: true,
      location: { select: { city: true } },
      services: { where: { isActive: true }, select: { category: { select: { name: true } } } },
    },
  });
  if (staffRows.length === 0) return [];

  const stats = await getRatingStatsForStaff(staffRows.map((s) => s.id));

  return staffRows
    .map((s) => {
      const stat = stats.get(s.id);
      if (!stat) return null;
      return {
        username: s.username,
        displayName: s.displayName,
        city: s.location.city,
        categoryNames: [...new Set(s.services.map((sv) => sv.category.name))],
        avgRating: stat.avgRating,
        reviewCount: stat.reviewCount,
      };
    })
    .filter((m): m is TopMaster => m !== null)
    .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export type LandingReview = {
  id: string;
  rating: number;
  comment: string;
  clientName: string | null;
  masterName: string;
  masterUsername: string;
  serviceName: string;
};

/** Recent real reviews that have a written comment, for the social-proof block. */
export async function getRecentReviews(limit = 8): Promise<LandingReview[]> {
  const reviews = await prisma.review.findMany({
    where: { comment: { not: null } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      booking: {
        select: {
          client: { select: { name: true } },
          staff: { select: { username: true, displayName: true } },
          service: { select: { displayName: true } },
          services: { select: { service: { select: { displayName: true } } } },
        },
      },
    },
  });

  return reviews
    .filter((r) => r.comment && r.comment.trim().length > 0)
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment as string,
      clientName: r.booking.client.name?.trim().split(/\s+/)[0] ?? null,
      masterName: r.booking.staff.displayName,
      masterUsername: r.booking.staff.username,
      serviceName:
        r.booking.services.length > 0
          ? r.booking.services.map((s) => s.service.displayName).join(" + ")
          : r.booking.service.displayName,
    }));
}

export type LandingStats = { masters: number; completedBookings: number; cities: number };

/** Honest, real counters for the social-proof block (never fabricated). */
export async function getLandingStats(): Promise<LandingStats> {
  const [masters, completedBookings, cityRows] = await Promise.all([
    prisma.staff.count({ where: { onboardedAt: { not: null } } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.location.findMany({
      where: { staff: { some: { onboardedAt: { not: null } } } },
      select: { city: true },
      distinct: ["city"],
    }),
  ]);
  return { masters, completedBookings, cities: cityRows.length };
}
