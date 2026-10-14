import { COMMANDS, type Mode } from "../data/commands";
import { PRESETS } from "../data/presets";

export interface ComposeInput {
  mode: Mode;
  /** Prompt original do usuário (opcional): entra no início. */
  base: string;
  presetIds: string[];
  commandIds: string[];
}

const withEnd = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);

/**
 * Monta o "prompt otimizado": o texto do usuário, depois a cena dos presets (na ordem escolhida)
 * e por fim os comandos (na ordem das categorias). Itens de outro modo e repetidos são ignorados.
 */
export function composePrompt({ mode, base, presetIds, commandIds }: ComposeInput): string {
  const parts: string[] = [];
  const b = base.trim();
  if (b) parts.push(withEnd(b));
  for (const id of presetIds) {
    const p = PRESETS.find((x) => x.id === id);
    if (p && p.kind === mode) parts.push(withEnd(p.prompt.trim()));
  }
  for (const c of COMMANDS) {
    if (commandIds.includes(c.id) && c.modes.includes(mode)) parts.push(withEnd(c.text.trim()));
  }
  return Array.from(new Set(parts)).join(" ");
}

export interface HumanoState {
  mode: Mode;
  presetIds: string[];
  commandIds: string[];
  base: string;
  /** Texto editado à mão; quando existe, substitui o prompt montado. */
  custom: string | null;
}

export const INITIAL_STATE: HumanoState = { mode: "video", presetIds: [], commandIds: [], base: "", custom: null };

/** Garante um estado válido a partir do que estava salvo (ids que não existem mais, modo inválido…). */
export function sanitizeState(raw: unknown): HumanoState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<HumanoState>;
  const mode: Mode = r.mode === "image" ? "image" : "video";
  const presetIds = (Array.isArray(r.presetIds) ? r.presetIds : []).filter((id): id is string => typeof id === "string" && PRESETS.some((p) => p.id === id && p.kind === mode));
  const commandIds = (Array.isArray(r.commandIds) ? r.commandIds : []).filter((id): id is string => typeof id === "string" && COMMANDS.some((c) => c.id === id && c.modes.includes(mode)));
  return { mode, presetIds, commandIds, base: typeof r.base === "string" ? r.base.slice(0, 2000) : "", custom: typeof r.custom === "string" ? r.custom.slice(0, 8000) : null };
}

export const compareNames = (mode: Mode, activePresetId: string | undefined, side: "original" | "realista"): string[] =>
  [activePresetId ? `${activePresetId}-${side}` : "", `padrao-${mode === "image" ? "imagem" : "video"}-${side}`, `padrao-${side}`].filter(Boolean);
