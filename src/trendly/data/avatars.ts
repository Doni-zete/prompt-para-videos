import { slug } from "../../lib/slug";

export type Gender = "f" | "m";

export interface Avatar {
  id: string;
  name: string;
  gender: Gender;
  /** Descrição usada pela IA quando não há foto. */
  description: string;
  /** true = avatar seu (foto em public/media/avatars/f-nome.jpg); false = avatar-base de partida. */
  mine: boolean;
  /** Nome do arquivo (sem extensão) quando o avatar nasce de uma foto da pasta. */
  file?: string;
}

const base = (id: string, name: string, gender: Gender, description: string): Avatar => ({ id: `base-${id}`, name, gender, description, mine: false });

/** Personagens fictícios de partida. Coloque a foto em public/media/avatars/<nome>.jpg para dar rosto a cada um. */
export const SEED_AVATARS: Avatar[] = [
  base("carolina", "Carolina", "f", "Mulher brasileira de 27 anos, pele morena clara, cabelo castanho ondulado até os ombros, estilo casual e sorriso aberto."),
  base("daniela", "Daniela", "f", "Mulher brasileira de 31 anos, pele negra, cabelo cacheado volumoso, olhar confiante, estilo moderno."),
  base("ana", "Ana", "f", "Mulher brasileira de 24 anos, pele clara, cabelo loiro liso na altura do peito, estilo leve e natural."),
  base("fernanda", "Fernanda", "f", "Mulher brasileira de 29 anos, cabelo ruivo ondulado, pele clara com sardas, expressão simpática."),
  base("carla", "Carla", "f", "Mulher brasileira de 35 anos, pele morena, cabelo preto liso preso em rabo de cavalo, estilo prático."),
  base("juliana", "Juliana", "f", "Mulher brasileira de 26 anos, pele parda, cabelo castanho escuro com franja, estilo jovem."),
  base("laura", "Laura", "f", "Mulher brasileira de 30 anos, pele clara, cabelo castanho cacheado, óculos de grau, estilo descontraído."),
  base("maria", "Maria", "f", "Mulher brasileira de 42 anos, pele morena, cabelo curto castanho, expressão acolhedora."),
  base("fabio", "Fábio", "m", "Homem brasileiro de 32 anos, pele morena, cabelo curto escuro, barba rala, estilo casual."),
  base("marcos", "Marcos", "m", "Homem brasileiro de 38 anos, pele clara, cabelo castanho curto, estilo esportivo."),
  base("juliano", "Juliano", "m", "Homem brasileiro de 27 anos, pele parda, cabelo preto ondulado, sorriso descontraído."),
  base("miguel", "Miguel", "m", "Homem brasileiro de 45 anos, pele negra, cabelo grisalho curto, barba aparada, expressão confiante."),
];

/** Nomes de arquivo aceitos para a foto do avatar, o recomendado primeiro. */
export function avatarNames(a: Avatar): string[] {
  if (a.file) return [a.file];
  const s = slug(a.name);
  return [s, `${a.gender}-${s}`, a.id];
}

const titleCase = (s: string) => s.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

/** Avatares seus: toda foto "f-nome" ou "m-nome" em public/media/avatars vira um avatar em "Meus Avatares". */
export function discoverAvatars(fileIds: string[]): Avatar[] {
  const taken = new Set(SEED_AVATARS.flatMap(avatarNames).map((n) => n.toLowerCase()));
  return fileIds
    .filter((id) => /^[fm]-.+/.test(id) && !taken.has(id.toLowerCase()))
    .sort()
    .map((id) => ({
      id: `file-${id}`,
      name: titleCase(id.slice(2)),
      gender: id[0] === "m" ? ("m" as const) : ("f" as const),
      description: "",
      mine: true,
      file: id,
    }));
}
