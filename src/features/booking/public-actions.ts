"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "./schemas";
import { normalizePhone } from "./phone";
import { generateSlotsForDate, getDayBoundsUTC, type WorkingHours } from "./slots";
import { insertBookingForClient, decideInitialBookingStatus } from "./create-booking";
import { expireStaleHolds } from "./expiry";
import { getMedianResponseMinutes } from "./response-time";
import { notifyMasterNewBooking } from "@/features/telegram/notify";
import { BOT_USERNAME } from "@/lib/telegram";
import type { BookableStatus } from "./create-booking";

export type ActionState =
  | { error: string }
  | {
      success: true;
      status: BookableStatus;
      medianResponseMinutes: number | null;
      // Deep link for the client to connect Telegram, or null if already linked.
      telegramDeepLink: string | null;
    }
  | undefined;

export async function getAvailableSlots(
  staffId: string,
  serviceIds: string[],
  dateISO: string,
  excludeBookingId?: string
): Promise<{ startISO: string; endISO: string }[]> {
  await expireStaleHolds(staffId);

  if (serviceIds.length === 0) return [];

  const [staff, servicesForStaff] = await Promise.all([
    prisma.staff.findUnique({ where: { id: staffId }, include: { location: true } }),
    prisma.staffService.findMany({ where: { id: { in: serviceIds }, staffId } }),
  ]);
  if (!staff || servicesForStaff.length !== serviceIds.length) return [];

  const totalDuration = servicesForStaff.reduce((sum, s) => sum + s.durationMinutes, 0);

  const { start: dayStart, end: dayEnd } = getDayBoundsUTC(dateISO);

  const [existingBookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        staffId,
        status: { notIn: ["CANCELLED", "NO_SHOW", "DECLINED", "EXPIRED"] },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { slotStart: true, slotEnd: true },
    }),
    prisma.scheduleBlock.findMany({
      where: { staffId, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  const slots = generateSlotsForDate({
    dateISO,
    workingHours: staff.location.workingHours as WorkingHours,
    durationMinutes: totalDuration,
    existingBookings,
    blockedRanges: blocks.map((b) => ({ start: b.startsAt, end: b.endsAt })),
  });

  return slots.map((s) => ({ startISO: s.start.toISOString(), endISO: s.end.toISOString() }));
}

export async function createBooking(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = bookingSchema.safeParse({
    serviceIds: formData.get("serviceIds"),
    slotStartISO: formData.get("slotStartISO"),
    clientName: formData.get("clientName"),
    clientPhone: formData.get("clientPhone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { serviceIds, slotStartISO, clientName, clientPhone } = parsed.data;

  const phone = normalizePhone(clientPhone);
  if (!phone) {
    return { error: "Некоректний номер телефону" };
  }

  // All selected services must belong to the same staff member. Ordering is
  // preserved to match the client's selection (first = primary).
  const services = await prisma.staffService.findMany({
    where: { id: { in: serviceIds } },
    include: { staff: true },
  });
  const orderedServices = serviceIds
    .map((id) => services.find((s) => s.id === id))
    .filter((s): s is (typeof services)[number] => Boolean(s));
  const staffId = orderedServices[0]?.staffId;
  if (
    orderedServices.length !== serviceIds.length ||
    !staffId ||
    orderedServices.some((s) => s.staffId !== staffId)
  ) {
    return { error: "Послугу не знайдено" };
  }
  const staff = orderedServices[0].staff;

  const slotStart = new Date(slotStartISO);
  if (Number.isNaN(slotStart.getTime())) {
    return { error: "Некоректний час" };
  }
  const totalDuration = orderedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const slotEnd = new Date(slotStart.getTime() + totalDuration * 60_000);

  await expireStaleHolds(staffId);

  const existingClient = await prisma.client.findUnique({ where: { phone } });

  const { status, holdExpiresAt } = decideInitialBookingStatus({
    confirmationMode: staff.confirmationMode,
    holdDurationMinutes: staff.holdDurationMinutes,
    clientReliabilityScore: existingClient?.reliabilityScore ?? null,
  });

  const result = await insertBookingForClient({
    staffId,
    serviceIds: orderedServices.map((s) => s.id),
    slotStart,
    slotEnd,
    clientPhone: phone,
    clientName,
    status,
    holdExpiresAt,
  });

  if ("error" in result) return result;

  // Best-effort master notification — a Telegram hiccup must not fail the booking.
  try {
    await notifyMasterNewBooking(result.bookingId);
  } catch (err) {
    console.error("[telegram] notify on new booking failed:", err);
  }

  const medianResponseMinutes =
    result.status === "PENDING" ? await getMedianResponseMinutes(staffId) : null;

  // Offer a Telegram connect link unless this client is already linked.
  let telegramDeepLink: string | null = null;
  const client = await prisma.client.findUnique({ where: { phone } });
  if (client && !client.telegramChatId) {
    const token = `c_${randomUUID()}`;
    await prisma.client.update({ where: { id: client.id }, data: { telegramLinkToken: token } });
    telegramDeepLink = `https://t.me/${BOT_USERNAME}?start=${token}`;
  }

  return { success: true, status: result.status, medianResponseMinutes, telegramDeepLink };
}
