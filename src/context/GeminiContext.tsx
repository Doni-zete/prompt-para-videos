import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GeminiError, PREFERRED_MODELS, listModels, userMessage } from "../lib/gemini";
import { clearKey, loadKey, saveKey } from "../lib/keyStore";
import { usePersistentState } from "../hooks/usePersistentState";

type Status = "booting" | "disconnected" | "connected";

interface GeminiContextValue {
  status: Status;
  apiKey: string | null;
  remember: boolean;
  models: string[];
  /** "auto" ou o id de um modelo escolhido pelo usuário. */
  selected: string;
  /** Ordem real de tentativa, com fallback automático. */
  chain: string[];
  notice: string | null;
  skipped: boolean;
  connect: (key: string, remember: boolean) => Promise<void>;
  disconnect: () => void;
  refreshModels: () => Promise<void>;
  setSelected: (model: string) => void;
  skip: () => void;
}

const Ctx = createContext<GeminiContextValue | null>(null);

export function GeminiProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("booting");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [models, setModels] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = usePersistentState<string>("model", "auto");
  const [skipped, setSkipped] = usePersistentState<boolean>("skipped", false);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const stored = loadKey();
    if (!stored) {
      setStatus("disconnected");
      return;
    }
    setApiKey(stored.key);
    setRemember(stored.remember);
    listModels(stored.key)
      .then((list) => {
        setModels(list);
        setStatus("connected");
      })
      .catch((e: unknown) => {
        if (e instanceof GeminiError && e.code === "INVALID_KEY") {
          clearKey();
          setApiKey(null);
          setNotice(userMessage(e));
          setStatus("disconnected");
        } else {
          // Sem internet agora não invalida a chave: segue com a lista padrão.
          setModels([]);
          setNotice("Não consegui atualizar a lista de modelos agora. Usando a lista padrão.");
          setStatus("connected");
        }
      });
  }, []);

  const connect = useCallback(async (key: string, rememberKey: boolean) => {
    const clean = key.trim();
    const list = await listModels(clean); // lança GeminiError se a chave for inválida
    if (!list.length) {
      throw new GeminiError("MODEL_NOT_FOUND", "Esta chave não tem acesso a nenhum modelo de texto do Gemini.");
    }
    saveKey(clean, rememberKey);
    setApiKey(clean);
    setRemember(rememberKey);
    setModels(list);
    setNotice(null);
    setStatus("connected");
  }, []);

  const disconnect = useCallback(() => {
    clearKey();
    setApiKey(null);
    setModels([]);
    setStatus("disconnected");
  }, []);

  const refreshModels = useCallback(async () => {
    if (!apiKey) return;
    const list = await listModels(apiKey);
    setModels(list);
    setNotice(null);
  }, [apiKey]);

  const chain = useMemo(() => {
    const base = models.length ? models : PREFERRED_MODELS;
    if (selected === "auto" || !base.includes(selected)) return base;
    return [selected, ...base.filter((m) => m !== selected)];
  }, [models, selected]);

  const value = useMemo<GeminiContextValue>(
    () => ({
      status,
      apiKey,
      remember,
      models,
      selected,
      chain,
      notice,
      skipped,
      connect,
      disconnect,
      refreshModels,
      setSelected,
      skip: () => setSkipped(true),
    }),
    [status, apiKey, remember, models, selected, chain, notice, skipped, connect, disconnect, refreshModels, setSelected, setSkipped],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGemini(): GeminiContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGemini deve ser usado dentro de <GeminiProvider>");
  return ctx;
}
