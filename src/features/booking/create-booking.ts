import { prisma } from "@/lib/prisma";

export type CreateBookingResult = { error: string } | { success: true };

/**
 * Finds/creates the client by phone and inserts the booking, re-checking
 * for overlaps immediately before the insert. The `booking_no_overlap`
 * Postgres exclusion constraint is the final backstop against races.
 */
export async function insertBookingForClient({
  staffId,
  serviceId,
  slotStart,
  slotEnd,
  clientPhone,
  clientName,
}: {
  staffId: string;
  serviceId: string;
  slotStart: Date;
  slotEnd: Date;
  clientPhone: string;
  clientName: string;
}): Promise<CreateBookingResult> {
  const overlapping = await prisma.booking.findFirst({
    where: {
      staffId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      slotStart: { lt: slotEnd },
      slotEnd: { gt: slotStart },
    },
  });
  if (overlapping) {
    return { error: "Цей час вже зайнято, оберіть інший" };
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
          serviceId,
          slotStart,
          slotEnd,
          status: "CONFIRMED",
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("booking_no_overlap")) {
      return { error: "Цей час щойно зайняли, оберіть інший" };
    }
    throw error;
  }

  return { success: true };
}
