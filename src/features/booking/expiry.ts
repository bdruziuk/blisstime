import { prisma } from "@/lib/prisma";

/**
 * There's no background worker for this MVP, so an expired hold is only
 * ever noticed (and flipped from PENDING to EXPIRED) the next time someone
 * reads or writes bookings for that staff member. Must run before any
 * availability check or booking insert, since the DB exclusion constraint
 * still treats PENDING as blocking regardless of how stale it is.
 */
export async function expireStaleHolds(staffId: string) {
  await prisma.booking.updateMany({
    where: {
      staffId,
      status: "PENDING",
      holdExpiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });
}
