import { API_BASE, authHeaders } from "./http";
import { classifyHttp, toGeminiError } from "./errors";

/** Ordem de preferência para uso gratuito: rápidos e baratos primeiro. A lista real vem da API. */
export const PREFERRED_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

const EXCLUDE =
  /(image|tts|live|embedding|aqa|robotics|computer-use|audio|imagen|veo|lyria|gemma|learnlm|deep-research|antigravity|native)/i;

interface RawModel {
  name: string;
  supportedGenerationMethods?: string[];
}

function family(id: string): number {
  if (/flash-lite/.test(id)) return 1;
  if (/flash/.test(id)) return 0;
  if (/pro/.test(id)) return 2;
  return 3;
}

function version(id: string): number {
  const m = id.match(/gemini-(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

export function rankModels(raw: RawModel[]): string[] {
  const ids = Array.from(
    new Set(
      raw
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => m.name.replace(/^models\//, ""))
        .filter((id) => id.startsWith("gemini") && !EXCLUDE.test(id)),
    ),
  );

  return ids.sort((a, b) => {
    const ia = PREFERRED_MODELS.indexOf(a);
    const ib = PREFERRED_MODELS.indexOf(b);
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    const alias = Number(/latest/.test(a)) - Number(/latest/.test(b));
    if (alias) return alias;
    return family(a) - family(b) || version(b) - version(a) || a.localeCompare(b);
  });
}

/** Lista os modelos acessíveis pela chave. Serve também como validação da chave. */
export async function listModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
  const all: RawModel[] = [];
  let pageToken = "";
  try {
    for (let page = 0; page < 5; page++) {
      const url = `${API_BASE}/v1beta/models?pageSize=200${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const res = await fetch(url, { headers: authHeaders(apiKey), signal });
      const body = await res.json().catch(() => undefined);
      if (!res.ok) throw classifyHttp(res.status, body);
      all.push(...((body?.models as RawModel[]) ?? []));
      pageToken = body?.nextPageToken ?? "";
      if (!pageToken) break;
    }
  } catch (e) {
    throw toGeminiError(e);
  }
  return rankModels(all);
}
