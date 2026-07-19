"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BookingStatus } from "@/generated/prisma/client";
import { bookingSchema, bookingSettingsSchema } from "./schemas";
import { normalizePhone } from "./phone";
import { insertBookingForClient } from "./create-booking";
import { expireStaleHolds } from "./expiry";
import { BUSINESS_TIMEZONE, getDayBoundsUTC } from "./slots";

export type ActionState = { error: string } | undefined;

const LATE_CANCELLATION_WINDOW_MS = 3 * 60 * 60 * 1000;
const LATE_CANCELLATION_SCORE_PENALTY = 10;
const NOT_BLOCKING_STATUSES: BookingStatus[] = ["CANCELLED", "NO_SHOW", "DECLINED", "EXPIRED"];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({
    where: { userId: session.user.id },
  });
  if (!staff) redirect("/register");

  return staff;
}

/** Master taps [Confirm] on a pending request (typically from the Telegram bot). */
export async function confirmBooking(bookingId: string) {
  const staff = await requireStaff();

  await prisma.booking.updateMany({
    where: { id: bookingId, staffId: staff.id, status: "PENDING" },
    data: { status: "CONFIRMED", respondedAt: new Date(), holdExpiresAt: null },
  });

  revalidatePath("/dashboard/bookings");
}

/** Master taps [Decline] on a pending request. */
export async function declineBooking(bookingId: string) {
  const staff = await requireStaff();

  await prisma.booking.updateMany({
    where: { id: bookingId, staffId: staff.id, status: "PENDING" },
    data: { status: "DECLINED", respondedAt: new Date() },
  });

  revalidatePath("/dashboard/bookings");
}

export async function cancelBooking(bookingId: string) {
  const staff = await requireStaff();

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, staffId: staff.id },
  });
  if (!booking || booking.status !== "CONFIRMED") {
    return;
  }

  const isLate = booking.slotStart.getTime() - Date.now() < LATE_CANCELLATION_WINDOW_MS;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    if (isLate) {
      await tx.client.update({
        where: { id: booking.clientId },
        data: {
          lateCancellationCount: { increment: 1 },
          reliabilityScore: { decrement: LATE_CANCELLATION_SCORE_PENALTY },
        },
      });
    }
  });

  revalidatePath("/dashboard/bookings");
}

export async function createManualBooking(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staff = await requireStaff();
  await expireStaleHolds(staff.id);

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

  const service = await prisma.staffService.findFirst({
    where: { id: serviceId, staffId: staff.id },
  });
  if (!service) {
    return { error: "Послугу не знайдено" };
  }

  const slotStart = new Date(slotStartISO);
  if (Number.isNaN(slotStart.getTime())) {
    return { error: "Некоректний час" };
  }
  const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60_000);

  // Master-entered bookings are always immediately confirmed — no
  // request-to-book round trip for something the master typed in themselves.
  const result = await insertBookingForClient({
    staffId: staff.id,
    serviceId: service.id,
    slotStart,
    slotEnd,
    clientPhone: phone,
    clientName,
    status: "CONFIRMED",
    holdExpiresAt: null,
  });

  if ("error" in result) return result;

  revalidatePath("/dashboard/bookings");
  return undefined;
}

export async function addScheduleBlock(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staff = await requireStaff();

  const date = String(formData.get("date") || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Оберіть дату" };
  }

  const wholeDay = formData.get("wholeDay") === "on";
  const reason = String(formData.get("reason") || "").trim() || null;

  let startsAt: Date;
  let endsAt: Date;

  if (wholeDay) {
    ({ start: startsAt, end: endsAt } = getDayBoundsUTC(date));
  } else {
    const fromTime = String(formData.get("fromTime") || "");
    const toTime = String(formData.get("toTime") || "");
    if (!TIME_REGEX.test(fromTime) || !TIME_REGEX.test(toTime)) {
      return { error: "Вкажіть час від і до" };
    }
    startsAt = fromZonedTime(`${date}T${fromTime}:00`, BUSINESS_TIMEZONE);
    endsAt = fromZonedTime(`${date}T${toTime}:00`, BUSINESS_TIMEZONE);
    if (endsAt <= startsAt) {
      return { error: "Час «до» має бути пізніше за «від»" };
    }
  }

  await prisma.scheduleBlock.create({
    data: { staffId: staff.id, startsAt, endsAt, reason },
  });

  revalidatePath("/dashboard/settings");
  return undefined;
}

export async function removeScheduleBlock(blockId: string) {
  const staff = await requireStaff();

  await prisma.scheduleBlock.deleteMany({
    where: { id: blockId, staffId: staff.id },
  });

  revalidatePath("/dashboard/settings");
}

export async function updateBookingSettings(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = bookingSettingsSchema.safeParse({
    confirmationMode: formData.get("confirmationMode"),
    holdDurationMinutes: formData.get("holdDurationMinutes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.staff.update({
    where: { id: staff.id },
    data: parsed.data,
  });

  revalidatePath("/dashboard/settings");
  return undefined;
}

export async function rescheduleBooking(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staff = await requireStaff();
  await expireStaleHolds(staff.id);

  const bookingId = String(formData.get("bookingId") || "");
  const slotStartISO = String(formData.get("slotStartISO") || "");

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, staffId: staff.id },
    include: { service: true },
  });
  if (!booking) {
    return { error: "Запис не знайдено" };
  }

  const slotStart = new Date(slotStartISO);
  if (Number.isNaN(slotStart.getTime())) {
    return { error: "Некоректний час" };
  }
  const slotEnd = new Date(slotStart.getTime() + booking.service.durationMinutes * 60_000);

  const overlapping = await prisma.booking.findFirst({
    where: {
      staffId: staff.id,
      id: { not: booking.id },
      status: { notIn: NOT_BLOCKING_STATUSES },
      slotStart: { lt: slotEnd },
      slotEnd: { gt: slotStart },
    },
  });
  if (overlapping) {
    return { error: "Цей час вже зайнято" };
  }

  try {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { slotStart, slotEnd },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("booking_no_overlap")) {
      return { error: "Цей час щойно зайняли" };
    }
    throw error;
  }

  revalidatePath("/dashboard/bookings");
  return undefined;
}
