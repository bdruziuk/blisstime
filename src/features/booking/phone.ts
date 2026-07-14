// Normalizes Ukrainian phone numbers to +380XXXXXXXXX.
// Accepts local (0501234567), international (380501234567 / +380501234567),
// or bare 9-digit national numbers. Returns null if the input can't be
// confidently normalized.
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  let national: string;
  if (digits.startsWith("380") && digits.length === 12) {
    national = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length === 10) {
    national = digits.slice(1);
  } else if (digits.length === 9) {
    national = digits;
  } else {
    return null;
  }

  if (!/^\d{9}$/.test(national)) return null;
  return `+380${national}`;
}
