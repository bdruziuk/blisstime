import { describe, expect, it } from "vitest";
import { canonicalCityName, sameCanonicalCity } from "./city-normalizer";

describe("city normalizer", () => {
  it.each(["Kyiv", "Kiev", "Київ", "Киев"])("normalizes %s", (city) => expect(canonicalCityName(city, "UA")).toBe("Київ"));
  it("compares translated variants as one city", () => expect(sameCanonicalCity("Kyiv", "Київ", "UA")).toBe(true));
  it("does not translate non-Ukrainian cities", () => expect(canonicalCityName("Warsaw", "PL")).toBe("Warsaw"));
});
