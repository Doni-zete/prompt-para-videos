import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, FolderOpen, Info, Loader2, Pencil } from "lucide-react";
import { CopyButton } from "../../components/CopyButton";
import { claimedKeys, buildSlots, type MediaSlot } from "../../lib/mediaSlots";
import { libraryNames } from "../../lib/mediaSlots";
import { usePersistentState } from "../../hooks/usePersistentState";
import type { LibraryItem } from "../../data/types";
import { media } from "../../lib/media";
import { ACCEPT, hasDevUpload, outcomeMessage, uploadMedia } from "../../lib/mediaUpload";
import { useToast } from "../../context/ToastContext";
import { GALLERY } from "../data/gallery";
import { useProducts } from "../hooks/useProducts";

const MB = 1024 * 1024;

function Row({ slot, onDone }: { slot: MediaSlot; onDone: (mode: "dev" | "download", path: string) => void }) {
  const found = media.resolve(slot.category, slot.names);
  const path = `public/media/${slot.category}/${slot.names[0]}`;
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const send = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await uploadMedia(slot.category, slot.names[0], file);
      onDone(r.mode, r.path);
    } catch (err) {
      toast((err as Error).message || "Não foi possível salvar o arquivo.", "error");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const thumb = found ? (found.kind === "image" ? found.url : found.poster) : undefined;
  return (
    <li
      className={`tl-map-row ${found ? "ok" : ""} ${over ? "drop" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); void send(e.dataTransfer.files[0]); }}
    >
      <span className="tl-map-ic" role="img" aria-label={found ? "Arquivo encontrado" : "Arquivo faltando"}>
        {found ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </span>
      {thumb && <img className="tl-map-thumb" src={thumb} alt="" loading="lazy" decoding="async" />}
      <span className="tl-map-text">
        <strong>{slot.label}</strong>
        <code>{path}.<em>{slot.hint}</em></code>
        {slot.names.length > 1 && <small>também aceita: {slot.names.slice(1).join(", ")}</small>}
      </span>
      {found && <span className="tl-map-kind">{found.kind === "video" ? "vídeo" : "imagem"}{found.poster ? " + capa" : ""}</span>}
      <input ref={input} type="file" accept={ACCEPT} hidden tabIndex={-1} aria-hidden="true" onChange={(e) => void send(e.target.files?.[0])} />
      <button
        type="button"
        className="btn btn-quiet tl-map-edit"
        disabled={busy}
        onClick={() => input.current?.click()}
        aria-label={`${found ? "Trocar" : "Escolher"} o arquivo de ${slot.label}`}
        title={found ? "Trocar imagem ou vídeo" : "Escolher imagem ou vídeo"}
      >
        {busy ? <Loader2 size={14} className="spin" /> : <Pencil size={14} />}
      </button>
      <CopyButton text={slot.names[0]} label="Copiar nome" variant="quiet" />
    </li>
  );
}

/** Mapa de mídia: mostra qual arquivo cada card espera e se ele já está em public/media. */
export default function MediaMapPage() {
  const { products } = useProducts();
  const [onlyMissing, setOnlyMissing] = useState(false);
  const toast = useToast();
  const [dev, setDev] = useState(false);
  useEffect(() => { void hasDevUpload().then(setDev); }, []);
  const how = dev ? "dev" : "download";
  const done_ = (mode: "dev" | "download", path: string) => toast(outcomeMessage({ mode, path }), "ok");
  // prompts que o usuário criou na Galeria também precisam de um lugar para a mídia
  const [cVideos] = usePersistentState<LibraryItem[]>("custom:videos", []);
  const [cProntas] = usePersistentState<LibraryItem[]>("custom:prontas", []);
  const [cMov] = usePersistentState<LibraryItem[]>("custom:movimentos", []);
  const slots = useMemo(() => {
    const mine = [...cProntas, ...cVideos, ...cMov].map((i): MediaSlot => ({ category: "library", names: libraryNames(i), label: i.title, group: "Seus prompts (criados na Galeria)", hint: "mp4 ou jpg" }));
    return [...mine, ...buildSlots(products)];
  }, [products, cVideos, cProntas, cMov]);
  const groups = useMemo(() => {
    const map = new Map<string, MediaSlot[]>();
    for (const s of slots) map.set(s.group, [...(map.get(s.group) ?? []), s]);
    return [...map.entries()];
  }, [slots]);

  const total = slots.length;
  const done = slots.filter((s) => media.has(s.category, s.names)).length;
  const claimed = useMemo(() => claimedKeys(slots), [slots]);
  const unclaimed = media.allKeys().filter((k) => !claimed.has(k) && !k.startsWith("gallery/") && !(k.startsWith("avatars/") && /^avatars\/[fm]-./.test(k)));
  const newGallery = media.idsIn("gallery").filter((id) => !GALLERY.some((g) => g.id === id));
  const { ignored, warnings, totalBytes } = media.manifest;

  return (
    <section>
      <header className="tl-gallery-head">
        <div>
          <h1>Mapa de <em>mídia</em></h1>
          <p>Cada card do app procura o seu arquivo em <code>public/media/&lt;pasta&gt;/&lt;nome&gt;</code>. Clique no <strong>lápis</strong> de um card (ou arraste o arquivo sobre ele), escolha a imagem ou o vídeo e o app coloca o arquivo na pasta certa, com o nome certo.</p>
        </div>
        <label className="tl-check-row">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          <span>Mostrar só o que falta</span>
        </label>
      </header>

      <div className="tl-map-summary" role="status">
        <FolderOpen size={18} aria-hidden="true" />
        <div>
          <strong>{done} de {total} cards já têm arquivo</strong>
          <span>{(totalBytes / MB).toFixed(1)} MB em public/media · o GitHub recomenda ficar abaixo de 1 GB e bloqueia arquivos acima de 100 MB</span>
        </div>
      </div>

      <div className="tl-note" role="status">
        <strong><Info size={14} aria-hidden="true" /> Como o lápis salva:</strong>{" "}
        {how === "dev" && <>você está no <code>npm run dev</code>, então o arquivo é gravado direto em <code>public/media</code> e a página recarrega sozinha.</>}
        {how === "download" && <>este é o site publicado (GitHub Pages, Vercel), e um site publicado não consegue gravar no seu projeto. O arquivo é baixado já com o nome certo: coloque na pasta indicada, no seu computador, e faça o commit. Para gravar direto na pasta, abra o projeto pelo <code>npm run dev</code>.</>}
      </div>

      <div className="tl-note">
        Formatos: imagens <code>.jpg .png .webp</code> e vídeos <code>.mp4 .webm</code>. Maiúsculas não importam. Em qualquer card você pode usar <strong>imagem ou vídeo</strong>. Se existirem os dois com o mesmo nome, o vídeo toca e a imagem vira a capa. Para um vídeo ter uma imagem de capa, ponha um <code>.jpg</code> com o mesmo nome do <code>.mp4</code>. Depois de adicionar arquivos, rode <code>npm run dev</code> (ou faça o commit e espere o deploy).
      </div>

      {(warnings.length > 0 || ignored.length > 0 || unclaimed.length > 0) && (
        <div className="tl-map-warn" role="alert">
          <strong><AlertTriangle size={15} aria-hidden="true" /> Atenção</strong>
          <ul>
            {warnings.map((w) => <li key={w}>{w}</li>)}
            {unclaimed.map((k) => <li key={k}>O arquivo <code>media/{k}</code> não pertence a nenhum card. Confira se o nome está certo (use “Copiar nome” abaixo).</li>)}
          </ul>
        </div>
      )}

      {newGallery.length > 0 && (
        <div className="tl-note" role="status">
          <strong><Info size={14} aria-hidden="true" /> {newGallery.length} {newGallery.length === 1 ? "arquivo novo" : "arquivos novos"} na galeria:</strong>{" "}
          {newGallery.map((n) => <code key={n}>media/gallery/{n}</code>)}{" "}
          viraram cards sozinhos na <strong>Galeria de Prompts</strong> (categoria “Minha mídia”). Não precisam de nome especial.
        </div>
      )}

      {groups.map(([group, list]) => {
        const rows = onlyMissing ? list.filter((s) => !media.has(s.category, s.names)) : list;
        if (!rows.length) return null;
        const have = list.filter((s) => media.has(s.category, s.names)).length;
        return (
          <details className="tl-map-group" key={group} open={!!onlyMissing || have < list.length}>
            <summary>
              <strong>{group}</strong>
              <span>{have}/{list.length}</span>
            </summary>
            <ul>{rows.map((s) => <Row key={`${s.category}/${s.names[0]}`} slot={s} onDone={done_} />)}</ul>
          </details>
        );
      })}
    </section>
  );
}
