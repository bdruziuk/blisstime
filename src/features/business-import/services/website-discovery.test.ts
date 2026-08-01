import { describe, expect, it } from "vitest";
import { discoverPriceLinks, parsePublicWebsite } from "./website-discovery";

describe("parsePublicWebsite", () => {
  it("accepts regular public HTTP websites", () => {
    expect(parsePublicWebsite("https://salon.example/prices")?.hostname).toBe("salon.example");
  });

  it.each(["http://localhost/prices", "http://127.0.0.1", "http://10.1.2.3", "file:///etc/passwd", "https://user:pass@example.com"])("rejects unsafe URL %s", (url) => {
    expect(parsePublicWebsite(url)).toBeNull();
  });
});

describe("discoverPriceLinks", () => {
  it("returns same-host price and services pages only", () => {
    const html = `<a href="/services">Services</a><a href="/about">About</a><a href="https://other.example/prices">Prices</a><a href="/cennik">Cennik</a>`;
    expect(discoverPriceLinks(html, new URL("https://salon.example"))).toEqual([
      new URL("https://salon.example/services"),
      new URL("https://salon.example/cennik"),
    ]);
  });
});
