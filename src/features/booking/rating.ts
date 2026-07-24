import { prisma } from "@/lib/prisma";

export type RatingStats = { avgRating: number; reviewCount: number };

/** Single-staff rating lookup, e.g. for the public master page. */
export async function getStaffRatingStats(staffId: string): Promise<RatingStats | null> {
  const agg = await prisma.review.aggregate({
    where: { booking: { staffId } },
    _avg: { rating: true },
    _count: true,
  });
  if (agg._count === 0 || agg._avg.rating === null) return null;
  return { avgRating: agg._avg.rating, reviewCount: agg._count };
}

/** Batch rating lookup for a set of staff, e.g. search results. */
export async function getRatingStatsForStaff(
  staffIds: string[]
): Promise<Map<string, RatingStats>> {
  if (staffIds.length === 0) return new Map();

  const reviewedBookings = await prisma.booking.findMany({
    where: { staffId: { in: staffIds }, review: { isNot: null } },
    select: { staffId: true, review: { select: { rating: true } } },
  });

  const sums = new Map<string, { sum: number; count: number }>();
  for (const b of reviewedBookings) {
    if (!b.review) continue;
    const entry = sums.get(b.staffId) ?? { sum: 0, count: 0 };
    entry.sum += b.review.rating;
    entry.count += 1;
    sums.set(b.staffId, entry);
  }

  const result = new Map<string, RatingStats>();
  for (const [staffId, { sum, count }] of sums) {
    result.set(staffId, { avgRating: sum / count, reviewCount: count });
  }
  return result;
}
