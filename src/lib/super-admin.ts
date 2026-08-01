/**
 * Super-admin access is intentionally configured outside the database.
 * Use a comma-separated list so several owner accounts can be allowed.
 */
export function getSuperAdminEmails(raw = process.env.SUPER_ADMIN_EMAILS): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isSuperAdminEmail(
  email: string | null | undefined,
  raw = process.env.SUPER_ADMIN_EMAILS
): boolean {
  if (!email) return false;
  return getSuperAdminEmails(raw).has(email.trim().toLowerCase());
}
