import { prisma } from "@/lib/prisma";

const SAMPLE_SIZE = 20;

/** Median minutes-to-respond over the master's recent confirmed/declined requests. */
export async function getMedianResponseMinutes(staffId: string): Promise<number | null> {
  const recent = await prisma.booking.findMany({
    where: {
      staffId,
      respondedAt: { not: null },
      status: { in: ["CONFIRMED", "DECLINED"] },
    },
    orderBy: { respondedAt: "desc" },
    take: SAMPLE_SIZE,
    select: { createdAt: true, respondedAt: true },
  });
  if (recent.length === 0) return null;

  const minutes = recent
    .map((b) => (b.respondedAt!.getTime() - b.createdAt.getTime()) / 60_000)
    .sort((a, b) => a - b);

  const mid = Math.floor(minutes.length / 2);
  const median = minutes.length % 2 === 0 ? (minutes[mid - 1] + minutes[mid]) / 2 : minutes[mid];
  return Math.round(median);
}
