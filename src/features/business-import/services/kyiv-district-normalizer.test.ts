import { describe, expect, it } from "vitest";
import { canonicalKyivDistrict, sameKyivDistrict } from "./kyiv-district-normalizer";

describe("Kyiv district normalizer", () => {
  it.each([["Shevchenkivskyi District", "Шевченківський"], ["Шевченківський район", "Шевченківський"], ["Pecherskyi", "Печерський"]])("normalizes %s", (value, expected) => expect(canonicalKyivDistrict(value)).toBe(expected));
  it("removes suburbs and unknown areas", () => expect(canonicalKyivDistrict("Sofiіїvska Borshchahivka")).toBeNull());
  it("matches Ukrainian and Latin variants", () => expect(sameKyivDistrict("Obolonskyi", "Оболонський")).toBe(true));
});
