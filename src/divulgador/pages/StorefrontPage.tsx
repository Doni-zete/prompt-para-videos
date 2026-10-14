import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { storefrontApi, type SiteCatalog, type PublicSiteSettings, type SiteProduct } from "../lib/api";
import { StorefrontDetail, StorefrontView } from "../components/StorefrontView";

export default function StorefrontPage() {
  const { slug = "", productId } = useParams();
  const [params, setParams] = useSearchParams();
  const search = params.get("busca") ?? "";
  const category = params.get("categoria") ?? "";
  const page = Math.max(1, Number(params.get("pagina")) || 1);
  const [data, setData] = useState<SiteCatalog | null>(null);
  const [detail, setDetail] = useState<{ settings: PublicSiteSettings; product: SiteProduct } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setError(""); setData(null); setDetail(null);
    const load = async () => {
      try {
        if (productId) { const next = await storefrontApi.detail(slug, productId, abort.signal); if (!abort.signal.aborted) { setDetail(next); document.title = `${next.product.name} | ${next.settings.name}`; } }
        else { const next = await storefrontApi.catalog(slug, search, category, page, abort.signal); if (!abort.signal.aborted) { setData(next); document.title = next.settings.name; } }
      } catch (failure) { if (!abort.signal.aborted) setError(failure instanceof Error ? failure.message : "Não foi possível abrir o site."); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    };
    void load();
    return () => abort.abort();
  }, [slug, productId, search, category, page]);
  if (loading) return <div className="sf-status" role="status"><Loader2 className="spin" /> Carregando promoções...</div>;
  if (error) return <main className="sf-status"><h1>Site indisponível</h1><p role="alert">{error}</p><button onClick={() => window.location.reload()}>Tentar novamente</button></main>;
  if (detail) return <StorefrontDetail {...detail} />;
  if (!data) return null;
  const update = (key: string, value: string, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (resetPage) next.delete("pagina");
    setParams(next);
  };
  return <StorefrontView data={data} search={search} category={category} onSearch={(value) => update("busca", value)} onCategory={(value) => update("categoria", value)} onPage={(value) => update("pagina", String(value), false)} />;
}