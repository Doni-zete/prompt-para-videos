import { useSyncExternalStore } from "react";
import { storage } from "./storage";

/** "Continue de onde parou": as últimas telas e prompts abertos, só neste navegador. */
export interface RecentItem {
  kind: "tool" | "prompt";
  id: string;
  title: string;
  /** Endereço interno (sem o #). */
  to: string;
  t: number;
}

const KEY = "recent:items";
export const MAX_RECENT = 6;

/** Põe o item no topo, sem repetir (mesmo tipo e id), e corta no máximo. */
export function pushRecent(list: RecentItem[], item: RecentItem, max = MAX_RECENT): RecentItem[] {
  return [item, ...list.filter((r) => !(r.kind === item.kind && r.id === item.id))].slice(0, max);
}

let cache: RecentItem[] | null = null;
const subs = new Set<() => void>();
const load = (): RecentItem[] =>
  (cache ??= storage.get<RecentItem[]>(KEY, []).filter((r) => r && typeof r.title === "string" && typeof r.to === "string" && (r.kind === "tool" || r.kind === "prompt")));

export function recordRecent(item: Omit<RecentItem, "t">): void {
  const list = load();
  // já está no topo com o mesmo título: não regrava a cada renderização
  if (list[0]?.kind === item.kind && list[0].id === item.id && list[0].title === item.title) return;
  cache = pushRecent(list, { ...item, t: Date.now() });
  storage.set(KEY, cache);
  subs.forEach((f) => f());
}

export function clearRecent(): void {
  cache = [];
  storage.set(KEY, cache);
  subs.forEach((f) => f());
}

export function useRecent(): RecentItem[] {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => void subs.delete(cb);
    },
    load,
    () => [],
  );
}

/** Telas de ferramenta que entram no "Continue de onde parou" (as demais, como Configurações, não). */
export const isTrackedTool = (pathname: string): boolean => /^\/(ferramenta\/|trendly|humano|manequins)/.test(pathname);
