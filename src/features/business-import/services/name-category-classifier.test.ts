import { describe, expect, it } from "vitest";
import { categoriesFromBusinessName, mergeNameCategories } from "./name-category-classifier";

describe("categoriesFromBusinessName", () => {
  it.each(["Манікюр на Подолі", "Студія педикюру", "Nails by Anna", "Nail Room"])("assigns nails for %s", (name) => {
    expect(categoriesFromBusinessName(name)).toContain("NAIL_SALON");
  });

  it("can assign several categories", () => {
    expect(categoriesFromBusinessName("Nail & Brow Studio")).toEqual(expect.arrayContaining(["NAIL_SALON", "BROWS_LASHES"]));
  });

  it("preserves categories assigned by the import task", () => {
    expect(mergeNameCategories("Nail Room", ["BEAUTY_SALON"])).toEqual(["BEAUTY_SALON", "NAIL_SALON"]);
  });

  it("does not mistake the word space for SPA", () => {
    expect(categoriesFromBusinessName("Beauty Space")).not.toContain("SPA");
  });

  it.each([
    ["Барбершоп Сокира", "BARBER"],
    ["Студія колористики та кератину", "HAIR_SALON"],
    ["Brow & Lash Studio", "BROWS_LASHES"],
    ["Центр естетичної медицини", "COSMETOLOGY"],
    ["Massage Therapist Kyiv", "MASSAGE"],
    ["Makeup Artist Studio", "MAKEUP"],
    ["Лазерна епіляція та шугаринг", "HAIR_REMOVAL"],
    ["Wellness SPA Center", "SPA"],
    ["Beauty Room", "BEAUTY_SALON"],
  ])("assigns %s to %s", (name, category) => {
    expect(categoriesFromBusinessName(name)).toContain(category);
  });

  it("does not mistake a personal name containing mua for a makeup artist", () => {
    expect(categoriesFromBusinessName("Samuel Beauty")).not.toContain("MAKEUP");
  });
});
