const buckets = new Map<string, { count: number; resetAt: number }>();

export function allowCitySearch(key: string, now = Date.now()): boolean {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (existing.count >= 20) return false;
  existing.count += 1;
  return true;
}
