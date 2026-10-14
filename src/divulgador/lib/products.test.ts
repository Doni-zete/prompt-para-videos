import { describe, expect, it } from "vitest";
import { commissionPercent, productMessage } from "./products";

describe("Product card values", () => {
  it("preserves fractional commission rates instead of rounding to integers", () => {
    expect(commissionPercent(0.225)).toBe("22,5%");
    expect(commissionPercent(0.24)).toBe("24%");
    expect(commissionPercent(22.512345)).toBe("22,512345%");
    expect(commissionPercent(null)).toBe("Não informada");
  });
  it("includes Pix/coupon conditions in the shared message without inventing a discount", () => {
    const text = productMessage({ name: "Kit masculino", price: "93.09", priceCondition: "No Pix com cupom", url: "https://s.shopee.com.br/offer" });
    expect(text).toContain("93,09");
    expect(text).toContain("No Pix com cupom");
    expect(text).not.toContain("105,36");
    expect(productMessage({ name: "Produto", price: "", url: "https://example.com" })).toContain("Consulte o preço");
  });
});