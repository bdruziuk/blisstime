import { describe, expect, it } from "vitest";
import { distanceMeters, normalizeComparableText, normalizeDomain, normalizeImportedPhone } from "./normalizer";

describe("business import normalization", () => {
  it("normalizes international and local phone punctuation", () => {
    expect(normalizeImportedPhone("+380 (50) 123-45-67")).toBe("+380501234567");
    expect(normalizeImportedPhone("050 123 45 67")).toBe("0501234567");
    expect(normalizeImportedPhone("123")).toBeNull();
  });

  it("normalizes website domains", () => {
    expect(normalizeDomain("https://www.Example.COM/path?q=1")).toBe("example.com");
    expect(normalizeDomain("salon.ua/about")).toBe("salon.ua");
    expect(normalizeDomain("not a url")).toBeNull();
  });

  it("normalizes comparable names and addresses", () => {
    expect(normalizeComparableText("  Beauty—Studio!  ")).toBe("beauty studio");
  });

  it("calculates short geo distances", () => {
    expect(distanceMeters({ lat: 50.45, lng: 30.52 }, { lat: 50.4501, lng: 30.5201 })).toBeLessThan(20);
  });
});
