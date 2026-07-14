"use server";

import { prisma } from "@/lib/prisma";
import { bookingSchema } from "./schemas";
import { normalizePhone } from "./phone";
import { generateSlotsForDate, type WorkingHours } from "./slots";

export type ActionState = { error: string } | { success: true } | undefined;

export async function getAvailableSlots(
  staffId: string,
  serviceId: string,
  dateISO: string
): Promise<{ startISO: string; endISO: string }[]> {
  const [staff, service] = await Promise.all([
    prisma.staff.findUnique({ where: { id: staffId }, include: { location: true } }),
    prisma.staffService.findUnique({ where: { id: serviceId } }),
  ]);
  if (!staff || !service || service.staffId !== staffId) return [];

  const existingBookings = await prisma.booking.findMany({
    where: { staffId, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
    select: { slotStart: true, slotEnd: true },
  });

  const slots = generateSlotsForDate({
    dateISO,
    workingHours: staff.location.workingHours as WorkingHours,
    durationMinutes: service.durationMinutes,
    existingBookings,
  });

  return slots.map((s) => ({ startISO: s.start.toISOString(), endISO: s.end.toISOString() }));
}

export async function createBooking(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = bookingSchema.safeParse({
    serviceId: formData.get("serviceId"),
    slotStartISO: formData.get("slotStartISO"),
    clientName: formData.get("clientName"),
    clientPhone: formData.get("clientPhone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { serviceId, slotStartISO, clientName, clientPhone } = parsed.data;

  const phone = normalizePhone(clientPhone);
  if (!phone) {
    return { error: "Некоректний номер телефону" };
  }

  const service = await prisma.staffService.findUnique({ where: { id: serviceId } });
  if (!service) {
    return { error: "Послугу не знайдено" };
  }

  const slotStart = new Date(slotStartISO);
  if (Number.isNaN(slotStart.getTime())) {
    return { error: "Некоректний час" };
  }
  const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60_000);

  const overlapping = await prisma.booking.findFirst({
    where: {
      staffId: service.staffId,
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
        where: { phone },
        update: { name: clientName },
        create: { phone, name: clientName },
      });

      await tx.booking.create({
        data: {
          clientId: client.id,
          staffId: service.staffId,
          serviceId: service.id,
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
