import type { OutputSection, ToolOutput } from "../lib/gemini";

const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");

/** Garante o formato mesmo quando o modelo foge um pouco do schema. */
export function normalizeOutput(raw: unknown): ToolOutput {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rawSections = Array.isArray(obj.sections) ? obj.sections : [];
  const sections: OutputSection[] = rawSections
    .map((s) => {
      const sec = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
      const items = (Array.isArray(sec.items) ? sec.items : [])
        .map((i) => {
          const it = (i && typeof i === "object" ? i : {}) as Record<string, unknown>;
          return { label: str(it.label) || undefined, text: str(it.text), hint: str(it.hint) || undefined };
        })
        .filter((i) => i.text);
      return { title: str(sec.title) || "Resultado", items };
    })
    .filter((s) => s.items.length > 0);
  return { summary: str(obj.summary) || undefined, sections };
}

export function outputToText(output: ToolOutput): string {
  const parts: string[] = [];
  if (output.summary) parts.push(output.summary, "");
  for (const s of output.sections) {
    parts.push(`=== ${s.title} ===`);
    for (const i of s.items) {
      parts.push(i.label ? `[${i.label}]\n${i.text}` : i.text);
      if (i.hint) parts.push(`Dica: ${i.hint}`);
      parts.push("");
    }
  }
  return parts.join("\n").trim();
}
