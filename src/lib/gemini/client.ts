import { API_BASE, authHeaders, sleep, withTimeout } from "./http";
import { GeminiError, classifyHttp, toGeminiError } from "./errors";
import { parseModelJson } from "./json";
import { recordRequest } from "../usage";
import type { GenerateOptions, GenerateResult } from "./types";

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 3;
const MAX_INLINE_RETRY_MS = 20_000;

interface GenResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

async function requestOnce(model: string, opts: GenerateOptions): Promise<GenerateResult> {
  const t = withTimeout(opts.signal, REQUEST_TIMEOUT_MS);
  try {
    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: opts.parts }],
      generationConfig: {
        temperature: opts.temperature ?? 0.8,
        ...(opts.schema ? { responseMimeType: "application/json", responseSchema: opts.schema } : {}),
      },
    };
    if (opts.systemInstruction) body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };

    recordRequest();
    const res = await fetch(`${API_BASE}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: authHeaders(opts.apiKey, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      signal: t.signal,
    });
    const json = (await res.json().catch(() => undefined)) as GenResponse | undefined;
    if (!res.ok) throw classifyHttp(res.status, json as never);

    if (json?.promptFeedback?.blockReason) {
      throw new GeminiError("BLOCKED", `Bloqueado: ${json.promptFeedback.blockReason}`);
    }
    const candidate = json?.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
      .filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text)
      .join("");
    if (!text.trim()) {
      if (candidate?.finishReason === "SAFETY" || candidate?.finishReason === "PROHIBITED_CONTENT") {
        throw new GeminiError("BLOCKED", "Resposta bloqueada por segurança.");
      }
      throw new GeminiError("BAD_RESPONSE", "O Gemini devolveu uma resposta vazia. Tente novamente.");
    }
    return { text, model };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError" && t.didTimeout()) {
      throw new GeminiError("TIMEOUT", "Tempo esgotado.");
    }
    throw toGeminiError(e);
  } finally {
    t.cleanup();
  }
}

async function withRetry(model: string, opts: GenerateOptions): Promise<GenerateResult> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await requestOnce(model, opts);
    } catch (e) {
      const err = toGeminiError(e);
      const canRetry = attempt < MAX_ATTEMPTS;
      if (canRetry && err.code === "QUOTA" && err.retryAfterMs !== undefined && err.retryAfterMs <= MAX_INLINE_RETRY_MS) {
        await sleep(err.retryAfterMs + 300, opts.signal);
        continue;
      }
      if (canRetry && err.code === "SERVER") {
        await sleep(800 * 2 ** (attempt - 1), opts.signal);
        continue;
      }
      throw err;
    }
  }
}

/** Gera conteúdo percorrendo a cadeia de modelos até um responder. */
export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  if (!opts.models.length) {
    throw new GeminiError("MODEL_NOT_FOUND", "Nenhum modelo disponível.");
  }
  let last: GeminiError | null = null;
  for (const model of opts.models) {
    opts.onAttempt?.(model);
    try {
      return await withRetry(model, opts);
    } catch (e) {
      const err = toGeminiError(e);
      if (err.code === "INVALID_KEY" || err.code === "BLOCKED" || err.code === "ABORTED") throw err;
      last = err;
    }
  }
  throw last ?? new GeminiError("UNKNOWN", "Falha ao gerar.");
}

export async function generateJson<T>(opts: GenerateOptions): Promise<{ data: T; model: string }> {
  const { text, model } = await generate(opts);
  try {
    return { data: parseModelJson<T>(text), model };
  } catch {
    throw new GeminiError("BAD_RESPONSE", "A resposta do Gemini veio em formato inesperado. Tente gerar de novo.");
  }
}
