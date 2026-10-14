export type ProductCardData = {
  id: string; name: string; url: string; price: string; imageUrl?: string | null; priceCondition?: string;
  basePrice?: number | null; commission?: number | null; commissionRate?: number | null;
  sellerCommissionRate?: number | null; shopeeCommissionRate?: number | null; shopName?: string;
  sales?: number | null; sourceItemId?: string | null;
};

export function localSchedule(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function commissionPercent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return "Não informada";
  const percent = rate <= 1 ? rate * 100 : rate;
  return `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 6 })}%`;
}

export function productMessage(product: { name: string; url: string; price: string; priceCondition?: string | null }): string {
  const price = product.price.trim() ? Number(product.price.replace(",", ".")) : null;
  const amount = price !== null && Number.isFinite(price)
    ? price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Consulte o preço na loja";
  return [product.name, `${amount}${product.priceCondition ? ` (${product.priceCondition})` : ""}`, product.url].filter(Boolean).join("\n\n");
}