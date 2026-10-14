/**
 * Quais dados do navegador entram no arquivo do projeto (src/data/userData.json).
 * Fica de fora de propósito: chave do Gemini, histórico de gerações, conversas do agente, contadores de uso.
 */
const EXACT = new Set(["galeria:edits", "favorites", "trendly:favorites", "trendly:products-v2", "progresso:goals", "progresso:done", "progresso:planilha"]);
const PREFIX = ["custom:", "overrides:"];

export const isSyncedKey = (key: string): boolean => EXACT.has(key) || PREFIX.some((p) => key.startsWith(p));

export interface UserDataFile {
  version: 1;
  /** Marca de quando o arquivo foi salvo pela última vez (vazio = ainda nunca salvo). */
  savedAt: string;
  data: Record<string, unknown>;
}

export const EMPTY_USER_DATA: UserDataFile = { version: 1, savedAt: "", data: {} };

/** Mantém só as chaves permitidas. Devolve null se o conteúdo não for um objeto. */
export function cleanUserData(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return Object.fromEntries(Object.entries(data as Record<string, unknown>).filter(([k]) => isSyncedKey(k)));
}
