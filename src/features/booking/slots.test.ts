import { describe, expect, it } from "vitest";
import { generateSlotsForDate, getDayBoundsUTC, type WorkingHours } from "./slots";

const mondayHours: WorkingHours = {
  mon: { open: true, from: "09:00", to: "12:00" },
};

describe("generateSlotsForDate", () => {
  it("generates slots every 15 minutes within working hours", () => {
    const slots = generateSlotsForDate({
      dateISO: "2026-08-03",
      workingHours: mondayHours,
      durationMinutes: 60,
      existingBookings: [],
      now: new Date("2026-08-03T00:00:00Z"),
    });

    expect(slots).toHaveLength(9);
    expect(slots[0]).toEqual({
      start: new Date("2026-08-03T06:00:00Z"),
      end: new Date("2026-08-03T07:00:00Z"),
    });
    expect(slots.at(-1)).toEqual({
      start: new Date("2026-08-03T08:00:00Z"),
      end: new Date("2026-08-03T09:00:00Z"),
    });
  });

  it("returns no slots on a closed day", () => {
    const slots = generateSlotsForDate({
      dateISO: "2026-08-04",
      workingHours: mondayHours,
      durationMinutes: 60,
      existingBookings: [],
      now: new Date("2026-08-01T00:00:00Z"),
    });

    expect(slots).toEqual([]);
  });

  it("removes past slots", () => {
    const slots = generateSlotsForDate({
      dateISO: "2026-08-03",
      workingHours: mondayHours,
      durationMinutes: 60,
      existingBookings: [],
      now: new Date("2026-08-03T07:01:00Z"),
    });

    expect(slots[0].start).toEqual(new Date("2026-08-03T07:15:00Z"));
  });

  it("excludes every slot overlapping an existing booking", () => {
    const slots = generateSlotsForDate({
      dateISO: "2026-08-03",
      workingHours: mondayHours,
      durationMinutes: 60,
      existingBookings: [
        {
          slotStart: new Date("2026-08-03T07:00:00Z"),
          slotEnd: new Date("2026-08-03T08:00:00Z"),
        },
      ],
      now: new Date("2026-08-03T00:00:00Z"),
    });

    expect(slots.map((slot) => slot.start.toISOString())).toEqual([
      "2026-08-03T06:00:00.000Z",
      "2026-08-03T08:00:00.000Z",
    ]);
  });

  it("allows adjacent ranges because booking intervals are half-open", () => {
    const slots = generateSlotsForDate({
      dateISO: "2026-08-03",
      workingHours: mondayHours,
      durationMinutes: 60,
      existingBookings: [
        {
          slotStart: new Date("2026-08-03T07:00:00Z"),
          slotEnd: new Date("2026-08-03T08:00:00Z"),
        },
      ],
      now: new Date("2026-08-03T00:00:00Z"),
    });

    expect(slots.some((slot) => slot.end.toISOString() === "2026-08-03T07:00:00.000Z")).toBe(
      true
    );
    expect(slots.some((slot) => slot.start.toISOString() === "2026-08-03T08:00:00.000Z")).toBe(
      true
    );
  });

  it("excludes slots overlapping a schedule block", () => {
    const slots = generateSlotsForDate({
      dateISO: "2026-08-03",
      workingHours: mondayHours,
      durationMinutes: 30,
      existingBookings: [],
      blockedRanges: [
        {
          start: new Date("2026-08-03T07:00:00Z"),
          end: new Date("2026-08-03T07:30:00Z"),
        },
      ],
      now: new Date("2026-08-03T00:00:00Z"),
    });

    expect(slots.some((slot) => slot.start.toISOString() === "2026-08-03T07:00:00.000Z")).toBe(
      false
    );
    expect(slots.some((slot) => slot.start.toISOString() === "2026-08-03T07:30:00.000Z")).toBe(
      true
    );
  });
});

describe("getDayBoundsUTC", () => {
  it("uses the winter Kyiv UTC offset", () => {
    const bounds = getDayBoundsUTC("2026-01-15");

    expect(bounds.start.toISOString()).toBe("2026-01-14T22:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-01-15T21:59:59.999Z");
  });

  it("uses the summer Kyiv UTC offset", () => {
    const bounds = getDayBoundsUTC("2026-07-15");

    expect(bounds.start.toISOString()).toBe("2026-07-14T21:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-07-15T20:59:59.999Z");
  });
});
