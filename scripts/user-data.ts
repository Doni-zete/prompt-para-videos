import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { cleanUserData, type UserDataFile } from "../src/lib/userDataKeys";

export const MAX_USER_DATA_BYTES = 5 * 1024 * 1024;

export type SaveResult = { ok: true; savedAt: string; keys: number } | { ok: false; error: string };

/** Grava os dados do usuário em src/data/userData.json (só as chaves permitidas). */
export function saveUserData(file: string, body: string, now = new Date()): SaveResult {
  if (Buffer.byteLength(body) > MAX_USER_DATA_BYTES) return { ok: false, error: "Os dados passam de 5 MB." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false, error: "JSON inválido." };
  }
  const data = cleanUserData((parsed as { data?: unknown } | null)?.data);
  if (!data) return { ok: false, error: "Formato inválido." };
  const out: UserDataFile = { version: 1, savedAt: now.toISOString(), data };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  return { ok: true, savedAt: out.savedAt, keys: Object.keys(data).length };
}
