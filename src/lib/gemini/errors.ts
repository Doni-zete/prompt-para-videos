export type GeminiErrorCode =
  | "INVALID_KEY"
  | "QUOTA"
  | "MODEL_NOT_FOUND"
  | "BAD_REQUEST"
  | "BLOCKED"
  | "NETWORK"
  | "TIMEOUT"
  | "BAD_RESPONSE"
  | "ABORTED"
  | "SERVER"
  | "UNKNOWN";

export class GeminiError extends Error {
  constructor(
    public code: GeminiErrorCode,
    message: string,
    public status?: number,
    public retryAfterMs?: number,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

interface ErrorBody {
  error?: {
    message?: string;
    status?: string;
    details?: Array<Record<string, unknown>>;
  };
}

export function parseRetryDelay(body: ErrorBody | undefined): number | undefined {
  const info = body?.error?.details?.find((d) => String(d["@type"] ?? "").includes("RetryInfo"));
  const raw = info?.retryDelay;
  if (typeof raw !== "string") return undefined;
  const seconds = parseFloat(raw);
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : undefined;
}

export function classifyHttp(status: number, body?: ErrorBody): GeminiError {
  const message = body?.error?.message ?? `Erro HTTP ${status}`;
  const reason = body?.error?.details?.find((d) => typeof d.reason === "string")?.reason;

  if (reason === "API_KEY_INVALID" || /API key not valid|API_KEY_INVALID/i.test(message)) {
    return new GeminiError("INVALID_KEY", message, status);
  }
  if (status === 401 || status === 403) return new GeminiError("INVALID_KEY", message, status);
  if (status === 404) return new GeminiError("MODEL_NOT_FOUND", message, status);
  if (status === 429) return new GeminiError("QUOTA", message, status, parseRetryDelay(body));
  if (status === 400) return new GeminiError("BAD_REQUEST", message, status);
  if (status >= 500) return new GeminiError("SERVER", message, status);
  return new GeminiError("UNKNOWN", message, status);
}

export function toGeminiError(e: unknown): GeminiError {
  if (e instanceof GeminiError) return e;
  if (e instanceof DOMException && e.name === "AbortError") return new GeminiError("ABORTED", "Cancelado.");
  if (e instanceof TypeError) {
    return new GeminiError("NETWORK", "Sem conexão com o Google. Verifique sua internet.");
  }
  return new GeminiError("UNKNOWN", e instanceof Error ? e.message : "Erro desconhecido.");
}

/** Mensagem pronta para o usuário final, com o que fazer a seguir. */
export function userMessage(e: GeminiError): string {
  switch (e.code) {
    case "INVALID_KEY":
      return "A chave do Gemini foi recusada. Gere uma nova em aistudio.google.com/api-key e conecte de novo em Configurações.";
    case "QUOTA":
      return "Você atingiu o limite gratuito do Gemini por agora. Aguarde alguns minutos e tente de novo; o limite diário reinicia todo dia.";
    case "MODEL_NOT_FOUND":
      return "Nenhum dos modelos Gemini disponíveis respondeu. Abra Configurações e atualize a lista de modelos.";
    case "BAD_REQUEST":
      return `O Gemini não aceitou o pedido: ${e.message}`;
    case "BLOCKED":
      return "O Gemini bloqueou esta solicitação por segurança. Tente reformular ou usar outra imagem.";
    case "NETWORK":
      return e.message;
    case "TIMEOUT":
      return "O Gemini demorou demais para responder. Tente de novo; se for vídeo, use um arquivo menor.";
    case "BAD_RESPONSE":
      return e.message;
    case "ABORTED":
      return "Geração cancelada.";
    case "SERVER":
      return "Os servidores do Gemini estão instáveis agora. Tente de novo em instantes.";
    default:
      return e.message || "Algo deu errado. Tente novamente.";
  }
}
