import { describe, expect, it } from "vitest";
import { discountPercent, offerPrice, secureImage } from "./storefront";

describe("Storefront presentation", () => {
  it("shows a discount only with a real higher original price", () => {
    expect(discountPercent(50, 100)).toBe(50);
    expect(discountPercent(0, 100)).toBe(100);
    for (const original of [null, 0, 20, 50]) expect(discountPercent(50, original)).toBeNull();
    expect(discountPercent(null, 100)).toBeNull();
  });
  it("does not pretend that a missing price is free", () => {
    expect(offerPrice(null)).toBe("Consulte na loja");
    expect(offerPrice(99.9)).toContain("99,90");
  });
  it("rejects active content and embedded credentials in media URLs", () => {
    expect(secureImage("javascript:alert(1)")).toBeUndefined();
    expect(secureImage("https://user:password@example.com/test.jpg")).toBeUndefined();
    expect(secureImage("https://example.com/test.jpg")).toBe("https://example.com/test.jpg");
  });
});