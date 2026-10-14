import { useCallback, useEffect, useRef, useState } from "react";
import { GeminiError, generateJson, toGeminiError, userMessage, type Part, type ToolOutput } from "../lib/gemini";
import { useGemini } from "../context/GeminiContext";
import { logGemini } from "../lib/diagnostics";
import { OUTPUT_SCHEMA } from "../tools/schema";
import { normalizeOutput } from "../tools/normalize";

export interface GenerateState {
  status: "idle" | "running" | "done" | "error";
  message: string;
  progress?: number;
  error?: string;
  output?: ToolOutput;
  model?: string;
}

export interface BuildContext {
  apiKey: string;
  signal: AbortSignal;
  setStatus: (message: string, progress?: number) => void;
}

export interface RunConfig {
  system: string;
  temperature?: number;
  /** Monta as partes do pedido. `cleanup` roda sempre ao final (ex.: apagar vídeo enviado). */
  build: (ctx: BuildContext) => Promise<{ parts: Part[]; cleanup?: () => Promise<void> }>;
}

const IDLE: GenerateState = { status: "idle", message: "" };

export function useGenerate(onDone?: (output: ToolOutput, model: string) => void) {
  const { apiKey, chain } = useGemini();
  const [state, setState] = useState<GenerateState>(IDLE);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(
    async (cfg: RunConfig) => {
      if (!apiKey) {
        setState({ status: "error", message: "", error: "Conecte sua chave do Gemini para gerar." });
        return;
      }
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setState({ status: "running", message: "Preparando…" });
      let cleanup: (() => Promise<void>) | undefined;
      try {
        const built = await cfg.build({
          apiKey,
          signal: ctrl.signal,
          setStatus: (message, progress) => setState({ status: "running", message, progress }),
        });
        cleanup = built.cleanup;
        setState({ status: "running", message: "Gerando com o Gemini…" });
        const { data, model } = await generateJson<unknown>({
          apiKey,
          models: chain,
          systemInstruction: cfg.system,
          parts: built.parts,
          schema: OUTPUT_SCHEMA as unknown as Record<string, unknown>,
          temperature: cfg.temperature,
          signal: ctrl.signal,
          onAttempt: (m) => setState((s) => (s.status === "running" ? { ...s, message: `Gerando com ${m}…` } : s)),
        });
        const output = normalizeOutput(data);
        if (!output.sections.length) {
          throw new GeminiError("BAD_RESPONSE", "O Gemini não devolveu conteúdo utilizável. Tente gerar de novo.");
        }
        setState({ status: "done", message: "", output, model });
        onDone?.(output, model);
      } catch (e) {
        const err = toGeminiError(e);
        if (err.code === "ABORTED") setState(IDLE);
        else {
          logGemini(err);
          setState({ status: "error", message: "", error: userMessage(err) });
        }
      } finally {
        await cleanup?.();
      }
    },
    [apiKey, chain, onDone],
  );

  const cancel = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => setState(IDLE), []);
  const show = useCallback((output: ToolOutput, model?: string) => setState({ status: "done", message: "", output, model }), []);

  return { state, run, cancel, reset, show };
}
