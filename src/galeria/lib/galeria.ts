import type { LibraryItem, PromptMode } from "../../data/types";
import { libraryNames } from "../../lib/mediaSlots";
import { GALLERY, type GalleryKind, type GalleryPrompt } from "../../trendly/data/gallery";
import type { StyleId } from "../../trendly/data/styles";

export interface GaleriaCategory {
  id: string;
  label: string;
}

/** Categorias dos 46 prompts da galeria (cada um está em exatamente uma). */
export const CATEGORIES: GaleriaCategory[] = [
  { id: "look", label: "Look e movimento" },
  { id: "camera", label: "Giros e câmera" },
  { id: "cabelo", label: "Cabelo" },
  { id: "cta", label: "Chamada para ação" },
  { id: "danca", label: "Dança e energia" },
  { id: "espelho", label: "Espelho e selfie" },
  { id: "tecido", label: "Tecido e produto" },
  { id: "pov", label: "POV" },
  { id: "pessoa", label: "Pessoa e realismo" },
];

/** Vídeos e imagens colocados na pasta public/media/gallery que não têm card próprio. */
export const MEDIA_CATEGORY: GaleriaCategory = { id: "midia", label: "Minha mídia" };

/** As três coleções que antes ficavam no painel e agora moram na Galeria. */
export type Collection = "videos" | "prontas" | "movimentos";
export const COLLECTIONS: { id: Collection; label: string }[] = [
  { id: "videos", label: "Prompts dos Vídeos do TikTok" },
  { id: "prontas", label: "Prompts Prontas" },
  { id: "movimentos", label: "Movimentos Especiais" },
];
export const READY_CATEGORY: GaleriaCategory = { id: "prontos", label: "Prompts prontos" };
export const isCollection = (v: string | null | undefined): v is Collection => COLLECTIONS.some((c) => c.id === v);

const BY_CATEGORY: Record<string, string[]> = {
  look: ["movimento-fashion", "movimento-natural", "mao-cintura", "foco-look", "olhar-lento", "assimetrico", "revelacao", "convite-amigavel", "selfie-pensativo"],
  camera: ["giro-360", "giro-lento-look", "desvio-lateral", "tapar-camera"],
  cabelo: ["movimento-cabelo", "arrumando-cabelo", "selfie-cabelo"],
  cta: ["mostrar-look-cta", "cta-apontar", "cta-carrinho", "ritmico-apontar"],
  danca: ["dancinha", "dancinhas-ritmicas", "energia-alta", "levantamento-terra"],
  espelho: ["espelho-academia", "espelho-provador", "espelho-lateral", "foto-espelho-v1", "foto-espelho-v2", "selfie-carro", "selfie-restaurante", "espelho-textura", "espelho-relax"],
  tecido: ["toque-tecido", "destaque-tecido", "produto-rosto", "pacote-img", "pacote-vid"],
  pov: ["pov-capinha", "pov-pequeno", "pov-cabide", "pov-sapatos", "pov-sapatos-img"],
  pessoa: ["corpo-todo", "estilo-vida", "pele-real"],
};

const CATEGORY_BY_ID: Record<string, string> = Object.fromEntries(Object.entries(BY_CATEGORY).flatMap(([cat, ids]) => ids.map((id) => [id, cat])));

export const categoryOf = (id: string): string => CATEGORY_BY_ID[id] ?? "look";
export const categoryLabel = (id: string): string =>
  id === MEDIA_CATEGORY.id ? MEDIA_CATEGORY.label : id === READY_CATEGORY.id ? READY_CATEGORY.label : CATEGORIES.find((c) => c.id === id)?.label ?? "";
export const collectionLabel = (id: Collection): string => COLLECTIONS.find((c) => c.id === id)?.label ?? "";

export type Origin = "gallery" | "media" | "lib";

export interface GaleriaItem {
  id: string;
  kind: GalleryKind;
  title: string;
  description: string;
  prompt: string;
  /** Observações (só os prompts prontos têm). */
  obs: string;
  styles: StyleId[];
  category: string;
  origin: Origin;
  /** Veio de um arquivo da pasta de mídia, sem card próprio. */
  fromMedia: boolean;
  /** Pasta de mídia em que o card procura o arquivo. */
  mediaCategory: "gallery" | "library";
  /** Nomes de arquivo que este card procura. */
  mediaNames: string[];
  collection?: Collection;
  /** Pasta (só em Prompts Prontas). */
  folder?: string;
  /** Prompt cadastrado pelo próprio usuário. */
  userMade: boolean;
  cover?: { tag?: string; emoji?: string; hue: number };
  mode?: PromptMode;
  draft?: boolean;
  /** Vídeo no formato novo: abre a área de montagem. */
  hasSpec: boolean;
  /** O item da biblioteca por trás (já com as edições), para os diálogos de IA. */
  lib?: LibraryItem;
}

export interface GaleriaView extends GaleriaItem {
  edited: boolean;
  originalTitle: string;
  originalPrompt: string;
  originalObs: string;
}

/** "giro-lateral_novo" vira "Giro lateral novo". */
export const humanize = (name: string): string => {
  const t = name.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : name;
};

/** Os títulos dos prompts trazem "(Vídeo)" ou "(Imagem)"; o selo do card já diz isso. */
export const displayTitle = (title: string): string => title.replace(/\s*\((?:Vídeo|Imagem)\)\s*$/i, "");

/** Prompt que fala em vídeo é de vídeo; senão, de imagem. */
export const inferKind = (prompt: string): GalleryKind => (/v[íi]deo/i.test(prompt) ? "video" : "image");

const base = (): Pick<GaleriaItem, "obs" | "userMade" | "hasSpec"> => ({ obs: "", userMade: false, hasSpec: false });

/**
 * Monta a lista da galeria: primeiro os arquivos novos da pasta de mídia (um card automático para cada),
 * depois os 46 prompts. Os prompts prontos entram à parte, por `libraryViews`.
 */
export function buildItems(mediaIds: string[], kindOf: (name: string) => GalleryKind): GaleriaItem[] {
  const known = new Set(GALLERY.map((g) => g.id));
  const extras: GaleriaItem[] = [...new Set(mediaIds)]
    .filter((n) => !known.has(n))
    .sort((a, b) => a.localeCompare(b))
    .map((n) => ({
      ...base(),
      id: `media:${n}`,
      kind: kindOf(n),
      title: humanize(n),
      description: "Mídia adicionada pela pasta public/media/gallery. Clique no lápis para escrever o prompt.",
      prompt: "",
      styles: [],
      category: MEDIA_CATEGORY.id,
      origin: "media" as const,
      fromMedia: true,
      mediaCategory: "gallery" as const,
      mediaNames: [n],
    }));
  const items: GaleriaItem[] = GALLERY.map((g: GalleryPrompt) => ({
    ...base(),
    ...g,
    category: categoryOf(g.id),
    origin: "gallery" as const,
    fromMedia: false,
    mediaCategory: "gallery" as const,
    mediaNames: [g.id],
  }));
  return [...extras, ...items];
}

export interface Edit {
  title?: string;
  prompt?: string;
  obs?: string;
}
export type Edits = Record<string, Edit>;

/** Aplica as edições do usuário. "Editado" só vale quando o texto realmente difere do original. */
export function applyEdits(items: GaleriaItem[], edits: Edits): GaleriaView[] {
  return items.map((it) => {
    const e = edits[it.id];
    const title = e?.title !== undefined ? e.title : it.title;
    const prompt = e?.prompt !== undefined ? e.prompt : it.prompt;
    const obs = e?.obs !== undefined ? e.obs : it.obs;
    return { ...it, title, prompt, obs, edited: title !== it.title || prompt !== it.prompt || obs !== it.obs, originalTitle: it.title, originalPrompt: it.prompt, originalObs: it.obs };
  });
}

export type LibraryOverrides = Record<string, { title?: string; prompt?: string; obs?: string }>;

const descriptionFor = (col: Collection, i: LibraryItem): string => {
  if (i.source === "user") return "Prompt cadastrado por você.";
  if (col === "videos") return i.spec?.resumo ?? "Ideia de vídeo no formato novo (a foto do produto é o primeiro quadro).";
  if (col === "prontas") return `Prompt pronto da pasta “${i.category ?? "Prompts Prontas"}”.`;
  return "Movimento especial: um gesto reutilizável para o seu influencer.";
};

/**
 * Transforma os itens de uma biblioteca (já mesclados com as edições e os prompts do usuário) em cards da galeria.
 * `builtin` traz os textos de fábrica, para saber o que foi editado.
 */
export function libraryViews(col: Collection, items: LibraryItem[], builtin: LibraryItem[], overrides: LibraryOverrides): GaleriaView[] {
  const orig = new Map(builtin.map((b) => [b.id, b]));
  return items.map((i) => {
    const o = orig.get(i.id);
    const userMade = i.source === "user";
    const ov = overrides[i.id];
    const edited = !userMade && !!o && !!ov && ((ov.title ?? o.title) !== o.title || (ov.prompt ?? o.prompt) !== o.prompt || (ov.obs ?? o.obs) !== o.obs);
    return {
      id: `lib:${col}:${i.id}`,
      kind: col === "videos" || col === "movimentos" || i.spec ? "video" : inferKind(i.prompt),
      title: i.title,
      description: descriptionFor(col, i),
      prompt: i.prompt,
      obs: i.obs,
      styles: [],
      category: READY_CATEGORY.id,
      origin: "lib" as const,
      fromMedia: false,
      mediaCategory: "library" as const,
      mediaNames: libraryNames(i),
      collection: col,
      folder: i.category,
      userMade,
      cover: i.cover,
      mode: i.mode,
      draft: i.draft,
      hasSpec: !!i.spec,
      lib: i,
      edited,
      originalTitle: o?.title ?? i.title,
      originalPrompt: o?.prompt ?? i.prompt,
      originalObs: o?.obs ?? i.obs,
    };
  });
}

/** Linha pequena abaixo do título do card. */
export const subtitleOf = (it: GaleriaItem): string =>
  it.origin === "lib" ? (it.collection === "prontas" && it.folder ? it.folder : collectionLabel(it.collection!)) : categoryLabel(it.category);

export type KindFilter = "all" | GalleryKind;
export type ViewFilter = "all" | "fav" | "new" | "edited" | "media";

export interface Filters {
  q: string;
  kind: KindFilter;
  view: ViewFilter;
  category: string | null;
  style: StyleId | null;
  collection: Collection | null;
  folder: string | null;
}

export const EMPTY_FILTERS: Filters = { q: "", kind: "all", view: "all", category: null, style: null, collection: null, folder: null };

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function filterItems(items: GaleriaView[], f: Filters, isFav: (it: GaleriaView) => boolean, hasMedia: (it: GaleriaView) => boolean): GaleriaView[] {
  const q = norm(f.q.trim());
  return items.filter((it) => {
    if (f.kind !== "all" && it.kind !== f.kind) return false;
    if (f.view === "fav" && !isFav(it)) return false;
    if (f.view === "new" && !it.fromMedia) return false;
    if (f.view === "edited" && !it.edited) return false;
    if (f.view === "media" && !hasMedia(it)) return false;
    if (f.category && it.category !== f.category) return false;
    if (f.collection && it.collection !== f.collection) return false;
    if (f.folder && it.folder !== f.folder) return false;
    if (f.style && !it.styles.includes(f.style)) return false;
    if (q && !norm(`${it.title} ${it.description} ${it.prompt} ${it.obs} ${it.folder ?? ""}`).includes(q)) return false;
    return true;
  });
}

export interface Counts {
  all: number;
  video: number;
  image: number;
  fav: number;
  new: number;
  edited: number;
  media: number;
  byCategory: Record<string, number>;
  byStyle: Record<string, number>;
  byCollection: Record<string, number>;
  byFolder: Record<string, number>;
}

export function countItems(items: GaleriaView[], isFav: (it: GaleriaView) => boolean, hasMedia: (it: GaleriaView) => boolean): Counts {
  const c: Counts = { all: items.length, video: 0, image: 0, fav: 0, new: 0, edited: 0, media: 0, byCategory: {}, byStyle: {}, byCollection: {}, byFolder: {} };
  for (const it of items) {
    if (it.kind === "video") c.video++;
    else c.image++;
    if (isFav(it)) c.fav++;
    if (it.fromMedia) c.new++;
    if (it.edited) c.edited++;
    if (hasMedia(it)) c.media++;
    c.byCategory[it.category] = (c.byCategory[it.category] ?? 0) + 1;
    if (it.collection) c.byCollection[it.collection] = (c.byCollection[it.collection] ?? 0) + 1;
    if (it.folder) c.byFolder[it.folder] = (c.byFolder[it.folder] ?? 0) + 1;
    for (const s of it.styles) c.byStyle[s] = (c.byStyle[s] ?? 0) + 1;
  }
  return c;
}

/**
 * Contagens "em camadas": cada grupo de filtros mostra quantos itens sobrariam com TODOS os outros filtros ligados.
 * Assim o número ao lado de "Prompts dos Vídeos do TikTok" bate com o que aparece ao clicar nele, e fica claro
 * quando outro filtro (por exemplo "Editados por mim") está escondendo os cards.
 */
export function facetCounts(items: GaleriaView[], f: Filters, isFav: (it: GaleriaView) => boolean, hasMedia: (it: GaleriaView) => boolean): Counts {
  const of = (g: Filters) => countItems(filterItems(items, g, isFav, hasMedia), isFav, hasMedia);
  const view = of({ ...f, view: "all" });
  const kind = of({ ...f, kind: "all" });
  const place = of({ ...f, category: null, collection: null, folder: null });
  const style = of({ ...f, style: null });
  return {
    all: items.length,
    video: kind.video,
    image: kind.image,
    fav: view.fav,
    new: view.new,
    edited: view.edited,
    media: view.media,
    byCategory: place.byCategory,
    byCollection: place.byCollection,
    byFolder: place.byFolder,
    byStyle: style.byStyle,
  };
}

export type FilterKey = "q" | "kind" | "view" | "category" | "collection" | "folder" | "style";
const VIEW_LABEL: Record<ViewFilter, string> = { all: "", fav: "Favoritos", new: "Novos na minha mídia", edited: "Editados por mim", media: "Com mídia" };

/** Filtros ligados no momento, em texto, para mostrar como etiquetas que dá para remover. */
export function activeFilters(f: Filters): { key: FilterKey; label: string }[] {
  const out: { key: FilterKey; label: string }[] = [];
  if (f.q.trim()) out.push({ key: "q", label: `Busca: “${f.q.trim()}”` });
  if (f.view !== "all") out.push({ key: "view", label: VIEW_LABEL[f.view] });
  if (f.kind !== "all") out.push({ key: "kind", label: f.kind === "video" ? "Vídeo" : "Imagem" });
  if (f.collection) out.push({ key: "collection", label: collectionLabel(f.collection) });
  else if (f.category) out.push({ key: "category", label: categoryLabel(f.category) });
  if (f.folder) out.push({ key: "folder", label: `Pasta: ${f.folder}` });
  if (f.style) out.push({ key: "style", label: `Reels Studio: ${STYLE_LABEL[f.style]}` });
  return out;
}

/** Tira um filtro (ao tirar a coleção, sai também a pasta e o grupo "Prompts prontos"). */
export function withoutFilter(f: Filters, key: FilterKey): Filters {
  switch (key) {
    case "q": return { ...f, q: "" };
    case "kind": return { ...f, kind: "all" };
    case "view": return { ...f, view: "all" };
    case "collection": return { ...f, collection: null, folder: null, category: f.category === READY_CATEGORY.id ? null : f.category };
    case "category": return { ...f, category: null };
    case "folder": return { ...f, folder: null };
    case "style": return { ...f, style: null };
  }
}

export const HOW_TO: Record<GalleryKind, string> = {
  video: "No Flow, escolha “Frames to Video” e suba a foto do seu influencer (ou do seu produto) como primeiro quadro. Cole o prompt e gere. Troque o que depende do produto (a peça, o cenário, a fala) e gere de 3 a 4 versões.",
  image: "Anexe a foto de referência da pessoa no gerador de imagens, cole o prompt e gere em 9:16. Use o resultado como primeiro quadro dos vídeos no Flow.",
};

export const STYLE_LABEL: Record<StyleId, string> = { ugc: "UGC", pov: "POV", provador: "Provador" };
