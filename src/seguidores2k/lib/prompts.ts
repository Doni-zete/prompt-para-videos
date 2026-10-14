import { BASE_OBRIGATORIA, CENAS, type Cena, type Perfil } from "../data/kit";

export const FRASE_CHAVE = "smartphone photo, natural Brazilian environment, real skin texture, no cinematic lighting, no studio photoshoot, no AI-perfect skin.";

/** Profissões sugeridas para trocar o [PROFESSION] das cenas (a fala é em português). */
export const PROFISSOES = ["policial", "fazendeira", "enfermeira", "atendente de supermercado", "advogada", "engenheira", "personal trainer", "gótica", "dona de casa", "faxineira", "professora", "aeromoça", "gamer"];

export interface Caracteristicas { hair: string; skin: string; other: string }
export const VAZIO: Caracteristicas = { hair: "", skin: "", other: "" };

const limpo = (s: string) => s.trim().replace(/\s+/g, " ");

/** Prompt do perfil com os campos preenchidos (campo vazio não entra) e, se pedido, a frase-chave no fim. */
export function montarPerfil(p: Perfil, c: Caracteristicas, repetirFrase: boolean): string {
  const linhas = [p.text];
  const campos: [string, string][] = [["Hair", c.hair], ["Skin", c.skin], ["Other characteristic", c.other]];
  for (const [nome, v] of campos) if (limpo(v)) linhas.push(`${nome}: ${limpo(v)}`);
  if (repetirFrase) linhas.push(FRASE_CHAVE);
  return linhas.join("\n");
}

/** Texto da cena com o [PROFESSION] trocado (se a pessoa escreveu a profissão). */
export function textoCena(c: Cena, profissao: string): string {
  const p = limpo(profissao);
  return p ? c.text.split("[PROFESSION]").join(p) : c.text;
}

export const temProfissao = (c: Cena): boolean => c.text.includes("[PROFESSION]");

/** Base obrigatória + cena, como o kit pede. */
export function montarVideo(c: Cena, profissao: string): string {
  return `${BASE_OBRIGATORIA}\n\n${textoCena(c, profissao)}`;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function filtrarCenas(q: string): Cena[] {
  const n = norm(q.trim());
  if (!n) return CENAS;
  return CENAS.filter((c) => norm(`${c.id} ${c.title} ${c.text}`).includes(n) || (/^\d+$/.test(n) && Number(n) === Number(c.id)));
}
