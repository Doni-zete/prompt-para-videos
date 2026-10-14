import { useSyncExternalStore } from "react";
import seedJson from "../data/userData.json";
import { storage, storageHooks } from "./storage";
import { cleanUserData, isSyncedKey, type UserDataFile } from "./userDataKeys";

/**
 * Seus prompts, edições e favoritos moram no navegador (localStorage), mas podem ser SALVOS NO PROJETO
 * (src/data/userData.json). Aí valem em qualquer lugar onde o site for publicado (GitHub Pages, Vercel...).
 *
 * - Navegador sem nada salvo, ou com tudo igual ao projeto: passa a usar o arquivo do projeto.
 * - Navegador com alterações que o projeto não tem: mantém as suas e avisa para salvar.
 * - Projeto mais novo E alterações locais: pergunta qual versão vale.
 */
const SEED = seedJson as UserDataFile;
const META = "sync:meta";
interface Meta {
  syncedAt: string;
  dirty: boolean;
}
export interface SyncState {
  dirty: boolean;
  conflict: boolean;
}

let state: SyncState = { dirty: false, conflict: false };
let adopting = false;
const subs = new Set<() => void>();
const emit = (next: Partial<SyncState>) => {
  state = { ...state, ...next };
  subs.forEach((f) => f());
};

const metaNow = (): Meta => storage.get<Meta | null>(META, null) ?? { syncedAt: "", dirty: false };

const localKeys = (): string[] => {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith("ppv:") && isSyncedKey(k.slice(4))).map((k) => k.slice(4));
  } catch {
    return [];
  }
};

function adopt(file: UserDataFile): void {
  adopting = true;
  try {
    localKeys().forEach((k) => storage.remove(k));
    Object.entries(cleanUserData(file.data) ?? {}).forEach(([k, v]) => storage.set(k, v));
    storage.set(META, { syncedAt: file.savedAt, dirty: false } satisfies Meta);
  } finally {
    adopting = false;
  }
  emit({ dirty: false, conflict: false });
}

/** Chamar uma vez, antes de desenhar o app. */
export function bootstrapUserData(): void {
  storageHooks.onWrite = (key) => {
    if (adopting || !isSyncedKey(key) || state.dirty) return;
    storage.set(META, { syncedAt: metaNow().syncedAt, dirty: true } satisfies Meta);
    emit({ dirty: true });
  };
  const meta = storage.get<Meta | null>(META, null);
  const hasLocal = localKeys().length > 0;
  const localDirty = meta ? meta.dirty : hasLocal;
  if (!SEED.savedAt || meta?.syncedAt === SEED.savedAt) {
    state = { dirty: localDirty, conflict: false };
    return;
  }
  if (!localDirty) adopt(SEED);
  else state = { dirty: true, conflict: true };
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => void subs.delete(cb);
    },
    () => state,
    () => state,
  );
}

const collect = (): Record<string, unknown> => {
  const data: Record<string, unknown> = {};
  localKeys().forEach((k) => (data[k] = storage.get<unknown>(k, null)));
  return data;
};

const devUrl = (p: string) => new URL(p, document.baseURI).toString();
let devOk: Promise<boolean> | null = null;
/** True quando o site está rodando com `npm run dev` (único modo em que dá para gravar no projeto). */
export const canSaveToProject = () =>
  (devOk ??= fetch(devUrl("__data/ping"), { headers: { "x-media-upload": "1" } })
    .then((r) => r.ok && (r.headers.get("content-type") || "").includes("json"))
    .catch(() => false));

/** Grava os dados em src/data/userData.json (npm run dev). */
export async function saveToProject(): Promise<{ keys: number }> {
  const r = await fetch(devUrl("__data/save"), { method: "POST", headers: { "x-media-upload": "1" }, body: JSON.stringify({ data: collect() }) });
  const j = (await r.json().catch(() => null)) as { ok: boolean; savedAt?: string; keys?: number; error?: string } | null;
  if (!j?.ok || !j.savedAt) throw new Error(j?.error || "Não foi possível salvar no projeto.");
  storage.set(META, { syncedAt: j.savedAt, dirty: false } satisfies Meta);
  emit({ dirty: false, conflict: false });
  return { keys: j.keys ?? 0 };
}

/** Sem npm run dev: baixa o arquivo para você colocar em src/data/userData.json e fazer o commit. */
export function downloadUserData(): void {
  const file: UserDataFile = { version: 1, savedAt: new Date().toISOString(), data: collect() };
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2) + "\n"], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "userData.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  storage.set(META, { syncedAt: file.savedAt, dirty: false } satisfies Meta);
  emit({ dirty: false });
}

/** Troca as alterações deste navegador pelo que está no projeto. */
export function adoptProjectVersion(): void {
  adopt(SEED);
  location.reload();
}

/** Continua com as alterações deste navegador (e deixa o aviso de salvar). */
export function keepMine(): void {
  storage.set(META, { syncedAt: SEED.savedAt, dirty: true } satisfies Meta);
  emit({ dirty: true, conflict: false });
}

export const projectSavedAt = (): string => SEED.savedAt;
