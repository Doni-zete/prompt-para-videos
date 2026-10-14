const NS = "ppv:";

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Avisos de escrita (usado para saber se há dados ainda não salvos no projeto). */
export const storageHooks: { onWrite?: (key: string) => void } = {};

/** Wrapper tipado e à prova de falhas sobre o localStorage (modo privado, quota cheia, JSON inválido). */
export const storage = {
  get<T>(key: string, fallback: T): T {
    return safe(() => {
      const raw = localStorage.getItem(NS + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    }, fallback);
  },
  set(key: string, value: unknown): void {
    safe(() => localStorage.setItem(NS + key, JSON.stringify(value)), undefined);
    storageHooks.onWrite?.(key);
  },
  remove(key: string): void {
    safe(() => localStorage.removeItem(NS + key), undefined);
    storageHooks.onWrite?.(key);
  },
  clearAll(): void {
    safe(() => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(NS))
        .forEach((k) => localStorage.removeItem(k));
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(NS))
        .forEach((k) => sessionStorage.removeItem(k));
    }, undefined);
  },
};
