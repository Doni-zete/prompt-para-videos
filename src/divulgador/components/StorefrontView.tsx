import { useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, ImageOff, Instagram, Search, Send, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { PublicSiteSettings, SiteCatalog, SiteProduct } from "../lib/api";
import { storefrontVisit } from "../lib/api";
import { discountPercent, offerPrice, secureImage } from "../lib/storefront";
import "../storefront.css";
import { ProductPrice } from "./ProductPrice";

function OfferImage({ url, name }: { url?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const source = secureImage(url);
  return <div className="sf-product-image">{source && !failed
    ? <img key={source} src={source} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    : <ImageOff size={32} aria-label="Imagem indisponível" />}</div>;
}

function OfferCard({ product, slug, preview }: { product: SiteProduct; slug: string; preview: boolean }) {
  const discount = discountPercent(product.price, product.originalPrice);
  return <article className="sf-card">
    <div className="sf-card-media"><OfferImage url={product.imageUrl} name={product.name} />{discount !== null && <span className="sf-discount">{discount}% OFF</span>}</div>
    <div className="sf-card-body">
      <small>{product.category}</small><h3>{product.name}</h3>
      {discount !== null && <del>{offerPrice(product.originalPrice)}</del>}
      <ProductPrice className="sf-price" price={product.price} basePrice={product.basePrice} condition={product.priceCondition} />
      {preview ? <button type="button" className="sf-button" disabled>Ver promoção</button> : <Link className="sf-button" to={`/ofertas/${slug}/${product.id}`}>Ver promoção <ArrowRight size={16} /></Link>}
    </div>
  </article>;
}

export function SiteHeader({ settings }: { settings: PublicSiteSettings }) {
  const logo = secureImage(settings.logoUrl);
  return <header className="sf-header"><div className="sf-inner sf-header-content">
    <Link className="sf-brand" to={`/ofertas/${settings.slug}`}>{logo && <img src={logo} alt="" referrerPolicy="no-referrer" />}<span>{settings.name}</span></Link>
    <nav aria-label="Navegação da loja"><Link to={`/ofertas/${settings.slug}`}>Promoções</Link>
      {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer"><Instagram size={17} /> Instagram</a>}
      {settings.telegramUrl && <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer"><Send size={17} /> Telegram</a>}
    </nav>
  </div></header>;
}

export function SiteFooter({ settings }: { settings: PublicSiteSettings }) {
  const [dismissed, setDismissed] = useState(false);
  return <>
    <footer className="sf-inner sf-footer"><strong>{settings.name}</strong><p>Links de afiliado: podemos receber comissão por compras. Preços e disponibilidade podem mudar; confirme na loja.</p></footer>
    {settings.telegramUrl && !dismissed && <aside className="sf-telegram"><a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer"><Send size={19} /> Entre no grupo de promoções</a><button type="button" title="Fechar convite" aria-label="Fechar convite Telegram" onClick={() => setDismissed(true)}><X size={20} /></button></aside>}
  </>;
}

export function StorefrontView({ data, preview = false, search = "", category = "", onSearch, onCategory, onPage }: {
  data: SiteCatalog; preview?: boolean; search?: string; category?: string;
  onSearch?: (value: string) => void; onCategory?: (value: string) => void; onPage?: (page: number) => void;
}) {
  const carousel = useRef<HTMLDivElement>(null);
  const pages = Math.max(1, Math.ceil(data.total / 24));
  return <div className={`sf-site ${preview ? "sf-preview" : ""}`} style={{ "--sf-accent": data.settings.accentColor } as CSSProperties}>
    <SiteHeader settings={data.settings} />
    <main className="sf-inner sf-main">
      <div className="sf-heading"><h1>{data.settings.name}</h1>{data.settings.description && <p>{data.settings.description}</p>}</div>
      {data.settings.banners.length > 0 && <section className="sf-banners" aria-label="Destaques da loja">{data.settings.banners.map((banner, index) =>
        <a key={`${banner.imageUrl}-${index}`} href={banner.linkUrl || undefined} target={banner.linkUrl ? "_blank" : undefined} rel="noopener noreferrer"><img src={secureImage(banner.imageUrl)} alt={banner.title} referrerPolicy="no-referrer" />{banner.title && <span>{banner.title}</span>}</a>)}</section>}
      {data.featured.length > 0 && !search && !category && <section aria-labelledby="sf-featured">
        <div className="sf-section-head"><h2 id="sf-featured">Promoções selecionadas</h2><div className="sf-arrows">
          <button type="button" title="Destaques anteriores" aria-label="Destaques anteriores" onClick={() => carousel.current?.scrollBy({ left: -300, behavior: "smooth" })}><ArrowLeft size={18} /></button>
          <button type="button" title="Próximos destaques" aria-label="Próximos destaques" onClick={() => carousel.current?.scrollBy({ left: 300, behavior: "smooth" })}><ArrowRight size={18} /></button>
        </div></div>
        <div className="sf-carousel" ref={carousel}>{data.featured.map((product) => <OfferCard key={product.id} product={product} slug={data.settings.slug} preview={preview} />)}</div>
      </section>}
      <section aria-labelledby="sf-recent"><div className="sf-section-head"><h2 id="sf-recent">{search || category ? "Resultados" : "Promoções recentes"}</h2><span>{data.total} ofertas</span></div>
        {!preview && <form className="sf-filters" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSearch?.(String(form.get("search") ?? "")); }}>
          <label><span className="sr-only">Buscar promoções</span><input name="search" aria-label="Buscar promoções" defaultValue={search} key={search} placeholder="Buscar promoções" maxLength={100} /><button type="submit" title="Buscar" aria-label="Buscar promoções"><Search size={18} /></button></label>
          <select value={category} aria-label="Categoria" onChange={(event) => onCategory?.(event.target.value)}><option value="">Todas as categorias</option>{data.categories.map((value) => <option key={value}>{value}</option>)}</select>
        </form>}
        {data.products.length ? <div className="sf-grid">{data.products.map((product) => <OfferCard key={product.id} product={product} slug={data.settings.slug} preview={preview} />)}</div> : <p className="sf-empty">Nenhuma promoção disponível{search || category ? " para esses filtros" : ""}.</p>}
        {!preview && pages > 1 && <nav className="sf-pagination" aria-label="Páginas de ofertas"><button type="button" disabled={data.page === 1} onClick={() => onPage?.(data.page - 1)} aria-label="Página anterior"><ArrowLeft size={18} /></button><span>{data.page} / {pages}</span><button type="button" disabled={data.page >= pages} onClick={() => onPage?.(data.page + 1)} aria-label="Próxima página"><ArrowRight size={18} /></button></nav>}
      </section>
    </main><SiteFooter settings={data.settings} />
  </div>;
}

export function StorefrontDetail({ settings, product }: { settings: PublicSiteSettings; product: SiteProduct }) {
  const discount = discountPercent(product.price, product.originalPrice);
  return <div className="sf-site" style={{ "--sf-accent": settings.accentColor } as CSSProperties}>
    <SiteHeader settings={settings} /><main className="sf-inner sf-main">
      <Link className="sf-back" to={`/ofertas/${settings.slug}`}><ArrowLeft size={16} /> Todas as promoções</Link>
      <article className="sf-detail"><OfferImage url={product.imageUrl} name={product.name} /><div className="sf-detail-body"><small>{product.category}</small><h1>{product.name}</h1>
        {discount !== null && <span className="sf-discount">{discount}% OFF</span>}{discount !== null && <del>{offerPrice(product.originalPrice)}</del>}
        <ProductPrice className="sf-price" price={product.price} basePrice={product.basePrice} condition={product.priceCondition} />
        <a className="sf-button" href={storefrontVisit(settings.slug, product.id)} target="_blank" rel="noopener noreferrer sponsored">Ver na loja <ExternalLink size={18} /></a>
        <p>Oferta adicionada em {new Date(product.createdAt).toLocaleDateString("pt-BR")}. Confira o preço e as condições na loja antes da compra.</p>
      </div></article>
    </main><SiteFooter settings={settings} />
  </div>;
}