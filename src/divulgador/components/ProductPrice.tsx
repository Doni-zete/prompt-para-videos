import { offerPrice } from "../lib/storefront";

export function ProductPrice({ price, basePrice, condition, className = "" }: {
  price: number | null; basePrice?: number | null; condition?: string; className?: string;
}) {
  return <div className={`offer-price ${className}`}>
    <div className="offer-price-primary"><strong>{offerPrice(price)}</strong>{condition && <span>{condition}</span>}</div>
    {basePrice != null && basePrice !== price && <small>ou {offerPrice(basePrice)} (preço base na API)</small>}
  </div>;
}