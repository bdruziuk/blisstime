import { describe, expect, it } from "vitest";
import { canonicalCityName, catalogCityName, sameCanonicalCity } from "./city-normalizer";

describe("city normalizer", () => {
  it.each(["Kyiv", "Kiev", "Київ", "Киев"])("normalizes %s", (city) => expect(canonicalCityName(city, "UA")).toBe("Київ"));
  it("compares translated variants as one city", () => expect(sameCanonicalCity("Kyiv", "Київ", "UA")).toBe(true));
  it("does not translate non-Ukrainian cities", () => expect(canonicalCityName("Warsaw", "PL")).toBe("Warsaw"));
  it.each([["Ivano-Frankivsk", "Івано-Франківськ"], ["Uzhhorod", "Ужгород"], ["Kryvyi Rih", "Кривий Ріг"]])("translates %s for the filter", (city, expected) => expect(catalogCityName(city, "UA")).toBe(expected));
  it("hides unknown Latin-only Ukrainian locality", () => expect(catalogCityName("Unknown Suburb", "UA")).toBeNull());
  it.each([["L'viv", "Львів"], ["Ivano Frankivsk, Ivano-Frankivsk Oblast", "Івано-Франківськ"], ["Khmel'nyts'kyi", "Хмельницький"]])("accepts Google spelling %s", (city, expected) => expect(catalogCityName(city, "UA")).toBe(expected));
});
