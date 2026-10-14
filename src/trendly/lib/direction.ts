import type { OutputItem, ToolOutput } from "../../lib/gemini";

/** Itens (um por take) da seção de direção devolvida pelo Gemini. */
export function takeItems(output: ToolOutput | undefined): OutputItem[] {
  if (!output) return [];
  const section =
    output.sections.find((s) => /roteiro de dire/i.test(s.title)) ??
    output.sections.find((s) => /veo|take/i.test(s.title)) ??
    output.sections.find((s) => !/resumo/i.test(s.title)) ??
    output.sections[0];
  return section?.items ?? [];
}

export function findItem(output: ToolOutput | undefined, titleRe: RegExp): OutputItem | undefined {
  return output?.sections.find((s) => titleRe.test(s.title))?.items[0];
}
