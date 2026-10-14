import { useEffect, useState } from "react";
import { ExternalLink, ImagePlus, Loader2, Pencil, Save, Store, Trash2 } from "lucide-react";
import { CopyButton } from "../../components/CopyButton";
import { Modal } from "../../components/Modal";
import { divulgadorApi, storefrontApi, storefrontLink, type ApiProduct, type SiteAdmin, type SiteCatalog, type SiteSettings } from "../lib/api";
import { StorefrontView } from "./StorefrontView";
import { offerPrice } from "../lib/storefront";

const INITIAL: SiteSettings = { name: "Minhas Ofertas", slug: "minhas-ofertas", description: "", telegramUrl: "", instagramUrl: "", logoUrl: "", accentColor: "#be185d", published: false, autoPublish: true, banners: [] };

export function StorefrontEditor({ token, products, onProductUpdated }: { token: string; products: ApiProduct[]; onProductUpdated: (product: ApiProduct) => void }) {
  const [admin, setAdmin] = useState<SiteAdmin>({ settings: null, selections: [] });
  const [settings, setSettings] = useState<SiteSettings>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState<ApiProduct | null>(null);
  useEffect(() => {
    let disposed = false;
    storefrontApi.admin(token).then((next) => { if (!disposed) { setAdmin(next); setSettings(next.settings ?? INITIAL); } })
      .catch((failure: unknown) => { if (!disposed) setError(failure instanceof Error ? failure.message : "Não foi possível carregar o site."); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [token]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const next = await storefrontApi.save(token, settings);
      setAdmin(next); setSettings(next.settings ?? settings);
      setNotice(settings.published ? "Site publicado. Os produtos selecionados estão disponíveis no endereço público." : "Site salvo como rascunho. A página pública está desativada.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível salvar o site."); }
    finally { setBusy(false); }
  }

  async function select(id: string, included: boolean, featured: boolean) {
    setBusy(true); setError("");
    try { setAdmin(await storefrontApi.select(token, id, included, featured)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível alterar o produto."); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError("");
    try { await storefrontApi.remove(token); setAdmin({ settings: null, selections: [] }); setSettings(INITIAL); setConfirmDelete(false); setNotice("Site excluído. Os produtos do catálogo foram preservados."); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível excluir o site."); }
    finally { setBusy(false); }
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return;
    setBusy(true); setError("");
    try {
      const { id, createdAt, ...body } = editing;
      const next = await divulgadorApi.updateProduct(token, id, body);
      onProductUpdated(next); setEditing(null); setNotice("Produto atualizado no catálogo e na vitrine.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível editar o produto."); }
    finally { setBusy(false); }
  }

  const selectedProducts = products.filter((product) => admin.selections.some((selection) => selection.productId === product.id))
    .map((product) => ({ ...product, featured: admin.selections.find((selection) => selection.productId === product.id)!.featured, clicks: admin.selections.find((selection) => selection.productId === product.id)!.clicks }));
  const previewData: SiteCatalog = { settings, products: selectedProducts, featured: selectedProducts.filter((product) => product.featured), categories: [...new Set(selectedProducts.map((product) => product.category))], total: selectedProducts.length, page: 1 };
  if (loading) return <p role="status"><Loader2 size={16} className="spin" /> Carregando site...</p>;
  return <section className="storefront-editor" aria-labelledby="site-editor-title">
    <div className="row"><h2 id="site-editor-title" className="dsec-title"><Store size={19} /> Site de Promoções</h2>{admin.settings && <span className={`site-state ${admin.settings.published ? "is-published" : ""}`}>{admin.settings.published ? "Publicado" : "Rascunho"}</span>}</div>
    {error && <p className="alert alert-error" role="alert">{error}</p>}{notice && <p role="status" className="alert">{notice}</p>}
    {admin.settings && <div className="row site-public-link"><a href={storefrontLink(admin.settings.slug)} target="_blank" rel="noopener noreferrer">{storefrontLink(admin.settings.slug)} <ExternalLink size={14} /></a><CopyButton text={storefrontLink(admin.settings.slug)} label="Copiar endereço" /></div>}
    <form onSubmit={(event) => { void save(event); }} className="site-settings-form">
      <label className="field"><span>Nome do site</span><input value={settings.name} maxLength={80} required onChange={(event) => setSettings({ ...settings, name: event.target.value })} /></label>
      <label className="field"><span>Endereço do site</span><input value={settings.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={60} required onChange={(event) => setSettings({ ...settings, slug: event.target.value.toLowerCase() })} /></label>
      <label className="field site-wide"><span>Descrição</span><textarea rows={2} value={settings.description} maxLength={400} onChange={(event) => setSettings({ ...settings, description: event.target.value })} /></label>
      <label className="field"><span>Grupo ou canal Telegram</span><input type="url" placeholder="https://t.me/seu_grupo" value={settings.telegramUrl} onChange={(event) => setSettings({ ...settings, telegramUrl: event.target.value })} /></label>
      <label className="field"><span>Instagram</span><input type="url" placeholder="https://www.instagram.com/seu_perfil/" value={settings.instagramUrl} onChange={(event) => setSettings({ ...settings, instagramUrl: event.target.value })} /></label>
      <label className="field"><span>Imagem do logotipo (HTTPS)</span><input type="url" value={settings.logoUrl} onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })} /></label>
      <label className="field"><span>Cor dos botões</span><input type="color" value={settings.accentColor} onChange={(event) => setSettings({ ...settings, accentColor: event.target.value })} /></label>
      <div className="site-wide site-flags">
        <label><input type="checkbox" checked={settings.published} onChange={(event) => setSettings({ ...settings, published: event.target.checked })} /> Site público</label>
        <label><input type="checkbox" checked={settings.autoPublish} onChange={(event) => setSettings({ ...settings, autoPublish: event.target.checked })} /> Incluir automaticamente novos produtos importados</label>
      </div>
      <fieldset className="site-wide site-banner-editor"><legend>Banners</legend>
        {settings.banners.map((banner, index) => <div key={index} className="site-banner-fields">
          <label className="field"><span>Imagem do banner {index + 1} (HTTPS)</span><input type="url" required value={banner.imageUrl} onChange={(event) => setSettings({ ...settings, banners: settings.banners.map((value, position) => position === index ? { ...value, imageUrl: event.target.value } : value) })} /></label>
          <label className="field"><span>Título</span><input value={banner.title} maxLength={100} onChange={(event) => setSettings({ ...settings, banners: settings.banners.map((value, position) => position === index ? { ...value, title: event.target.value } : value) })} /></label>
          <label className="field"><span>Link do banner</span><input type="url" value={banner.linkUrl} onChange={(event) => setSettings({ ...settings, banners: settings.banners.map((value, position) => position === index ? { ...value, linkUrl: event.target.value } : value) })} /></label>
          <button type="button" className="icon-btn" title="Excluir banner" aria-label={`Excluir banner ${index + 1}`} onClick={() => setSettings({ ...settings, banners: settings.banners.filter((_, position) => position !== index) })}><Trash2 size={17} /></button>
        </div>)}
        <button type="button" className="btn btn-ghost" disabled={settings.banners.length >= 5} onClick={() => setSettings({ ...settings, banners: [...settings.banners, { imageUrl: "", title: "", linkUrl: "" }] })}><ImagePlus size={16} /> Adicionar banner</button>
      </fieldset>
      <div className="row site-wide"><button type="submit" disabled={busy} className="btn btn-primary"><Save size={16} /> {admin.settings ? "Salvar site" : "Criar site"}</button><button type="button" className="btn btn-ghost" disabled={!admin.settings} onClick={() => setPreview(!preview)}><ExternalLink size={16} /> {preview ? "Fechar prévia" : "Prévia"}</button>{admin.settings && <button className="btn btn-quiet danger" type="button" disabled={busy} onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> Excluir site</button>}</div>
    </form>
    {admin.settings && <section aria-labelledby="site-products-title"><h3 id="site-products-title">Produtos da vitrine</h3>
      {products.length === 0 ? <p className="empty-inline">Nenhum produto cadastrado.</p> : <ul className="site-product-list">{products.map((product) => {
        const selection = admin.selections.find((value) => value.productId === product.id);
        return <li key={product.id}><div><strong>{product.name}</strong><small>{offerPrice(product.price)} · {selection?.clicks ?? 0} cliques</small></div>
          <label><input type="checkbox" checked={Boolean(selection)} disabled={busy} onChange={(event) => { void select(product.id, event.target.checked, false); }} /> No site</label>
          <label><input type="checkbox" checked={selection?.featured ?? false} disabled={busy || !selection} onChange={(event) => { void select(product.id, true, event.target.checked); }} /> Destaque</label>
          <button className="icon-btn" type="button" title="Editar produto" aria-label={`Editar ${product.name}`} onClick={() => setEditing(product)}><Pencil size={17} /></button>
        </li>;
      })}</ul>}
    </section>}
    {preview && <section aria-label="Prévia do site"><h3>Prévia</h3><StorefrontView data={previewData} preview /></section>}
    <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir site de promoções?" footer={<><button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancelar</button><button type="button" className="btn btn-danger" disabled={busy} onClick={() => { void remove(); }}>Excluir site</button></>}><p>A página pública será removida. Os produtos do catálogo serão preservados.</p></Modal>
    <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Editar produto da vitrine">
      {editing && <form className="stack" onSubmit={(event) => { void saveProduct(event); }}>
        <label className="field"><span>Nome</span><input required maxLength={200} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label>
        <label className="field"><span>Categoria</span><input required maxLength={80} value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })} /></label>
        <label className="field"><span>Imagem (HTTPS)</span><input type="url" value={editing.imageUrl ?? ""} onChange={(event) => setEditing({ ...editing, imageUrl: event.target.value || null })} /></label>
        <label className="field"><span>Link afiliado</span><input type="url" required value={editing.affiliateUrl} onChange={(event) => setEditing({ ...editing, affiliateUrl: event.target.value })} /></label>
        <label className="field"><span>Preço atual</span><input type="number" min={0} step="0.01" value={editing.price ?? ""} onChange={(event) => setEditing({ ...editing, price: event.target.value === "" ? null : Number(event.target.value) })} /></label>
        <label className="field"><span>Condições do preço (Pix/cupom/variação)</span><input maxLength={240} value={editing.priceCondition || ""} onChange={(event) => setEditing({ ...editing, priceCondition: event.target.value })} /></label>
        <label className="field"><span>Preço original</span><input type="number" min={0} step="0.01" value={editing.originalPrice ?? ""} onChange={(event) => setEditing({ ...editing, originalPrice: event.target.value === "" ? null : Number(event.target.value) })} /></label>
        {error && <p role="alert" className="alert alert-error">{error}</p>}<button className="btn btn-primary" type="submit" disabled={busy}><Save size={16} /> Salvar produto</button>
      </form>}
    </Modal>
  </section>;
}