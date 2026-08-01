import { describe, expect, it } from "vitest";
import { findPotentialDuplicate, uniqueByExternalId } from "./deduplicator";

const existing = [
  { id: "one", name: "Beauty Room", formattedAddress: "Main St 1", lat: 50.45, lng: 30.52, normalizedPhone: "+380501234567", normalizedDomain: "beauty.ua" },
];

describe("business deduplication", () => {
  it("matches phone, domain, normalized address or close coordinates", () => {
    expect(findPotentialDuplicate({ name: "Other", formattedAddress: "Elsewhere", lat: 1, lng: 1, normalizedPhone: "+380501234567" }, existing)?.id).toBe("one");
    expect(findPotentialDuplicate({ name: "Other", formattedAddress: "Elsewhere", lat: 1, lng: 1, normalizedDomain: "beauty.ua" }, existing)?.id).toBe("one");
    expect(findPotentialDuplicate({ name: "BEAUTY room", formattedAddress: "Main st. 1", lat: 1, lng: 1 }, existing)?.id).toBe("one");
    expect(findPotentialDuplicate({ name: "Beauty Room", formattedAddress: "Other", lat: 50.4501, lng: 30.5201 }, existing)?.id).toBe("one");
  });

  it("does not merge uncertain records", () => {
    expect(findPotentialDuplicate({ name: "Different", formattedAddress: "Other", lat: 49, lng: 29 }, existing)).toBeNull();
  });

  it("deduplicates repeated provider results idempotently", () => {
    expect(uniqueByExternalId([{ externalId: "a", value: 1 }, { externalId: "a", value: 2 }, { externalId: "b", value: 3 }])).toEqual([
      { externalId: "a", value: 2 },
      { externalId: "b", value: 3 },
    ]);
  });
});
