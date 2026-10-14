/** Extrai e faz o parse de JSON vindo de um LLM, tolerando cercas de markdown e vírgulas sobrando. */
export function parseModelJson<T>(raw: string): T {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  const start = text.search(/[{[]/);
  if (start === -1) throw new Error("Nenhum JSON encontrado na resposta.");
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  const end = text.lastIndexOf(close);
  if (end <= start) throw new Error("JSON incompleto na resposta.");
  text = text.slice(start, end + 1);

  try {
    return JSON.parse(text) as T;
  } catch {
    const repaired = text.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(repaired) as T;
  }
}
