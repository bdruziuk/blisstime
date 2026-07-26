import { prisma } from "@/lib/prisma";

export type RatingStats = { avgRating: number; reviewCount: number };

export type StaffReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  clientName: string | null;
  serviceName: string;
};

/** Public-safe first name only — never expose a client's full name in reviews. */
function firstName(name: string | null): string | null {
  if (!name) return null;
  return name.trim().split(/\s+/)[0] || null;
}

/** Reviews for the public master page, newest first. */
export async function getStaffReviews(staffId: string, limit = 20): Promise<StaffReview[]> {
  const reviews = await prisma.review.findMany({
    where: { booking: { staffId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      booking: {
        select: {
          client: { select: { name: true } },
          service: { select: { displayName: true } },
          services: { select: { service: { select: { displayName: true } } } },
        },
      },
    },
  });

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    clientName: firstName(r.booking.client.name),
    serviceName:
      r.booking.services.length > 0
        ? r.booking.services.map((s) => s.service.displayName).join(" + ")
        : r.booking.service.displayName,
  }));
}

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
