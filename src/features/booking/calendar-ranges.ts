import { getDayBoundsUTC } from "./slots";

/** Shifts a calendar date (YYYY-MM-DD) by N days. Pure date-label arithmetic — no timezone conversion needed since dateISO already represents a business-tz calendar day. */
export function shiftDateISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Monday .. 6 = Sunday (JS's getUTCDay() is 0 = Sunday .. 6 = Saturday). */
function mondayFirstWeekday(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

export function getWeekStartISO(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  return shiftDateISO(dateISO, -mondayFirstWeekday(d));
}

export function getWeekDates(weekStartISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftDateISO(weekStartISO, i));
}

export function getWeekRangeUTC(weekStartISO: string) {
  const start = getDayBoundsUTC(weekStartISO).start;
  const end = getDayBoundsUTC(shiftDateISO(weekStartISO, 6)).end;
  return { start, end };
}

export type MonthInfo = {
  year: number;
  month: number; // 1-12
  firstDayISO: string;
  daysInMonth: number;
  /** 0 = Monday .. 6 = Sunday — how many blank cells precede day 1 in a Mon-first grid. */
  leadingBlanks: number;
};

export function getMonthInfo(dateISO: string): MonthInfo {
  const [year, month] = dateISO.split("-").map(Number);
  const firstDayISO = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = mondayFirstWeekday(new Date(`${firstDayISO}T12:00:00Z`));
  return { year, month, firstDayISO, daysInMonth, leadingBlanks };
}

export function getMonthRangeUTC(dateISO: string) {
  const { firstDayISO, daysInMonth } = getMonthInfo(dateISO);
  const lastDayISO = shiftDateISO(firstDayISO, daysInMonth - 1);
  const start = getDayBoundsUTC(firstDayISO).start;
  const end = getDayBoundsUTC(lastDayISO).end;
  return { start, end };
}

export function shiftMonthISO(dateISO: string, months: number): string {
  const [year, month] = dateISO.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + months, 1));
  return d.toISOString().slice(0, 10);
}
