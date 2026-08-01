import { describe, expect, it } from "vitest";
import { calculateProgress } from "./progress";

describe("business import progress", () => {
  it("handles empty, partial and over-completed jobs", () => {
    expect(calculateProgress(0, 0)).toBe(0);
    expect(calculateProgress(8, 3)).toBe(38);
    expect(calculateProgress(8, 20)).toBe(100);
  });
});
