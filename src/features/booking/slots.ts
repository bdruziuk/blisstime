import { fromZonedTime } from "date-fns-tz";
import type { Day } from "./schemas";

export const BUSINESS_TIMEZONE = "Europe/Kyiv";
const SLOT_STEP_MINUTES = 15;

export type DayHours = { open: boolean; from: string; to: string };
export type WorkingHours = Partial<Record<Day, DayHours>>;

export type BookedRange = { slotStart: Date; slotEnd: Date };

export type BlockedRange = { start: Date; end: Date };

export type Slot = { start: Date; end: Date };

function dayKeyInTimezone(date: Date, timezone: string): Day {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(date);
  const map: Record<string, Day> = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
  };
  return map[weekday];
}

/**
 * Generates bookable slots for a given calendar date (YYYY-MM-DD, interpreted
 * in the business timezone), stepping every 15 minutes across the working
 * hours window, minus any slot that would overlap an existing booking.
 */
export function generateSlotsForDate({
  dateISO,
  workingHours,
  durationMinutes,
  existingBookings,
  blockedRanges = [],
  now = new Date(),
  timezone = BUSINESS_TIMEZONE,
}: {
  dateISO: string;
  workingHours: WorkingHours;
  durationMinutes: number;
  existingBookings: BookedRange[];
  /** Master-defined days off / breaks — slots overlapping these are excluded. */
  blockedRanges?: BlockedRange[];
  now?: Date;
  timezone?: string;
}): Slot[] {
  const probe = fromZonedTime(`${dateISO}T12:00:00`, timezone);
  const day = dayKeyInTimezone(probe, timezone);
  const hours = workingHours[day];
  if (!hours?.open) return [];

  const dayStart = fromZonedTime(`${dateISO}T${hours.from}:00`, timezone);
  const dayEnd = fromZonedTime(`${dateISO}T${hours.to}:00`, timezone);

  const slots: Slot[] = [];
  const stepMs = SLOT_STEP_MINUTES * 60_000;
  const durationMs = durationMinutes * 60_000;

  for (let start = dayStart.getTime(); start + durationMs <= dayEnd.getTime(); start += stepMs) {
    const slotStart = new Date(start);
    const slotEnd = new Date(start + durationMs);

    if (slotStart < now) continue;

    const overlaps = existingBookings.some(
      (b) => slotStart < b.slotEnd && slotEnd > b.slotStart
    );
    if (overlaps) continue;

    const blocked = blockedRanges.some(
      (b) => slotStart < b.end && slotEnd > b.start
    );
    if (blocked) continue;

    slots.push({ start: slotStart, end: slotEnd });
  }

  return slots;
}

/** UTC [start, end) bounds for a calendar date (YYYY-MM-DD) in the business timezone. */
export function getDayBoundsUTC(dateISO: string, timezone: string = BUSINESS_TIMEZONE) {
  const start = fromZonedTime(`${dateISO}T00:00:00`, timezone);
  const end = fromZonedTime(`${dateISO}T23:59:59.999`, timezone);
  return { start, end };
}
