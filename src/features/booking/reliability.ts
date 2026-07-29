// Advisory helper: instead of processing online prepayments, we show the
// master the client's reliability and recommend asking for a prepayment
// (offline, at the master's discretion) for risky or brand-new clients.

export const RISKY_RELIABILITY_THRESHOLD = 70;

export type PrepaymentAdvice = {
  level: "risky" | "new" | "ok";
  /** Short recommendation for the master, or null when nothing to flag. */
  message: string | null;
};

export function getPrepaymentAdvice(input: {
  reliabilityScore: number;
  noShowCount: number;
  isNewClient: boolean;
}): PrepaymentAdvice {
  if (input.reliabilityScore < RISKY_RELIABILITY_THRESHOLD || input.noShowCount > 0) {
    return {
      level: "risky",
      message: "Низька надійність клієнта — радимо попросити передоплату.",
    };
  }
  if (input.isNewClient) {
    return {
      level: "new",
      message: "Новий клієнт — передоплату можна попросити на власний розсуд.",
    };
  }
  return { level: "ok", message: null };
}
