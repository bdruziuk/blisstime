import { describe, expect, it } from "vitest";
import { approximateCellSizeKm, buildGrid, containsCoordinates, splitArea } from "./grid-builder";

const bounds = { south: 50, west: 30, north: 52, east: 34 };

describe("business import grid", () => {
  it("builds a gap-free rectangular grid", () => {
    const grid = buildGrid(bounds, 2, 2);
    expect(grid).toHaveLength(4);
    expect(grid[0]).toEqual({ depth: 0, bounds: { south: 50, west: 30, north: 51, east: 32 } });
    expect(grid[3]).toEqual({ depth: 0, bounds: { south: 51, west: 32, north: 52, east: 34 } });
  });

  it("splits an area into four children and increments depth", () => {
    const children = splitArea({ bounds, depth: 2 });
    expect(children).toHaveLength(4);
    expect(children.every((child) => child.depth === 3)).toBe(true);
    expect(children[0].bounds).toEqual({ south: 50, west: 30, north: 51, east: 32 });
  });

  it("checks coordinates including viewport edges", () => {
    expect(containsCoordinates(bounds, 51, 32)).toBe(true);
    expect(containsCoordinates(bounds, 50, 30)).toBe(true);
    expect(containsCoordinates(bounds, 49.99, 32)).toBe(false);
  });

  it("estimates a positive cell size in kilometres", () => {
    expect(approximateCellSizeKm(bounds)).toBeGreaterThan(200);
  });
});
