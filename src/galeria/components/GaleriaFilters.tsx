import { Clapperboard, Film, FolderHeart, Heart, Image as ImageIcon, LayoutGrid, Pencil, Sparkles, type LucideIcon } from "lucide-react";
import { STYLES } from "../../trendly/data/styles";
import { PRONTAS_CATEGORIES } from "../../data/promptsProntas";
import { CATEGORIES, COLLECTIONS, EMPTY_FILTERS, MEDIA_CATEGORY, READY_CATEGORY, STYLE_LABEL, type Counts, type Filters } from "../lib/galeria";

function Item({ icon: Icon, label, count, active, onClick, sub = 0 }: { icon?: LucideIcon; label: string; count: number; active: boolean; onClick: () => void; sub?: 0 | 1 | 2 }) {
  return (
    <button type="button" className={`gl-f ${sub ? `sub${sub}` : ""} ${active ? "on" : ""}`} aria-pressed={active} onClick={onClick}>
      {Icon && <Icon size={15} aria-hidden="true" />}
      <span>{label}</span>
      <b>{count}</b>
    </button>
  );
}

interface Props {
  counts: Counts;
  filters: Filters;
  open: boolean;
  onChange: (f: Filters) => void;
}

/** Filtros à esquerda: favoritos, explorar, formato, categorias e estilo do Reels Studio. Clicar de novo desmarca. */
export function GaleriaFilters({ counts, filters, open, onChange }: Props) {
  const set = (p: Partial<Filters>) => onChange({ ...filters, ...p });
  const toggleView = (v: Filters["view"]) => set({ view: filters.view === v ? "all" : v });
  const isAll = filters.view === "all" && filters.kind === "all" && !filters.category && !filters.style && !filters.collection && !filters.folder && !filters.q;
  const readyOn = filters.category === READY_CATEGORY.id && !filters.collection;
  const cats = counts.byCategory[MEDIA_CATEGORY.id] ? [...CATEGORIES, MEDIA_CATEGORY] : CATEGORIES;
  return (
    <aside className={`gl-filters ${open ? "open" : ""}`} aria-label="Filtros da galeria">
      <button type="button" className={`gl-fav-box ${filters.view === "fav" ? "on" : ""}`} aria-pressed={filters.view === "fav"} onClick={() => toggleView("fav")}>
        <Heart size={18} aria-hidden="true" />
        <span><strong>Favoritos</strong><small>Salve com o coração</small></span>
        <b>{counts.fav}</b>
      </button>

      <h2>Explorar</h2>
      <Item icon={LayoutGrid} label="Todos os prompts" count={counts.all} active={isAll} onClick={() => onChange({ ...EMPTY_FILTERS })} />
      <Item icon={Sparkles} label="Novos na minha mídia" count={counts.new} active={filters.view === "new"} onClick={() => toggleView("new")} />
      <Item icon={Pencil} label="Editados por mim" count={counts.edited} active={filters.view === "edited"} onClick={() => toggleView("edited")} />

      <h2>Prompts prontos</h2>
      <Item icon={FolderHeart} label="Todos os prompts prontos" count={counts.byCategory[READY_CATEGORY.id] ?? 0} active={readyOn} onClick={() => set({ category: readyOn ? null : READY_CATEGORY.id, collection: null, folder: null })} />
      {COLLECTIONS.map((c) => (
        <Item key={c.id} sub={1} label={c.label} count={counts.byCollection[c.id] ?? 0} active={filters.collection === c.id} onClick={() => set({ category: READY_CATEGORY.id, collection: filters.collection === c.id ? null : c.id, folder: null })} />
      ))}
      {filters.collection === "prontas" &&
        PRONTAS_CATEGORIES.map((f) => (
          <Item key={f} sub={2} label={f} count={counts.byFolder[f] ?? 0} active={filters.folder === f} onClick={() => set({ folder: filters.folder === f ? null : f })} />
        ))}

      <h2>Formato</h2>
      <Item icon={Film} label="Vídeo" count={counts.video} active={filters.kind === "video"} onClick={() => set({ kind: filters.kind === "video" ? "all" : "video" })} />
      <Item icon={ImageIcon} label="Imagem" count={counts.image} active={filters.kind === "image"} onClick={() => set({ kind: filters.kind === "image" ? "all" : "image" })} />

      <h2>Categorias</h2>
      {cats.map((c) => (
        <Item key={c.id} label={c.label} count={counts.byCategory[c.id] ?? 0} active={filters.category === c.id} onClick={() => set({ category: filters.category === c.id ? null : c.id })} />
      ))}

      <h2>Reels Studio</h2>
      {STYLES.map((s) => (
        <Item key={s.id} icon={Clapperboard} label={STYLE_LABEL[s.id]} count={counts.byStyle[s.id] ?? 0} active={filters.style === s.id} onClick={() => set({ style: filters.style === s.id ? null : s.id })} />
      ))}
    </aside>
  );
}
