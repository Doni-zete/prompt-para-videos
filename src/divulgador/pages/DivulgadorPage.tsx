import { useEffect, useRef, useState } from "react";
import { Bell, Bot, Boxes, CalendarClock, ClipboardList, FileText, Link2, LogOut, Plus, Search, Send, Store, Trash2, Users } from "lucide-react";
import { CopyButton } from "../../components/CopyButton";
import { StorefrontEditor } from "../components/StorefrontEditor";
import { ProductCard } from "../components/ProductCard";
import { ProductPrice } from "../components/ProductPrice";
import { Modal } from "../../components/Modal";
import { commissionPercent, localSchedule, productMessage, type ProductCardData } from "../lib/products";
import { usePersistentState } from "../../hooks/usePersistentState";
import { divulgadorApi, isDivulgadorApiConfigured, type ApiCampaign, type ApiGroup, type ApiProduct, type ApiRedirect, type ApiTemplate, type ShopeeOffer } from "../lib/api";

type Product = ProductCardData & { apiId?: string };
type TelegramGroup = { id: string; name: string; chatId: string };
type CampaignDraft = { id: string; productName: string; message: string; groupName: string };
type LocalTemplate = { id: string; name: string; body: string };
type Section = "overview" | "products" | "campaigns" | "groups" | "templates" | "queue" | "links" | "automation" | "site";

const sections: { id: Section; label: string; icon: typeof Boxes }[] = [
  { id: "overview", label: "Visão geral", icon: ClipboardList },
  { id: "products", label: "Produtos", icon: Boxes },
  { id: "site", label: "Site de Promoções", icon: Store },
  { id: "campaigns", label: "Divulgações", icon: Send },
  { id: "groups", label: "Grupos Telegram", icon: Users },
  { id: "templates", label: "Textos e CTAs", icon: FileText },
  { id: "queue", label: "Fila de envios", icon: CalendarClock },
  { id: "links", label: "Links rastreáveis", icon: Link2 },
  { id: "automation", label: "Automações", icon: Bot },
];

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function DivulgadorPage() {
  const [section, setSection] = useState<Section>("overview");
  const [products, setProducts] = usePersistentState<Product[]>("divulgador:products", []);
  const [groups, setGroups] = usePersistentState<TelegramGroup[]>("divulgador:telegram-groups", []);
  const [drafts, setDrafts] = usePersistentState<CampaignDraft[]>("divulgador:drafts", []);
  const [localTemplates, setLocalTemplates] = usePersistentState<LocalTemplate[]>("divulgador:templates", []);
  const [sessionToken, setSessionToken] = useState("");
  const [password, setPassword] = useState("");
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [apiGroups, setApiGroups] = useState<ApiGroup[]>([]);
  const [apiTemplates, setApiTemplates] = useState<ApiTemplate[]>([]);
  const [apiCampaigns, setApiCampaigns] = useState<ApiCampaign[]>([]);
  const [apiRedirects, setApiRedirects] = useState<ApiRedirect[]>([]);
  const [shopeeConfigured, setShopeeConfigured] = useState(false);
  const [shopeeProductUrl, setShopeeProductUrl] = useState("");
  const [shopeeOffer, setShopeeOffer] = useState<ShopeeOffer | null>(null);
  const [shopeeLookupDone, setShopeeLookupDone] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);
  const [searchingShopee, setSearchingShopee] = useState(false);
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("Geral");
  const [groupName, setGroupName] = useState("");
  const [chatId, setChatId] = useState("");
  const [draftProductId, setDraftProductId] = useState("");
  const [draftGroupId, setDraftGroupId] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => localSchedule(new Date(Date.now() + 30 * 60_000)));
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  const connected = isDivulgadorApiConfigured && Boolean(sessionToken);
  const visibleProducts: Product[] = connected
    ? apiProducts.map((product) => ({ ...product, id: product.id, apiId: product.id, name: product.name, url: product.affiliateUrl, price: product.price === null ? "" : String(product.price) }))
    : products;
  const visibleGroups = connected
    ? apiGroups.map((group) => ({ id: group.id, name: group.name, chatId: group.chatId }))
    : groups;
  const selectedProduct = visibleProducts.find((product) => product.id === draftProductId);
  useEffect(() => { if (shopeeOffer) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [shopeeOffer]);

  async function loadApiData(token: string) {
    const [nextProducts, nextGroups, nextTemplates, nextCampaigns, nextRedirects, shopeeStatus] = await Promise.all([
      divulgadorApi.products(token),
      divulgadorApi.groups(token),
      divulgadorApi.templates(token),
      divulgadorApi.campaigns(token),
      divulgadorApi.redirects(token),
      divulgadorApi.shopeeStatus(token),
    ]);
    setApiProducts(nextProducts);
    setApiGroups(nextGroups);
    setApiTemplates(nextTemplates);
    setApiCampaigns(nextCampaigns);
    setApiRedirects(nextRedirects);
    setShopeeConfigured(shopeeStatus.configured);
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setApiError("");
    try {
      const session = await divulgadorApi.login(password);
      await loadApiData(session.accessToken);
      setSessionToken(session.accessToken);
      setPassword("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Não foi possível iniciar a sessão.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setSessionToken("");
    setApiProducts([]);
    setApiGroups([]);
    setApiTemplates([]);
    setApiCampaigns([]);
    setApiRedirects([]);
    setShopeeConfigured(false);
    setShopeeOffer(null);
    setShopeeLookupDone(false);
    setApiError("");
  }

  async function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = productName.trim();
    if (!name) return;
    setBusy(true);
    setApiError("");
    try {
      if (connected) {
        const price = productPrice.trim() ? Number(productPrice.replace(",", ".")) : null;
        const saved = await divulgadorApi.addProduct(sessionToken, {
          name,
          category: productCategory.trim() || "Geral",
          affiliateUrl: productUrl.trim(),
          price,
          originalPrice: null,
        });
        setApiProducts((current) => [saved, ...current]);
      } else {
        setProducts((current) => [...current, { id: newId(), name, url: productUrl.trim(), price: productPrice.trim() }]);
      }
      setProductName("");
      setProductUrl("");
      setProductPrice("");
      setProductCategory("Geral");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Não foi possível salvar o produto.");
    } finally {
      setBusy(false);
    }
  }

  async function lookupShopeeProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const productUrl = shopeeProductUrl.trim();
    if (!connected || !shopeeConfigured || !productUrl) return;
    setSearchingShopee(true);
    setApiError("");
    setShopeeOffer(null);
    setShopeeLookupDone(false);
    try {
      const offer = await divulgadorApi.resolveShopeeProduct(sessionToken, productUrl);
      setShopeeOffer(offer);
      setSection("products");
      setShopeeLookupDone(true);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Não foi possível buscar ofertas da Shopee.");
    } finally {
      setSearchingShopee(false);
    }
  }

  async function importShopeeOffer(offer: ShopeeOffer) {
    if (!connected) return;
    const existing = apiProducts.find((product) => product.sourceItemId === offer.itemId || product.affiliateUrl === offer.affiliateUrl);
    setBusy(true);
    setApiError("");
    try {
      const body = {
        name: offer.name,
        category: "Shopee",
        affiliateUrl: offer.affiliateUrl,
        price: offer.price,
        originalPrice: existing?.originalPrice ?? null,
        imageUrl: offer.imageUrl,
        priceCondition: offer.priceMin != null && offer.priceMax != null && offer.priceMin < offer.priceMax ? "A partir de (variação)" : "",
        basePrice: offer.basePrice ?? offer.price,
        commission: offer.commission,
        commissionRate: offer.commissionRate,
        sellerCommissionRate: offer.sellerCommissionRate,
        shopeeCommissionRate: offer.shopeeCommissionRate,
        shopName: offer.shopName ?? "",
        sales: offer.sales,
        sourceItemId: offer.itemId,
      };
      const saved = existing ? await divulgadorApi.updateProduct(sessionToken, existing.id, body) : await divulgadorApi.addProduct(sessionToken, body);
      setApiProducts((current) => [saved, ...current.filter((product) => product.id !== saved.id)]);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Não foi possível importar a oferta.");
    } finally {
      setBusy(false);
    }
  }

  async function addGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = groupName.trim();
    const id = chatId.trim();
    if (!name || !id) return;
    setBusy(true);
    setApiError("");
    try {
      if (connected) {
        const saved = await divulgadorApi.addGroup(sessionToken, { name, chatId: id });
        setApiGroups((current) => [...current.filter((group) => group.id !== saved.id), saved]);
      } else {
        setGroups((current) => [...current, { id: newId(), name, chatId: id }]);
      }
      setGroupName("");
      setChatId("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Não foi possível cadastrar o grupo.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setApiError("");
    setBusy(true);
    try {
      if (connected) {
        if (!draftGroupId) throw new Error("Selecione um grupo Telegram para agendar.");
        const campaign = await divulgadorApi.addCampaign(sessionToken, {
          groupId: draftGroupId,
          productId: selectedProduct?.apiId,
          productName: selectedProduct?.name,
          message: message.trim(),
          scheduledAt: new Date(scheduledAt).toISOString(),
        });
        setApiCampaigns((current) => [campaign, ...current]);
      } else {
        const group = visibleGroups.find((item) => item.id === draftGroupId);
        setDrafts((current) => [{
          id: newId(),
          productName: selectedProduct?.name ?? "",
          message: message.trim(),
          groupName: group?.name ?? "",
        }, ...current]);
      }
      setMessage("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Não foi possível salvar a divulgação.");
    } finally {
      setBusy(false);
    }
  }

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!templateName.trim() || !templateBody.trim()) return;
    setBusy(true);
    setApiError("");
    try {
      if (connected) {
        const saved = await divulgadorApi.addTemplate(sessionToken, { name: templateName.trim(), body: templateBody.trim() });
        setApiTemplates((current) => [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setLocalTemplates((current) => [...current, { id: newId(), name: templateName.trim(), body: templateBody.trim() }]);
      }
      setTemplateName("");
      setTemplateBody("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Não foi possível salvar o modelo.");
    } finally {
      setBusy(false);
    }
  }

  async function createTrackedLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!connected) return;
    setBusy(true);
    setApiError("");
    try {
      const redirect = await divulgadorApi.addRedirect(sessionToken, redirectUrl.trim());
      setApiRedirects((current) => [redirect, ...current]);
      setRedirectUrl("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Não foi possível criar o link.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product: Product) {
    setBusy(true); setApiError("");
    try {
      if (connected && product.apiId) {
        await divulgadorApi.deleteProduct(sessionToken, product.apiId);
        setApiProducts((current) => current.filter((item) => item.id !== product.apiId));
      } else setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (error) { setApiError(error instanceof Error ? error.message : "Não foi possível excluir o produto."); }
    finally { setBusy(false); }
  }

  function prepareTelegram(product: Product) {
    setDraftProductId(product.id);
    setMessage(productMessage(product));
    setScheduledAt(localSchedule(new Date(Date.now() + 30 * 60_000)));
    setSection("campaigns");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProductEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editingProduct) return;
    setBusy(true); setApiError("");
    try {
      const price = editingProduct.price.trim() ? Number(editingProduct.price.replace(",", ".")) : null;
      if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error("Informe um preço válido.");
      if (connected && editingProduct.apiId) {
        const source = apiProducts.find((product) => product.id === editingProduct.apiId)!;
        const { id, createdAt, ...body } = source;
        const saved = await divulgadorApi.updateProduct(sessionToken, id, { ...body, name: editingProduct.name, affiliateUrl: editingProduct.url,
          imageUrl: editingProduct.imageUrl || null, price, priceCondition: editingProduct.priceCondition || "" });
        setApiProducts((current) => current.map((product) => product.id === saved.id ? saved : product));
      } else setProducts((current) => current.map((product) => product.id === editingProduct.id ? editingProduct : product));
      setEditingProduct(null);
    } catch (error) { setApiError(error instanceof Error ? error.message : "Não foi possível editar o produto."); }
    finally { setBusy(false); }
  }

  async function deleteGroup(group: TelegramGroup) {
    if (connected) {
      await divulgadorApi.deleteGroup(sessionToken, group.id);
      setApiGroups((current) => current.filter((item) => item.id !== group.id));
    } else {
      setGroups((current) => current.filter((item) => item.id !== group.id));
    }
  }

  async function deleteTemplate(id: string) {
    if (connected) {
      await divulgadorApi.deleteTemplate(sessionToken, id);
      setApiTemplates((current) => current.filter((item) => item.id !== id));
    } else {
      setLocalTemplates((current) => current.filter((item) => item.id !== id));
    }
  }

  async function cancelCampaign(id: string) {
    await divulgadorApi.cancelCampaign(sessionToken, id);
    setApiCampaigns((current) => current.map((campaign) => campaign.id === id ? { ...campaign, status: "cancelled" } : campaign));
  }

  async function retryCampaign(id: string) {
    await divulgadorApi.retryCampaign(sessionToken, id);
    setApiCampaigns((current) => current.map((campaign) => campaign.id === id ? { ...campaign, status: "scheduled", lastError: null } : campaign));
  }

  function insertTemplate(body: string) {
    const content = body
      .replaceAll("{{produto}}", selectedProduct?.name ?? "[produto]")
      .replaceAll("{{preco}}", selectedProduct?.price ? `R$ ${selectedProduct.price}` : "[preço]")
      .replaceAll("{{link}}", selectedProduct?.url || "[link]");
    setMessage((current) => current ? `${current}\n\n${content}` : content);
    setSection("campaigns");
  }

  const visibleTemplates = connected ? apiTemplates : localTemplates;
  const localQueued = drafts.length;
  const scheduledCount = apiCampaigns.filter((item) => item.status === "scheduled").length;

  if (isDivulgadorApiConfigured && !sessionToken) {
    return (
      <div className="page divulgador-page">
        <header className="dash-head"><div><h1 className="display">Divulgador</h1><p className="lede">Entre para acessar grupos, campanhas e links do backend Telegram.</p></div></header>
        <form className="divulgador-form divulgador-login" onSubmit={login}>
          <label className="field"><span>Senha do painel</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label>
          {apiError && <p className="alert alert-error" role="alert">{apiError}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Conectando..." : "Entrar"}</button>
          <small>A senha é enviada ao backend protegido e não é salva no navegador.</small>
        </form>
      </div>
    );
  }

  return (
    <div className="page divulgador-page">
      <header className="dash-head">
        <div>
          <h1 className="display">Divulgador</h1>
          <p className="lede">Organize ofertas, prepare divulgações e acompanhe a fila do Telegram.</p>
        </div>
        {connected && <button type="button" className="btn btn-ghost" onClick={logout}><LogOut size={15} /> Sair</button>}
      </header>

      {connected && <div className="divulgador-lookup-bar" aria-labelledby="divulgador-shopee-search">
        <h2 id="divulgador-shopee-search">Buscar produto pelo link da Shopee</h2>
        <form className="shopee-lookup-form" onSubmit={(event) => { void lookupShopeeProduct(event); }}>
          <label className="field"><span className="sr-only">Link do produto</span><input type="url" maxLength={2048} value={shopeeProductUrl} disabled={searchingShopee || !shopeeConfigured} onChange={(event) => { setShopeeProductUrl(event.target.value); setShopeeLookupDone(false); }} placeholder="Cole o link do produto Shopee para divulgar" required /></label>
          <button className="btn btn-primary" type="submit" disabled={searchingShopee || !shopeeConfigured || !shopeeProductUrl.trim()}><Search size={15} /> {searchingShopee ? "Buscando..." : "Buscar produto"}</button>
        </form>
        {!shopeeConfigured && <small>Affiliate Open API não configurada no backend.</small>}
      </div>}

      <div className="banner" role="status">
        <Bell size={18} aria-hidden="true" />
        <p>{connected ? "Backend Telegram conectado. O bot precisa estar nos grupos e ter permissão para enviar mensagens." : "Modo local: os dados ficam neste navegador e nenhum envio automático é realizado. A integração do WhatsApp não faz parte deste projeto."}</p>
      </div>
      {apiError && <p className="alert alert-error" role="alert">{apiError}</p>}

      <nav className="row" aria-label="Seções do Divulgador">
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={section === id ? "btn btn-primary" : "btn btn-ghost"} aria-pressed={section === id} onClick={() => setSection(id)}>
            <Icon size={15} aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>

      {section === "overview" && (
        <>
          <section className="dtiles" aria-label="Resumo do Divulgador">
            <article className="dtile"><span className="dtile-label">Produtos cadastrados</span><strong>{visibleProducts.length}</strong><small>Manuais ou sincronizados com o backend</small></article>
            <article className="dtile"><span className="dtile-label">Destinos Telegram</span><strong>{visibleGroups.length}</strong><small>Grupos cadastrados</small></article>
            <article className="dtile"><span className="dtile-label">Na fila</span><strong>{connected ? scheduledCount : localQueued}</strong><small>{connected ? "Campanhas agendadas" : "Rascunhos locais"}</small></article>
            {connected && <article className="dtile"><span className="dtile-label">Cliques rastreados</span><strong>{apiRedirects.reduce((total, link) => total + link.clicks, 0)}</strong><small>Links ativos</small></article>}
          </section>
          <section className="dsec" aria-labelledby="divulgador-start">
            <h2 id="divulgador-start" className="dsec-title">Comece por aqui</h2>
            <p>Cadastre seus produtos e grupos, depois monte divulgações para revisar e copiar. Ofertas da Shopee podem ser pesquisadas quando a Affiliate Open API estiver configurada no backend.</p>
          </section>
        </>
      )}

      {section === "products" && (
        <section className="dsec" aria-labelledby="divulgador-products">
          <h2 id="divulgador-products" className="dsec-title">Produtos</h2>
          {connected && <div className="divulgador-lookup-result" ref={resultRef}>
                  {shopeeLookupDone && !shopeeOffer && <p className="empty-inline">Não encontrei uma oferta afiliada para esse link.</p>}
                  {shopeeOffer && (() => {
                    const alreadyAdded = apiProducts.some((product) => product.sourceItemId === shopeeOffer.itemId || product.affiliateUrl === shopeeOffer.affiliateUrl);
                    return (
                      <article className="shopee-offer" aria-labelledby="shopee-offer-name">
                        {shopeeOffer.imageUrl && <img className="shopee-offer-image" src={shopeeOffer.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.hidden = true; }} />}
                        <div className="shopee-offer-body">
                          <h4 id="shopee-offer-name">{shopeeOffer.name}</h4>
                          <p className="muted">{shopeeOffer.shopName || "Loja Shopee"}{shopeeOffer.sales === null ? "" : ` · ${shopeeOffer.sales} vendas`}</p>
                          <ProductPrice price={shopeeOffer.price} basePrice={shopeeOffer.basePrice} />
                          <span className="muted">{shopeeOffer.commission === null ? "Comissão não informada" : `Comissão estimada (API) ${shopeeOffer.commission.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`} · {commissionPercent(shopeeOffer.commissionRate)}</span>
                          <small>Preço retornado pela API{shopeeOffer.priceMin != null ? " (menor variação)" : ""}; Pix/cupons podem ter condições específicas.</small>
                          {(shopeeOffer.sellerCommissionRate != null || shopeeOffer.shopeeCommissionRate != null) && <small>Vendedor: {commissionPercent(shopeeOffer.sellerCommissionRate)} · Shopee: {commissionPercent(shopeeOffer.shopeeCommissionRate)}</small>}
                          <div className="shopee-affiliate-link">
                            <span>Link afiliado convertido</span>
                            <a href={shopeeOffer.affiliateUrl} target="_blank" rel="noreferrer">{shopeeOffer.affiliateUrl}</a>
                            <CopyButton text={shopeeOffer.affiliateUrl} label="Copiar link afiliado" variant="quiet" />
                          </div>
                          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => { void importShopeeOffer(shopeeOffer); }}>
                            {alreadyAdded ? "Atualizar produto" : "Adicionar aos produtos"}
                          </button>
                        </div>
                      </article>
                    );
                  })()}
            </div>}
          <details className="divulgador-manual-product"><summary>Cadastro manual</summary><form className="row" onSubmit={addProduct}>
            <label className="field"><span>Produto</span><input value={productName} onChange={(event) => setProductName(event.target.value)} required /></label>
            <label className="field"><span>Link do produto ou afiliado</span><input type="url" value={productUrl} onChange={(event) => setProductUrl(event.target.value)} required={connected} /></label>
            <label className="field"><span>Categoria</span><input value={productCategory} onChange={(event) => setProductCategory(event.target.value)} /></label>
            <label className="field"><span>Preço (opcional)</span><input inputMode="decimal" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} /></label>
            <button className="btn btn-primary" type="submit" disabled={busy}><Plus size={15} /> Adicionar produto</button>
          </form></details>
          {visibleProducts.length === 0 ? <p className="empty-inline">Nenhum produto cadastrado.</p> : (
            <div className="divulgador-product-grid">
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} busy={busy} onTelegram={() => prepareTelegram(product)} onEdit={() => setEditingProduct(product)} onDelete={() => { void deleteProduct(product); }} />)}
            </div>
          )}
        </section>
      )}

      <Modal open={Boolean(editingProduct)} onClose={() => setEditingProduct(null)} title="Editar produto e preço">
        {editingProduct && <form className="stack" onSubmit={(event) => { void saveProductEdit(event); }}>
          <label className="field"><span>Nome do produto</span><input required maxLength={200} value={editingProduct.name} onChange={(event) => setEditingProduct({ ...editingProduct, name: event.target.value })} /></label>
          <label className="field"><span>Imagem (HTTPS)</span><input type="url" value={editingProduct.imageUrl || ""} onChange={(event) => setEditingProduct({ ...editingProduct, imageUrl: event.target.value || null })} /></label>
          <label className="field"><span>Link afiliado</span><input type="url" required value={editingProduct.url} onChange={(event) => setEditingProduct({ ...editingProduct, url: event.target.value })} /></label>
          <label className="field"><span>Preço divulgado</span><input inputMode="decimal" value={editingProduct.price} onChange={(event) => setEditingProduct({ ...editingProduct, price: event.target.value })} /></label>
          <label className="field"><span>Condições do preço (Pix/cupom/variação)</span><input maxLength={240} value={editingProduct.priceCondition || ""} onChange={(event) => setEditingProduct({ ...editingProduct, priceCondition: event.target.value })} /></label>
          <p className="muted">A comissão exibida é a estimativa retornada pela API, não uma comissão garantida para o preço editado.</p>
          {apiError && <p role="alert" className="alert alert-error">{apiError}</p>}<button className="btn btn-primary" type="submit" disabled={busy}>Salvar produto</button>
        </form>}
      </Modal>

      {section === "site" && (connected
        ? <StorefrontEditor token={sessionToken} products={apiProducts} onProductUpdated={(updated) => setApiProducts((current) => current.map((product) => product.id === updated.id ? updated : product))} />
        : <section className="dsec"><h2 className="dsec-title">Site de Promoções</h2><p>Conecte o backend do Divulgador para criar e publicar sua vitrine.</p></section>)}

      {section === "campaigns" && (
        <section className="dsec" aria-labelledby="divulgador-campaigns">
          <h2 id="divulgador-campaigns" className="dsec-title">Nova divulgação</h2>
          <form className="divulgador-form" onSubmit={saveDraft}>
            <label className="field"><span>Produto relacionado</span><select value={draftProductId} onChange={(event) => setDraftProductId(event.target.value)}><option value="">Sem produto vinculado</option>{visibleProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label className="field"><span>Destino Telegram</span><select value={draftGroupId} onChange={(event) => setDraftGroupId(event.target.value)} required={connected}><option value="">Escolha um grupo</option>{visibleGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
            <label className="field"><span>Enviar em</span><input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required={connected} /></label>
            {selectedProduct && <p className="muted">Link cadastrado: {selectedProduct.url || "não informado"}</p>}
            {visibleTemplates.length > 0 && <label className="field"><span>Inserir modelo</span><select defaultValue="" onChange={(event) => { const template = visibleTemplates.find((item) => item.id === event.target.value); if (template) insertTemplate(template.body); }}><option value="">Escolha um modelo</option>{visibleTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>}
            <label className="field"><span>Texto da divulgação</span><textarea rows={7} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escreva a mensagem. Você pode usar {nome_produto}, {preco} e {link}." required /></label>
            <button className="btn btn-primary" type="submit" disabled={busy}><Plus size={15} /> {connected ? "Agendar no Telegram" : "Salvar rascunho local"}</button>
          </form>
          <h3>Rascunhos salvos</h3>
          {!connected && (drafts.length === 0 ? <p className="empty-inline">Nenhum rascunho criado.</p> : drafts.map((draft) => (
            <article className="dsec divulgador-draft" key={draft.id}>
              <strong>{draft.productName || "Divulgação sem produto"}</strong><small>{draft.groupName || "Destino não definido"}</small>
              <pre>{draft.message}</pre>
              <CopyButton text={draft.message} label="Copiar texto" />
            </article>
          )))}
          {connected && <p className="muted">Acompanhe envios e falhas na seção Fila de envios.</p>}
        </section>
      )}

      {section === "groups" && (
        <section className="dsec" aria-labelledby="divulgador-groups">
          <h2 id="divulgador-groups" className="dsec-title">Grupos Telegram</h2>
          <p>Adicione o bot do Telegram ao grupo e cadastre o identificador. O envio será habilitado somente depois que o backend seguro estiver configurado.</p>
          <form className="row" onSubmit={addGroup}>
            <label className="field"><span>Nome do grupo</span><input value={groupName} onChange={(event) => setGroupName(event.target.value)} required /></label>
            <label className="field"><span>Chat ID</span><input value={chatId} onChange={(event) => setChatId(event.target.value)} required /></label>
            <button className="btn btn-primary" type="submit" disabled={busy}><Plus size={15} /> {connected ? "Validar e cadastrar" : "Cadastrar localmente"}</button>
          </form>
          {visibleGroups.length === 0 ? <p className="empty-inline">Nenhum grupo cadastrado.</p> : (
            <ul className="divulgador-list">{visibleGroups.map((group) => <li key={group.id}><strong>{group.name}</strong><span>{group.chatId}</span><button type="button" className="icon-btn" aria-label={`Remover ${group.name}`} onClick={() => void deleteGroup(group)}><Trash2 size={15} /></button></li>)}</ul>
          )}
        </section>
      )}

      {section === "templates" && (
        <section className="dsec" aria-labelledby="divulgador-templates">
          <h2 id="divulgador-templates" className="dsec-title">Textos de venda e CTAs</h2>
          <form className="divulgador-form" onSubmit={saveTemplate}>
            <label className="field"><span>Nome do modelo</span><input value={templateName} onChange={(event) => setTemplateName(event.target.value)} required /></label>
            <label className="field"><span>Texto</span><textarea rows={5} value={templateBody} onChange={(event) => setTemplateBody(event.target.value)} placeholder="Use {{produto}}, {{preco}} e {{link}} como variáveis." required /></label>
            <button className="btn btn-primary" type="submit" disabled={busy}><Plus size={15} /> Salvar modelo</button>
          </form>
          {visibleTemplates.length === 0 ? <p className="empty-inline">Nenhum modelo cadastrado.</p> : <ul className="divulgador-list">{visibleTemplates.map((template) => <li key={template.id}><strong>{template.name}</strong><span>{template.body}</span><button type="button" className="btn btn-quiet" onClick={() => insertTemplate(template.body)}>Usar</button><button type="button" className="icon-btn" aria-label={`Excluir ${template.name}`} onClick={() => void deleteTemplate(template.id)}><Trash2 size={15} /></button></li>)}</ul>}
        </section>
      )}

      {section === "queue" && (
        <section className="dsec" aria-labelledby="divulgador-queue">
          <h2 id="divulgador-queue" className="dsec-title">Fila de envios</h2>
          {!connected ? <p className="empty-inline">Configure o backend para persistir e executar agendamentos.</p> : apiCampaigns.length === 0 ? <p className="empty-inline">Nenhuma campanha criada.</p> : <ul className="divulgador-list">{apiCampaigns.map((campaign) => <li key={campaign.id}><strong>{campaign.productName || "Divulgação"}</strong><span>{campaign.groupName} · {new Date(campaign.scheduledAt).toLocaleString()}</span><span className={`divulgador-status is-${campaign.status}`}>{campaign.status}</span>{campaign.lastError && <small>{campaign.lastError}</small>}{campaign.status === "scheduled" && <button className="btn btn-quiet" type="button" onClick={() => void cancelCampaign(campaign.id)}>Cancelar</button>}{campaign.status === "failed" && <button className="btn btn-quiet" type="button" onClick={() => void retryCampaign(campaign.id)}>Tentar novamente</button>}</li>)}</ul>}
        </section>
      )}

      {section === "links" && (
        <section className="dsec" aria-labelledby="divulgador-links">
          <h2 id="divulgador-links" className="dsec-title">Links rastreáveis</h2>
          {!connected ? <p className="empty-inline">A criação de redirecionadores precisa do backend configurado.</p> : <>
            <form className="row" onSubmit={createTrackedLink}><label className="field"><span>URL de destino</span><input type="url" value={redirectUrl} onChange={(event) => setRedirectUrl(event.target.value)} required /></label><button className="btn btn-primary" type="submit" disabled={busy}><Link2 size={15} /> Criar link</button></form>
            {apiRedirects.length === 0 ? <p className="empty-inline">Nenhum link rastreável criado.</p> : <ul className="divulgador-list">{apiRedirects.map((link) => <li key={link.code}><a href={link.shortUrl} target="_blank" rel="noreferrer">{link.shortUrl}</a><span>{link.clicks} cliques</span><span>{link.targetUrl}</span></li>)}</ul>}
          </>}
        </section>
      )}

      {section === "automation" && (
        <section className="dsec" aria-labelledby="divulgador-automation">
          <h2 id="divulgador-automation" className="dsec-title">Automações e filas</h2>
          <p>O agendador processa campanhas salvas no backend e respeita um intervalo conservador entre mensagens. A busca Shopee usa a Affiliate Open API quando configurada; conversão de links de outras lojas e geração de imagens não estão implementadas.</p>
          <button type="button" className="btn btn-ghost" disabled={!connected} title={!connected ? "Configure o backend e entre para ativar" : "O cron do servidor mantém a fila ativa"}><Bot size={15} /> {connected ? "Fila Telegram ativa no servidor" : "Backend Telegram não conectado"}</button>
        </section>
      )}
    </div>
  );
}