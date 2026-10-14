import { useEffect, useRef, useState } from "react";
import { ImagePlus, Info, Loader2, Send, Trash2, X } from "lucide-react";
import { ConnectPanel } from "../../components/ConnectPanel";
import { useGemini } from "../../context/GeminiContext";
import { usePersistentState } from "../../hooks/usePersistentState";
import { logGemini } from "../../lib/diagnostics";
import { ACCEPTED_IMAGES, generate, prepareImage, toGeminiError, userMessage, type PreparedImage } from "../../lib/gemini";
import { AGENT_SYSTEM } from "../lib/prompts";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

/** Agente IA: chat simples com o Gemini, com contexto de TikTok Shop. */
export default function AgentPage() {
  const { status, apiKey, chain } = useGemini();
  const [msgs, setMsgs] = usePersistentState<Msg[]>("trendly:agent", []);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => endRef.current?.scrollIntoView?.({ block: "end" }), [msgs.length, busy]);

  if (status !== "connected" || !apiKey) {
    return (
      <section className="tl-narrow-page">
        <h1 className="tl-page-title">Agente IA</h1>
        <div className="tl-panel">
          <h2>Conecte o Gemini para conversar com o agente</h2>
          <ConnectPanel />
        </div>
      </section>
    );
  }

  const send = async () => {
    const text = input.trim();
    if ((!text && !images.length) || busy) return;
    const history = msgs.slice(-10).map((m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.text}`).join("\n");
    const shown = text || "(imagem enviada)";
    setMsgs((prev) => [...prev, { role: "user", text: shown }]);
    setInput("");
    setError(null);
    setBusy(true);
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const res = await generate({
        apiKey,
        models: chain,
        systemInstruction: AGENT_SYSTEM,
        temperature: 0.8,
        signal: ctrl.signal,
        parts: [...images.map((i) => i.part), { text: `${history ? `Conversa até agora:\n${history}\n\n` : ""}Usuário: ${shown}` }],
      });
      setMsgs((prev) => [...prev, { role: "assistant", text: res.text.trim() }]);
    } catch (e) {
      const err = toGeminiError(e);
      logGemini(err);
      if (err.code !== "ABORTED") setError(userMessage(err));
    } finally {
      setBusy(false);
      setImages([]);
    }
  };

  const attach = async (files: File[]) => {
    const added: PreparedImage[] = [];
    for (const f of files.slice(0, 3 - images.length)) {
      try {
        added.push(await prepareImage(f));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não consegui ler a imagem.");
      }
    }
    if (added.length) setImages((prev) => [...prev, ...added]);
  };

  return (
    <section className="tl-narrow-page">
      <header className="tl-gallery-head">
        <div>
          <h1>Agente <em>IA</em></h1>
          <p>Converse com um assistente para criar ganchos, roteiros, legendas e ideias de vídeo para o TikTok Shop.</p>
        </div>
        {msgs.length > 0 && (
          <button type="button" className="tl-ghost-pill" onClick={() => setMsgs([])}>
            <Trash2 size={14} /> Limpar conversa
          </button>
        )}
      </header>
      <p className="tl-note tl-note-info">
        <Info size={15} aria-hidden="true" /> Esta tela não aparece na gravação de referência; é um assistente de chat simples. A conversa fica salva só neste navegador.
      </p>

      <div className="tl-chat" aria-live="polite">
        {msgs.length === 0 && <p className="tl-chat-empty">Pergunte, por exemplo: “me dê 5 ganchos para um vídeo de calça cintura alta”.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`tl-msg ${m.role}`}>
            <span className="tl-msg-who">{m.role === "user" ? "Você" : "Agente IA"}</span>
            <p>{m.text}</p>
          </div>
        ))}
        {busy && (
          <div className="tl-msg assistant" role="status">
            <Loader2 size={16} className="spin accent" /> Pensando…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {images.length > 0 && (
        <div className="tl-chat-thumbs">
          {images.map((img) => (
            <div className="tw-own-thumb" key={img.id}>
              <img src={img.previewUrl} alt={img.name} />
              <button type="button" onClick={() => setImages((p) => p.filter((x) => x.id !== img.id))} aria-label={`Remover ${img.name}`}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="tl-chat-input">
        <button type="button" className="tl-icon-square" onClick={() => fileRef.current?.click()} aria-label="Anexar imagem" disabled={images.length >= 3}>
          <ImagePlus size={16} />
        </button>
        <input ref={fileRef} type="file" accept={ACCEPTED_IMAGES.join(",")} multiple hidden onChange={(e) => { void attach(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        <textarea
          rows={2}
          value={input}
          placeholder="Escreva sua mensagem (Enter envia, Shift+Enter quebra a linha)"
          aria-label="Mensagem para o agente"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button type="button" className="btn btn-primary" onClick={() => void send()} disabled={busy || (!input.trim() && !images.length)}>
          <Send size={15} /> Enviar
        </button>
      </div>
    </section>
  );
}
