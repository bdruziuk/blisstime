import { prisma } from "@/lib/prisma";

export type BookableStatus = "PENDING" | "CONFIRMED";

export type CreateBookingResult =
  | { error: string }
  | { success: true; status: BookableStatus };

const AUTO_TRUSTED_MIN_RELIABILITY = 70;

/**
 * Decides whether a client-initiated booking gets auto-confirmed or lands
 * as a pending request with a hold, per the master's confirmationMode.
 * Manual admin-entered bookings skip this entirely (always CONFIRMED).
 */
export function decideInitialBookingStatus({
  confirmationMode,
  holdDurationMinutes,
  clientReliabilityScore,
}: {
  confirmationMode: "MANUAL" | "AUTO_ALL" | "AUTO_TRUSTED";
  holdDurationMinutes: number;
  clientReliabilityScore: number | null;
}): { status: BookableStatus; holdExpiresAt: Date | null } {
  const autoConfirm =
    confirmationMode === "AUTO_ALL" ||
    (confirmationMode === "AUTO_TRUSTED" &&
      (clientReliabilityScore ?? 100) >= AUTO_TRUSTED_MIN_RELIABILITY);

  if (autoConfirm) {
    return { status: "CONFIRMED", holdExpiresAt: null };
  }
  return {
    status: "PENDING",
    holdExpiresAt: new Date(Date.now() + holdDurationMinutes * 60_000),
  };
}

/**
 * Finds/creates the client by phone and inserts the booking, re-checking
 * for overlaps immediately before the insert. The `booking_no_overlap`
 * Postgres exclusion constraint (which also treats an active PENDING hold
 * as blocking) is the final backstop against races.
 */
export async function insertBookingForClient({
  staffId,
  serviceIds,
  slotStart,
  slotEnd,
  clientPhone,
  clientName,
  status,
  holdExpiresAt,
}: {
  staffId: string;
  /** One or more procedures performed back-to-back; the first is the primary. */
  serviceIds: string[];
  slotStart: Date;
  slotEnd: Date;
  clientPhone: string;
  clientName: string;
  status: BookableStatus;
  holdExpiresAt: Date | null;
}): Promise<CreateBookingResult> {
  if (serviceIds.length === 0) {
    return { error: "Оберіть хоча б одну послугу" };
  }
  const overlapping = await prisma.booking.findFirst({
    where: {
      staffId,
      status: { notIn: ["CANCELLED", "NO_SHOW", "DECLINED", "EXPIRED"] },
      slotStart: { lt: slotEnd },
      slotEnd: { gt: slotStart },
    },
  });
  if (overlapping) {
    return { error: "Цей час вже зайнято, оберіть інший" };
  }

  const blocked = await prisma.scheduleBlock.findFirst({
    where: { staffId, startsAt: { lt: slotEnd }, endsAt: { gt: slotStart } },
  });
  if (blocked) {
    return { error: "Цей час недоступний (вихідний або перерва)" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const client = await tx.client.upsert({
        where: { phone: clientPhone },
        update: { name: clientName },
        create: { phone: clientPhone, name: clientName },
      });

      await tx.booking.create({
        data: {
          clientId: client.id,
          staffId,
          serviceId: serviceIds[0],
          slotStart,
          slotEnd,
          status,
          holdExpiresAt,
          respondedAt: status === "CONFIRMED" ? new Date() : null,
          services: { create: serviceIds.map((id) => ({ serviceId: id })) },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("booking_no_overlap")) {
      return { error: "Цей час щойно зайняли, оберіть інший" };
    }
    throw error;
  }

  return { success: true, status };
}
