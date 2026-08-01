import { describe, expect, it } from "vitest";
import { getSuperAdminEmails, isSuperAdminEmail } from "./super-admin";

describe("super-admin email allowlist", () => {
  it("parses several comma-separated addresses", () => {
    expect([...getSuperAdminEmails("owner@example.com, admin@example.com")]).toEqual([
      "owner@example.com",
      "admin@example.com",
    ]);
  });

  it("normalizes case, whitespace and duplicate addresses", () => {
    const emails = getSuperAdminEmails(
      " Owner@Example.com,admin@example.com, owner@example.com, ,"
    );

    expect([...emails]).toEqual(["owner@example.com", "admin@example.com"]);
  });

  it("matches normalized email addresses", () => {
    expect(isSuperAdminEmail("OWNER@example.com", "owner@example.com,admin@example.com")).toBe(
      true
    );
    expect(isSuperAdminEmail("user@example.com", "owner@example.com,admin@example.com")).toBe(
      false
    );
  });

  it("denies access when the allowlist or session email is missing", () => {
    expect(isSuperAdminEmail("owner@example.com", "")).toBe(false);
    expect(isSuperAdminEmail(null, "owner@example.com")).toBe(false);
  });
});
