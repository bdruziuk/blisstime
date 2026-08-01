import { describe, expect, it } from "vitest";
import {
  getMonthInfo,
  getMonthRangeUTC,
  getWeekDates,
  getWeekStartISO,
  shiftDateISO,
  shiftMonthISO,
} from "./calendar-ranges";

describe("calendar range helpers", () => {
  it("shifts dates across month and year boundaries", () => {
    expect(shiftDateISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDateISO("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("builds Monday-first weeks", () => {
    expect(getWeekStartISO("2026-08-01")).toBe("2026-07-27");
    expect(getWeekDates("2026-07-27")).toEqual([
      "2026-07-27",
      "2026-07-28",
      "2026-07-29",
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
      "2026-08-02",
    ]);
  });

  it("handles leap-year month metadata", () => {
    expect(getMonthInfo("2028-02-12")).toEqual({
      year: 2028,
      month: 2,
      firstDayISO: "2028-02-01",
      daysInMonth: 29,
      leadingBlanks: 1,
    });
  });

  it("shifts months across year boundaries", () => {
    expect(shiftMonthISO("2026-12-20", 1)).toBe("2027-01-01");
    expect(shiftMonthISO("2026-01-20", -1)).toBe("2025-12-01");
  });

  it("returns Kyiv-aware UTC bounds for a month", () => {
    const range = getMonthRangeUTC("2026-03-15");

    expect(range.start.toISOString()).toBe("2026-02-28T22:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-03-31T20:59:59.999Z");
  });
});
