import { describe, expect, it } from "vitest";
import { regionalCenterFromRegion } from "./regional-centers";

describe("regionalCenterFromRegion", () => {
  it("maps a Ukrainian oblast name returned by Google", () => {
    expect(regionalCenterFromRegion("Кіровоградська область")).toBe("Кропивницький");
  });

  it("maps an English oblast name returned by Google", () => {
    expect(regionalCenterFromRegion("Kirovohrad Oblast")).toBe("Кропивницький");
  });

  it("does not guess a center for an unknown region", () => {
    expect(regionalCenterFromRegion("Unknown region")).toBeNull();
  });
});
