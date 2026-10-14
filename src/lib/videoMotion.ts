import { useSyncExternalStore } from "react";
import { storage } from "./storage";

const KEY = "videos:autoplay";
let on = storage.get<boolean>(KEY, true);
const subs = new Set<() => void>();

/** Preferência do app: os vídeos de prévia tocam sozinhos (mudos, em loop). Ligada por padrão. */
export function setAutoplay(value: boolean): void {
  on = value;
  storage.set(KEY, value);
  subs.forEach((f) => f());
}

export function useAutoplay() {
  const value = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => void subs.delete(cb);
    },
    () => on,
    () => true,
  );
  return [value, setAutoplay] as const;
}

/**
 * Toca um vídeo mudo. O "muted" do React nem sempre chega ao elemento antes do navegador decidir se pode
 * tocar sozinho, e vídeo com áudio sem estar mudo é bloqueado. Por isso o mudo é forçado aqui.
 * Devolve false quando o navegador recusou (aí o usuário toca no play).
 */
export function playMuted(v: HTMLVideoElement): Promise<boolean> {
  v.muted = true;
  v.defaultMuted = true;
  v.setAttribute("muted", "");
  return v.play().then(
    () => true,
    () => false,
  );
}
