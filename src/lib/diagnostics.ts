import { useSyncExternalStore } from "react";
import { storage } from "./storage";

/**
 * Diagnóstico local: guarda neste navegador os últimos problemas que aconteceram (erro de tela, falha do Gemini,
 * vídeo que não toca, falha ao enviar arquivo). Nada sai do computador, e a chave do Gemini nunca é gravada.
 */
export type DiagKind = "tela" | "gemini" | "video" | "envio";

export interface DiagEvent {
  kind: DiagKind;
  message: string;
  /** Tela onde aconteceu (só o caminho, sem parâmetros). */
  where: string;
  /** Primeira e última vez em que o mesmo problema apareceu. */
  first: number;
  last: number;
  count: number;
}

export const KIND_LABEL: Record<DiagKind, string> = {
  tela: "Erro de tela",
  gemini: "Falha do Gemini",
  video: "Vídeo que não toca",
  envio: "Falha ao enviar arquivo",
};

const KEY = "diag:events";
export const MAX_EVENTS = 100;
const MAX_TEXT = 300;

/** Tira de um texto qualquer coisa que pareça chave ou token, e limita o tamanho. */
export function sanitize(text: string): string {
  return String(text ?? "")
    .replace(/([?&](?:key|api_key|apikey|access_token|token)=)[^&\s"']+/gi, "$1[removido]")
    .replace(/AIza[0-9A-Za-z_-]{16,}/g, "[chave removida]")
    .replace(/((?:x-goog-api-key|authorization)["']?\s*[:=]\s*["']?)(?:Bearer\s+)?[^\s"',;]+/gi, "$1[removido]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{12,}/g, "Bearer [removido]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT);
}

/** Só o caminho da tela atual (#/galeria), nunca os parâmetros do endereço. */
function currentPath(): string {
  try {
    const h = location.hash.replace(/^#/, "").split("?")[0];
    return h || "/";
  } catch {
    return "/";
  }
}

let cache: DiagEvent[] | null = null;
const subs = new Set<() => void>();
const load = (): DiagEvent[] => (cache ??= storage.get<DiagEvent[]>(KEY, []).filter((e) => e && typeof e.message === "string"));
const commit = (list: DiagEvent[]) => {
  cache = list;
  storage.set(KEY, list);
  subs.forEach((f) => f());
};

/** Junta repetições: o mesmo problema na mesma tela vira uma linha com contador. */
export function addEvent(list: DiagEvent[], ev: Omit<DiagEvent, "first" | "last" | "count">, now: number): DiagEvent[] {
  const i = list.findIndex((e) => e.kind === ev.kind && e.message === ev.message && e.where === ev.where);
  if (i >= 0) {
    const cur = list[i];
    return [{ ...cur, last: now, count: cur.count + 1 }, ...list.slice(0, i), ...list.slice(i + 1)];
  }
  return [{ ...ev, first: now, last: now, count: 1 }, ...list].slice(0, MAX_EVENTS);
}

export function logEvent(kind: DiagKind, message: string): void {
  const msg = sanitize(message);
  if (!msg) return;
  commit(addEvent(load(), { kind, message: msg, where: currentPath() }, Date.now()));
}

/** Atalho para as falhas do Gemini: guarda só o código e a mensagem já tratada. */
export function logGemini(err: { code: string; message: string }): void {
  if (err.code === "ABORTED") return;
  logEvent("gemini", `${err.code}: ${err.message}`);
}

export const readEvents = (): DiagEvent[] => load();

export function clearEvents(): void {
  commit([]);
}

export function useDiagEvents(): DiagEvent[] {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => void subs.delete(cb);
    },
    load,
    () => [],
  );
}

let installed = false;
/** Registra os avisos do navegador para erros que ninguém tratou. Chamar uma vez, no início. */
export function installGlobalHandlers(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => {
    // erro de carregamento de imagem/vídeo/script de um elemento chega aqui sem mensagem útil
    if (e.target && e.target !== window) return;
    logEvent("tela", e.message || "Erro desconhecido");
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { message?: string } | string | undefined;
    logEvent("tela", `Promessa rejeitada: ${typeof r === "string" ? r : r?.message ?? "sem detalhes"}`);
  });
}

// ---------- uso do armazenamento do navegador ----------
export interface StorageUsage {
  keys: number;
  bytes: number;
  biggest: { key: string; bytes: number }[];
}

export function storageUsage(): StorageUsage {
  const rows: { key: string; bytes: number }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("ppv:")) continue;
      rows.push({ key: k.slice(4), bytes: (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2 });
    }
  } catch {
    /* modo privado: sem números */
  }
  rows.sort((a, b) => b.bytes - a.bytes);
  return { keys: rows.length, bytes: rows.reduce((s, r) => s + r.bytes, 0), biggest: rows.slice(0, 5) };
}

export const fmtBytes = (n: number): string => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);

// ---------- relatório para copiar ----------
export interface ReportInfo {
  version: string;
  builtAt: string;
  geminiConnected: boolean;
  autoplay: boolean;
  userAgent: string;
  viewport: string;
  usage: StorageUsage;
  events: DiagEvent[];
}

const fmtTime = (t: number) => new Date(t).toLocaleString("pt-BR");

export function buildReport(i: ReportInfo): string {
  const lines = [
    "Relatório de diagnóstico: Prompt para Vídeo",
    `Versão: ${i.version} (build ${i.builtAt})`,
    `Gemini: ${i.geminiConnected ? "conectado" : "desconectado"} (a chave nunca entra no relatório)`,
    `Vídeos tocam sozinhos: ${i.autoplay ? "sim" : "não"}`,
    `Navegador: ${sanitize(i.userAgent)}`,
    `Janela: ${i.viewport}`,
    `Armazenamento do navegador: ${fmtBytes(i.usage.bytes)} em ${i.usage.keys} itens`,
    ...i.usage.biggest.map((b) => `  - ${b.key}: ${fmtBytes(b.bytes)}`),
    "",
    i.events.length ? `Problemas registrados (${i.events.length}):` : "Nenhum problema registrado.",
    ...i.events.map((e) => `- [${KIND_LABEL[e.kind]}] ${e.message} | tela ${e.where} | ${e.count}x | último: ${fmtTime(e.last)}`),
  ];
  return lines.join("\n");
}
