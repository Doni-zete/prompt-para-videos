export function discountPercent(price: number | null, originalPrice: number | null): number | null {
  if (price === null || originalPrice === null || !Number.isFinite(price) || !Number.isFinite(originalPrice) || price < 0 || originalPrice <= price) return null;
  return Math.round((1 - price / originalPrice) * 100);
}

export function offerPrice(price: number | null): string {
  return price === null ? "Consulte na loja" : price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function secureImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.href : undefined;
  } catch { return undefined; }
}