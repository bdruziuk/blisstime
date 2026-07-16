"use server";

import { prisma } from "@/lib/prisma";
import { bookingSchema } from "./schemas";
import { normalizePhone } from "./phone";
import { generateSlotsForDate, type WorkingHours } from "./slots";
import { insertBookingForClient, decideInitialBookingStatus } from "./create-booking";
import { expireStaleHolds } from "./expiry";
import { getMedianResponseMinutes } from "./response-time";
import type { BookableStatus } from "./create-booking";

export type ActionState =
  | { error: string }
  | { success: true; status: BookableStatus; medianResponseMinutes: number | null }
  | undefined;

export async function getAvailableSlots(
  staffId: string,
  serviceId: string,
  dateISO: string,
  excludeBookingId?: string
): Promise<{ startISO: string; endISO: string }[]> {
  await expireStaleHolds(staffId);

  const [staff, service] = await Promise.all([
    prisma.staff.findUnique({ where: { id: staffId }, include: { location: true } }),
    prisma.staffService.findUnique({ where: { id: serviceId } }),
  ]);
  if (!staff || !service || service.staffId !== staffId) return [];

  const existingBookings = await prisma.booking.findMany({
    where: {
      staffId,
      status: { notIn: ["CANCELLED", "NO_SHOW", "DECLINED", "EXPIRED"] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
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

  const service = await prisma.staffService.findUnique({
    where: { id: serviceId },
    include: { staff: true },
  });
  if (!service) {
    return { error: "Послугу не знайдено" };
  }

  const slotStart = new Date(slotStartISO);
  if (Number.isNaN(slotStart.getTime())) {
    return { error: "Некоректний час" };
  }
  const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60_000);

  await expireStaleHolds(service.staffId);

  const existingClient = await prisma.client.findUnique({ where: { phone } });

  const { status, holdExpiresAt } = decideInitialBookingStatus({
    confirmationMode: service.staff.confirmationMode,
    holdDurationMinutes: service.staff.holdDurationMinutes,
    clientReliabilityScore: existingClient?.reliabilityScore ?? null,
  });

  const result = await insertBookingForClient({
    staffId: service.staffId,
    serviceId: service.id,
    slotStart,
    slotEnd,
    clientPhone: phone,
    clientName,
    status,
    holdExpiresAt,
  });

  if ("error" in result) return result;

  const medianResponseMinutes =
    result.status === "PENDING" ? await getMedianResponseMinutes(service.staffId) : null;

  return { success: true, status: result.status, medianResponseMinutes };
}
