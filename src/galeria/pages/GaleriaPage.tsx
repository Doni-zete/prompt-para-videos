import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FolderOpen, HelpCircle, Images, Plus, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import { AdaptDialog } from "../../components/AdaptDialog";
import { CopyButton } from "../../components/CopyButton";
import { Modal } from "../../components/Modal";
import { UserDataBar } from "../../components/UserDataBar";
import { MediaPicker } from "../../components/MediaPicker";
import { NewPromptDialog } from "../../components/NewPromptDialog";
import { uniqueSlug } from "../../lib/slug";
import { useAutoplay } from "../../lib/videoMotion";
import { VeoDialog } from "../../components/VeoDialog";
import { VideoGuide } from "../../components/VideoGuide";
import { VideoWorkspace } from "../../components/VideoWorkspace";
import { useGemini } from "../../context/GeminiContext";
import { useToast } from "../../context/ToastContext";
import { MOVIMENTOS } from "../../data/movimentos";
import { PRONTAS, PRONTAS_CATEGORIES } from "../../data/promptsProntas";
import type { LibraryItem } from "../../data/types";
import { VIDEO_PROMPTS } from "../../data/videoPrompts";
import { useFavorites } from "../../hooks/useFavorites";
import { useLibrary } from "../../hooks/useLibrary";
import { usePersistentState } from "../../hooks/usePersistentState";
import { copyText } from "../../lib/clipboard";
import { media } from "../../lib/media";
import { recordRecent } from "../../lib/recent";
import { useTrendlyFavorites } from "../../trendly/hooks/useTrendlyFavorites";
import { GaleriaCard } from "../components/GaleriaCard";
import { GaleriaDetail } from "../components/GaleriaDetail";
import { GaleriaFilters } from "../components/GaleriaFilters";
import {
  EMPTY_FILTERS, READY_CATEGORY, activeFilters, applyEdits, displayTitle, buildItems, facetCounts, withoutFilter, filterItems, isCollection, libraryViews, type Collection, type Edit, type Edits, type Filters, type GaleriaView,
} from "../lib/galeria";
import "../galeria.css";

const PAGE = 60;
const FFMPEG = 'ffmpeg -i entrada.mov -vf "scale=-2:720" -c:v libx264 -crf 28 -preset slow -movflags +faststart -an saida.mp4';

/** Todos os nomes de arquivo que existem em public/media/gallery (um card por nome). */
const MEDIA_IDS = media.idsIn("gallery");
const BASE = buildItems(MEDIA_IDS, (n) => media.resolve("gallery", [n])?.kind ?? "image");

/** Filtros iniciais a partir do endereço (os links antigos #/biblioteca/... redirecionam para cá). */
function fromParams(p: URLSearchParams): Filters {
  const c = p.get("c");
  const v = p.get("v");
  const view = v === "fav" || v === "edited" || v === "new" || v === "media" ? v : null;
  if (!isCollection(c)) return view ? { ...EMPTY_FILTERS, view } : EMPTY_FILTERS;
  const pasta = p.get("pasta");
  return { ...EMPTY_FILTERS, ...(view ? { view } : {}), category: READY_CATEGORY.id, collection: c, folder: c === "prontas" && pasta && (PRONTAS_CATEGORIES as readonly string[]).includes(pasta) ? pasta : null };
}

export default function GaleriaPage() {
  const toast = useToast();
  const { status } = useGemini();
  const canAi = status === "connected";
  const [params] = useSearchParams();
  const trendlyFav = useTrendlyFavorites();
  const libFav = useFavorites();
  const [edits, setEdits] = usePersistentState<Edits>("galeria:edits", {});
  const libVideos = useLibrary("videos", VIDEO_PROMPTS);
  const libProntas = useLibrary("prontas", PRONTAS);
  const libMov = useLibrary("movimentos", MOVIMENTOS);
  const libs = { videos: libVideos, prontas: libProntas, movimentos: libMov };

  const [autoplay, setAutoplay] = useAutoplay();
  const [filters, setFilters] = useState<Filters>(() => fromParams(params));
  const [limit, setLimit] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<{ id: string; edit: boolean } | null>(null);
  const [workspace, setWorkspace] = useState<LibraryItem | null>(null);
  const [veo, setVeo] = useState<{ open: boolean; item: LibraryItem | null }>({ open: false, item: null });
  const [adapting, setAdapting] = useState<LibraryItem | null>(null);

  // Ao chegar por um link como #/galeria?c=videos (já estando na galeria), aplica o filtro.
  const search = params.toString();
  useEffect(() => {
    if (params.get("c") || params.get("v")) {
      setFilters(fromParams(params));
      setLimit(PAGE);
    }
    if (params.get("novo")) setCreating(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const galleryViews = useMemo(() => applyEdits(BASE, edits), [edits]);
  const readyViews = useMemo(
    () =>
      [
        ...libraryViews("videos", libVideos.items, VIDEO_PROMPTS, libVideos.overrides),
        ...libraryViews("prontas", libProntas.items, PRONTAS, libProntas.overrides),
        ...libraryViews("movimentos", libMov.items, MOVIMENTOS, libMov.overrides),
      ].map((v) => {
        // se a mídia enviada é um vídeo (ou uma imagem), o card passa a ser desse tipo
        const m = media.resolve(v.mediaCategory, v.mediaNames);
        return m && m.kind !== v.kind ? { ...v, kind: m.kind } : v;
      }),
    [libVideos.items, libVideos.overrides, libProntas.items, libProntas.overrides, libMov.items, libMov.overrides],
  );
  const items = useMemo(() => [...galleryViews, ...readyViews], [galleryViews, readyViews]);

  const isFav = useCallback((it: GaleriaView) => (it.origin === "lib" ? libFav.favorites.includes(it.lib!.id) : trendlyFav.favorites.includes(it.id)), [libFav.favorites, trendlyFav.favorites]);
  const toggleFav = (it: GaleriaView) => (it.origin === "lib" ? libFav.toggle(it.lib!.id) : trendlyFav.toggle(it.id));
  const mediaOf = useCallback((it: GaleriaView) => media.resolve(it.mediaCategory, it.mediaNames), []);
  const hasMedia = useCallback((it: GaleriaView) => mediaOf(it) !== null, [mediaOf]);
  const counts = useMemo(() => facetCounts(items, filters, isFav, hasMedia), [items, filters, isFav, hasMedia]);
  const filtered = useMemo(() => filterItems(items, filters, isFav, hasMedia), [items, filters, isFav, hasMedia]);
  const shown = filtered.slice(0, limit);
  const chips = useMemo(() => activeFilters(filters), [filters]);

  const change = (f: Filters) => {
    setFilters(f);
    setLimit(PAGE);
  };

  const idx = open ? filtered.findIndex((i) => i.id === open.id) : -1;
  const current = idx >= 0 ? filtered[idx] : open ? items.find((i) => i.id === open.id) ?? null : null;

  // Link do painel (#/galeria?p=<id>): abre o prompt direto.
  useEffect(() => {
    const pid = params.get("p");
    if (pid && items.some((i) => i.id === pid)) setOpen({ id: pid, edit: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  // "Continue de onde parou" no painel
  useEffect(() => {
    if (current) recordRecent({ kind: "prompt", id: current.id, title: displayTitle(current.title), to: `/galeria?p=${encodeURIComponent(current.id)}` });
  }, [current?.id, current?.title]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (d: number) => {
    if (!filtered.length || idx < 0) return;
    setOpen({ id: filtered[(idx + d + filtered.length) % filtered.length].id, edit: false });
  };

  const save = (it: GaleriaView, e: Edit, msg = "Prompt salvo neste navegador.") => {
    const title = (e.title ?? it.title).trim() || it.title;
    const prompt = e.prompt ?? it.prompt;
    const obs = e.obs ?? it.obs;
    if (it.origin === "lib") {
      const lib = libs[it.collection as Collection];
      const id = it.lib!.id;
      if (it.userMade) lib.edit(id, { title, prompt, obs });
      else if (title === it.originalTitle && prompt === it.originalPrompt && obs === it.originalObs) lib.reset(id);
      else lib.edit(id, { title, prompt, obs });
    } else {
      const next: Edit = {};
      if (title !== it.originalTitle) next.title = title;
      if (prompt !== it.originalPrompt) next.prompt = prompt;
      setEdits((prev) => {
        const copy = { ...prev };
        if (next.title === undefined && next.prompt === undefined) delete copy[it.id];
        else copy[it.id] = next;
        return copy;
      });
    }
    toast(msg, "ok");
  };
  const reset = (it: GaleriaView) => {
    if (it.origin === "lib") libs[it.collection as Collection].reset(it.lib!.id);
    else
      setEdits((prev) => {
        const copy = { ...prev };
        delete copy[it.id];
        return copy;
      });
    toast("Voltou ao texto original.", "ok");
  };
  const remove = (it: GaleriaView) => {
    libs[it.collection as Collection].remove(it.lib!.id);
    setOpen(null);
    toast("Prompt excluído.", "ok");
  };
  const quickCopy = async (it: GaleriaView) => {
    const ok = await copyText(it.prompt);
    toast(ok ? "Prompt copiado!" : "Não foi possível copiar. Abra o prompt e use Ctrl+C.", ok ? "ok" : "error");
  };
  const montar = (it: GaleriaView) => {
    setOpen(null);
    setWorkspace(it.lib ?? null);
  };
  const veoFor = (it: GaleriaView) => {
    setOpen(null);
    setVeo({ open: true, item: it.lib ?? null });
  };

  const pills: { id: string; label: string; on: boolean; apply: () => void }[] = [
    { id: "all", label: "Tudo", on: filters.kind === "all" && filters.view !== "media", apply: () => change({ ...filters, kind: "all", view: filters.view === "media" ? "all" : filters.view }) },
    { id: "video", label: "Vídeo", on: filters.kind === "video", apply: () => change({ ...filters, kind: "video" }) },
    { id: "image", label: "Imagem", on: filters.kind === "image", apply: () => change({ ...filters, kind: "image" }) },
    { id: "media", label: "Com mídia", on: filters.view === "media", apply: () => change({ ...filters, view: filters.view === "media" ? "all" : "media" }) },
  ];

  return (
    <div className="page gl">
      <header className="gl-head">
        <div className="gl-head-text">
          <h1>Galeria de <em>Prompts</em></h1>
          <p>Copie, edite com o lápis, favorite. Aqui estão também os <strong>Prompts prontos</strong> (Vídeos do TikTok, Prompts Prontas e Movimentos Especiais). Vídeos novos entram sozinhos pela pasta <code>public/media/gallery</code>.</p>
          <p className="gl-count" role="status">Mostrando <b>{filtered.length}</b> de <b>{items.length}</b> prompts</p>
        </div>
        <div className="gl-head-tools">
          <div className="gl-pills" role="group" aria-label="Formato">
            {pills.map((p) => (
              <button key={p.id} type="button" className={`gl-pill ${p.on ? "on" : ""}`} aria-pressed={p.on} onClick={p.apply}>{p.label}</button>
            ))}
          </div>
          <button type="button" className={`gl-motion ${autoplay ? "on" : ""}`} aria-pressed={autoplay} onClick={() => setAutoplay(!autoplay)} title="Liga ou desliga o movimento dos vídeos nos cards">
            {autoplay ? "Movimento: ligado" : "Movimento: desligado"}
          </button>
          <label className="gl-search">
            <Search size={15} aria-hidden="true" />
            <input type="search" value={filters.q} onChange={(e) => change({ ...filters, q: e.target.value })} placeholder="Buscar por título, pasta ou prompt" aria-label="Buscar prompt" />
          </label>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={14} /> Novo prompt</button>
          <button type="button" className="gl-filter-toggle" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
            <SlidersHorizontal size={14} /> Filtros
          </button>
        </div>
      </header>

      <div className="gl-layout">
        <GaleriaFilters counts={counts} filters={filters} open={filtersOpen} onChange={change} />

        <section className="gl-main" aria-label="Prompts">
          {chips.length > 0 && (
            <div className="gl-active" role="group" aria-label="Filtros ligados">
              <span className="gl-active-title">Filtros ligados:</span>
              {chips.map((c) => (
                <button key={c.key} type="button" className="gl-chip-x" onClick={() => change(withoutFilter(filters, c.key))} aria-label={`Tirar filtro ${c.label}`}>
                  {c.label} <X size={12} aria-hidden="true" />
                </button>
              ))}
              {chips.length > 1 && <button type="button" className="gl-link" onClick={() => change({ ...EMPTY_FILTERS })}>Limpar todos</button>}
            </div>
          )}

          {filters.collection === "videos" && <VideoGuide canGenerate={canAi} onGenerate={() => setVeo({ open: true, item: null })} />}

          <UserDataBar />

          <div className="gl-tip">
            <FolderOpen size={16} aria-hidden="true" />
            <span>
              <strong>Quer adicionar vídeos?</strong> Clique em <strong>Subir vídeo ou imagem</strong>, escolha o arquivo e um card novo aparece sozinho, em “Minha mídia”. Depois é só escrever o prompt no lápis.
            </span>
            <MediaPicker category="gallery" name={(f) => uniqueSlug(f.name.replace(/\.[^.]+$/, ""), MEDIA_IDS, "midia")} label="Subir vídeo ou imagem para a galeria" className="btn btn-primary btn-sm">
              <Upload size={14} /> Subir vídeo ou imagem
            </MediaPicker>
            <button type="button" className="gl-link" onClick={() => setHelp(true)}><HelpCircle size={14} /> Como adicionar</button>
            <Link to="/trendly/midia" className="gl-link"><Images size={14} /> Mapa de mídia</Link>
          </div>

          <div className="gl-grid">
            {shown.map((it) => (
              <GaleriaCard
                key={it.id}
                item={it}
                media={mediaOf(it)}
                fav={isFav(it)}
                canAi={canAi}
                onFav={() => toggleFav(it)}
                onOpen={() => setOpen({ id: it.id, edit: false })}
                onEdit={() => setOpen({ id: it.id, edit: true })}
                onCopy={() => void quickCopy(it)}
                onMontar={() => montar(it)}
                onVeo={() => veoFor(it)}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="gl-empty">{filters.view === "fav" ? "Você ainda não favoritou nenhum prompt." : filters.view === "new" ? "Nenhum arquivo novo na pasta public/media/gallery ainda." : "Nenhum prompt encontrado com esses filtros."}{chips.length > 0 && <> <button type="button" className="btn btn-ghost btn-sm" onClick={() => change({ ...EMPTY_FILTERS })}>Limpar filtros</button></>}</p>
          )}

          {filtered.length > shown.length && (
            <div className="gl-more">
              <button type="button" className="btn btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>Carregar mais prompts ({filtered.length - shown.length})</button>
            </div>
          )}
        </section>
      </div>

      <GaleriaDetail
        item={current}
        media={current ? mediaOf(current) : null}
        index={Math.max(idx, 0)}
        total={filtered.length}
        fav={current ? isFav(current) : false}
        canAi={canAi}
        startEditing={open?.edit ?? false}
        onClose={() => setOpen(null)}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
        onFav={() => current && toggleFav(current)}
        onSave={(e) => current && save(current, e)}
        onRename={(t) => current && save(current, { title: t }, "Nome salvo neste navegador.")}
        onReset={() => current && reset(current)}
        onDelete={() => current && remove(current)}
        onMontar={() => current && montar(current)}
        onVeo={() => current && veoFor(current)}
        onAdapt={() => {
          if (!current?.lib) return;
          setAdapting(current.lib);
          setOpen(null);
        }}
      />

      <VideoWorkspace item={workspace} onClose={() => setWorkspace(null)} />
      <VeoDialog open={veo.open} item={veo.item} onClose={() => setVeo({ open: false, item: null })} />
      <AdaptDialog item={adapting} onClose={() => setAdapting(null)} />
      <NewPromptDialog
        open={creating}
        onClose={() => setCreating(false)}
        categories={PRONTAS_CATEGORIES}
        mediaCategory="library"
        defaultCategory={filters.folder ?? undefined}
        onSave={(data) => {
          libProntas.add(data);
          change({ ...EMPTY_FILTERS, category: READY_CATEGORY.id, collection: "prontas", folder: data.category ?? null });
          toast("Prompt criado em Prompts Prontas.", "ok");
        }}
      />

      <Modal open={help} onClose={() => setHelp(false)} title="Como adicionar vídeos à galeria" wide>
        <ol className="gl-how-list">
          <li><strong>Prepare o vídeo</strong> em <strong>MP4 (H.264)</strong> ou <strong>WebM</strong>, de preferência com menos de 50 MB (o GitHub bloqueia acima de 100 MB). Para comprimir: <code className="gl-code">{FFMPEG}</code></li>
          <li><strong>Coloque o arquivo</strong> na pasta <code>public/media/gallery</code> com um nome sem espaços, por exemplo <code>giro-lateral.mp4</code>.</li>
          <li><strong>Faça o commit</strong>. O site publica e o card aparece sozinho, com o selo <em>Novo</em>, na categoria <em>Minha mídia</em> (e em “Novos na minha mídia”). Com <code>npm run dev</code> ele aparece na hora.</li>
          <li><strong>Escreva o prompt</strong>: abra o card e clique no <strong>lápis</strong> ao lado de “Copiar prompt inteiro”. O título também pode ser editado. Isso fica salvo no seu navegador.</li>
          <li><strong>Quer uma capa?</strong> Coloque uma imagem com o mesmo nome (<code>giro-lateral.jpg</code>): ela vira a capa do vídeo.</li>
          <li><strong>Prévia dos Prompts prontos</strong> (Vídeos do TikTok, Prompts Prontas, Movimentos Especiais): a pasta é <code>public/media/library</code>, e o nome é o título do card em minúsculas e com hífens (ou o id). O <Link to="/trendly/midia">Mapa de mídia</Link> mostra o nome exato de cada um.</li>
          <li><strong>Quer trocar o vídeo de um card da galeria que já existe?</strong> Use o nome exato dele (veja no Mapa de mídia, grupo “Galeria de Prompts”).</li>
        </ol>
        <CopyButton text={FFMPEG} label="Copiar comando de compressão" variant="quiet" />
      </Modal>
    </div>
  );
}
