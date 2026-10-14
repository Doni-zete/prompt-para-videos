export const TAKE_SECONDS = 8;
export const MIN_WORDS = 20;
export const MAX_WORDS = 25;

export const countWords = (text: string): number => (text.trim() ? text.trim().split(/\s+/).length : 0);

export type WordState = "empty" | "short" | "ok" | "long";

export function wordState(n: number): WordState {
  if (n === 0) return "empty";
  if (n < MIN_WORDS) return "short";
  if (n > MAX_WORDS) return "long";
  return "ok";
}

export const normalizeTakes = (takes: string[], count: number): string[] => Array.from({ length: count }, (_, i) => takes[i] ?? "");
