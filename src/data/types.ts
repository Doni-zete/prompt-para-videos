import type { VideoSpec } from "../lib/veo/briefing";

export type PromptMode = "frames" | "elementos";

/** Texto extra de um card (ex.: Prompt A e Prompt C dos vídeos), com botão de copiar. */
export interface PromptExtra {
  id: string;
  label: string;
  text: string;
  hint?: string;
  /** Texto do botão de copiar (padrão: "Copiar Prompt <id>"). */
  copyLabel?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  prompt: string;
  obs: string;
  category?: string;
  mode?: PromptMode;
  cover?: { tag?: string; emoji?: string; hue: number };
  /** Texto reconstruído a partir de trechos parciais: o usuário deve conferir. */
  draft?: boolean;
  source: "builtin" | "user";
  /** Vídeos no formato novo: dados que alimentam o gerador com a foto do usuário. */
  spec?: VideoSpec;
  extras?: PromptExtra[];
}
