export type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { mimeType: string; fileUri: string } };

export interface GenerateOptions {
  apiKey: string;
  /** Cadeia de modelos: tenta o primeiro e cai para o próximo em caso de cota/indisponibilidade. */
  models: string[];
  systemInstruction?: string;
  parts: Part[];
  /** JSON Schema (subconjunto OpenAPI do Gemini). Quando informado, a resposta vem em JSON. */
  schema?: Record<string, unknown>;
  temperature?: number;
  signal?: AbortSignal;
  onAttempt?: (model: string) => void;
}

export interface GenerateResult {
  text: string;
  model: string;
}

export interface OutputItem {
  label?: string;
  text: string;
  hint?: string;
}

export interface OutputSection {
  title: string;
  items: OutputItem[];
}

/** Formato único de saída de todas as ferramentas de IA. */
export interface ToolOutput {
  summary?: string;
  sections: OutputSection[];
}
