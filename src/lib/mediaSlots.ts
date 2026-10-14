import { MOVIMENTOS } from "../data/movimentos";
import { PRONTAS } from "../data/promptsProntas";
import { VIDEO_PROMPTS } from "../data/videoPrompts";
import type { LibraryItem } from "../data/types";
import { SEED_AVATARS, avatarNames } from "../trendly/data/avatars";
import { GALLERY } from "../trendly/data/gallery";
import { HACKS } from "../trendly/data/hacks";
import { INTERACTIONS, POSES, POV_HANDS } from "../trendly/data/options";
import type { Product } from "../trendly/data/products";
import { STYLES } from "../trendly/data/styles";
import { PRESETS } from "../humano/data/presets";
import { slug } from "./slug";
import type { MediaCategory } from "./mediaResolver";

export interface MediaSlot {
  category: MediaCategory;
  /** Nomes aceitos (sem extensão). O primeiro é o recomendado. */
  names: string[];
  label: string;
  group: string;
  hint: string;
}

/** Nomes de arquivo aceitos para um card das bibliotecas: o título em "slug" e o id. */
export const libraryNames = (item: Pick<LibraryItem, "id" | "title">): string[] => {
  const s = slug(item.title);
  return s && s !== item.id ? [s, item.id] : [item.id];
};

const lib = (group: string, items: LibraryItem[]): MediaSlot[] =>
  items.map((i) => ({ category: "library", names: libraryNames(i), label: i.title, group, hint: "mp4 ou jpg" }));

/** Todos os lugares do app que mostram uma imagem ou um vídeo de prévia. */
export function buildSlots(products: Product[]): MediaSlot[] {
  return [
    ...STYLES.map((s): MediaSlot => ({ category: "styles", names: [s.id], label: `Capa: ${s.title}`, group: "Reels Studio: capas dos estilos", hint: "jpg ou mp4" })),
    ...INTERACTIONS.map((o): MediaSlot => ({ category: "interactions", names: [o.id], label: `Interação: ${o.label}`, group: "Reels Studio: configuração da cena", hint: "mp4 ou jpg" })),
    ...POSES.map((o): MediaSlot => ({ category: "poses", names: [o.id], label: `Pose: ${o.label}`, group: "Reels Studio: configuração da cena", hint: "mp4 ou jpg" })),
    ...POV_HANDS.map((o): MediaSlot => ({ category: "hands", names: [o.id], label: `Mãos: ${o.label}`, group: "Reels Studio: configuração do POV", hint: "mp4 ou jpg" })),
    ...GALLERY.map((g): MediaSlot => ({ category: "gallery", names: [g.id], label: g.title, group: "Galeria de Prompts", hint: g.kind === "video" ? "mp4 (ou jpg como capa)" : "jpg (ou mp4)" })),
    ...SEED_AVATARS.map((a): MediaSlot => ({ category: "avatars", names: avatarNames(a), label: `Avatar: ${a.name} (${a.gender === "f" ? "mulher" : "homem"})`, group: "Avatares", hint: "jpg, png ou mp4" })),
    ...products.map((p): MediaSlot => ({ category: "products", names: [p.id], label: `Produto: ${p.name || p.id}`, group: "Produtos", hint: "jpg, png ou mp4" })),
    ...HACKS.flatMap((h) => [1, 2].map((n): MediaSlot => ({ category: "hacks", names: [`${h.id}-ex${n}`], label: `${h.title}: exemplo ${n}`, group: "Hacks Virais: exemplos", hint: "mp4 (ou jpg)" }))),
    ...(["imagem", "video"] as const).flatMap((m) =>
      (["original", "realista"] as const).map((side): MediaSlot => ({ category: "humano", names: [`padrao-${m}-${side}`], label: `Comparação padrão (${m === "imagem" ? "imagem" : "vídeo"}): ${side === "original" ? "Original" : "Realista"}`, group: "Humanizar IA: comparação Original × Realista", hint: "jpg, png ou mp4" })),
    ),
    ...PRESETS.flatMap((p) =>
      (["original", "realista"] as const).map((side): MediaSlot => ({ category: "humano", names: [`${p.id}-${side}`], label: `${p.title}: ${side === "original" ? "Original" : "Realista"}`, group: "Humanizar IA: comparação por preset (opcional)", hint: "jpg, png ou mp4" })),
    ),
    ...PRESETS.map((p): MediaSlot => ({ category: "humano", names: [p.id], label: `Miniatura: ${p.title}`, group: "Humanizar IA: miniaturas dos presets", hint: "jpg, png ou mp4" })),
    ...lib("Prompts dos Vídeos do TikTok", VIDEO_PROMPTS),
    ...lib("Prompts Prontas", PRONTAS),
    ...lib("Movimentos Especiais", MOVIMENTOS),
  ];
}

/** Chaves ("categoria/nome") que algum card reconhece. Serve para achar arquivos com nome errado. */
export function claimedKeys(slots: MediaSlot[]): Set<string> {
  const set = new Set<string>();
  for (const s of slots) for (const n of s.names) set.add(`${s.category}/${n}`.toLowerCase());
  return set;
}
