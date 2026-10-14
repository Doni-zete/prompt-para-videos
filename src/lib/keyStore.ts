const KEY = "ppv:gemini-key";

export interface StoredKey {
  key: string;
  remember: boolean;
}

/** A chave nunca sai do navegador, exceto nas chamadas diretas para generativelanguage.googleapis.com. */
export function loadKey(): StoredKey | null {
  try {
    const persisted = localStorage.getItem(KEY);
    if (persisted) return { key: persisted, remember: true };
    const session = sessionStorage.getItem(KEY);
    if (session) return { key: session, remember: false };
  } catch {
    /* storage indisponível */
  }
  return null;
}

export function saveKey(key: string, remember: boolean): void {
  try {
    clearKey();
    (remember ? localStorage : sessionStorage).setItem(KEY, key);
  } catch {
    /* storage indisponível: a chave vive só em memória nesta sessão */
  }
}

export function clearKey(): void {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}

const KEY_PATTERN = /^AIza[0-9A-Za-z_-]{30,50}$/;

export function looksLikeApiKey(value: string): boolean {
  return KEY_PATTERN.test(value.trim());
}

export function maskKey(key: string): string {
  if (key.length < 10) return "••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}
