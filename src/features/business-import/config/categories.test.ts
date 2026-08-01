import { describe, expect, it } from "vitest";
import { BEAUTY_IMPORT_CATEGORIES, getImportCategory } from "./categories";

describe("beauty import categories", () => {
  it("has unique keys and at least one text query per category", () => {
    const keys = BEAUTY_IMPORT_CATEGORIES.map((category) => category.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(BEAUTY_IMPORT_CATEGORIES.every((category) => category.searchQueries.length > 0)).toBe(true);
  });

  it("resolves a category centrally", () => {
    expect(getImportCategory("NAIL_SALON")?.label).toBe("Манікюр і педикюр");
    expect(getImportCategory("UNKNOWN")).toBeUndefined();
  });
});
