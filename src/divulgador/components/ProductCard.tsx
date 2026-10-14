import { ExternalLink, Facebook, ImageOff, Instagram, MessageCircle, Pencil, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "../../components/CopyButton";
import { commissionPercent, productMessage, type ProductCardData } from "../lib/products";
import { offerPrice, secureImage } from "../lib/storefront";
import { ProductPrice } from "./ProductPrice";

export function ProductCard({ product, busy, onTelegram, onEdit, onDelete }: {
  product: ProductCardData; busy: boolean; onTelegram: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = secureImage(product.imageUrl);
  const price = product.price ? Number(product.price.replace(",", ".")) : null;
  return <article className="divulgador-product-card" data-testid="product-card">
    <div className="divulgador-card-image">{image && !imageFailed ? <img src={image} alt={product.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} /> : <ImageOff size={30} aria-label="Imagem indisponível" />}</div>
    <div className="divulgador-card-content">
      <small>{product.shopName || "Produto cadastrado"}{product.sales == null ? "" : ` · ${product.sales.toLocaleString("pt-BR")} vendas na API`}</small>
      <h3>{product.name}</h3>
      <ProductPrice price={price} basePrice={product.basePrice} condition={product.priceCondition} />
      <div className="divulgador-card-commission"><span>Comissão estimada (API)</span><strong>{product.commission == null ? "Não informada" : offerPrice(product.commission)} · {commissionPercent(product.commissionRate)}</strong></div>
      {(product.sellerCommissionRate != null || product.shopeeCommissionRate != null) && <small>Vendedor: {commissionPercent(product.sellerCommissionRate)} · Shopee: {commissionPercent(product.shopeeCommissionRate)}</small>}
      <div className="divulgador-card-actions">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onTelegram} title="Revisar texto, destino e agendamento Telegram"><Send size={15} /> Telegram</button>
        <CopyButton text={() => productMessage(product)} label="Copiar divulgação" variant="ghost" />
        <button type="button" className="btn btn-ghost" disabled title="WhatsApp: API não integrada"><MessageCircle size={15} /> WhatsApp</button>
        <button type="button" className="btn btn-ghost" disabled title="Instagram: integração futura"><Instagram size={15} /> Instagram</button>
        <button type="button" className="btn btn-ghost" disabled title="Facebook: integração futura"><Facebook size={15} /> Facebook</button>
      </div>
      <div className="divulgador-card-tools">
        {product.url && <a href={product.url} className="btn btn-quiet" target="_blank" rel="noopener noreferrer sponsored"><ExternalLink size={14} /> Abrir produto</a>}
        <button type="button" className="icon-btn" title="Editar produto e preço promocional" aria-label={`Editar ${product.name}`} disabled={busy} onClick={onEdit}><Pencil size={16} /></button>
        <button type="button" className="icon-btn" title="Excluir produto" aria-label={`Excluir ${product.name}`} disabled={busy} onClick={onDelete}><Trash2 size={16} /></button>
      </div>
    </div>
  </article>;
}