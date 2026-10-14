import { useState, type FormEvent } from "react";
import { ClipboardPaste, ExternalLink, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toGeminiError, userMessage } from "../lib/gemini";
import { logGemini } from "../lib/diagnostics";
import { looksLikeApiKey } from "../lib/keyStore";
import { useGemini } from "../context/GeminiContext";

export const AI_STUDIO_URL = "https://aistudio.google.com/api-key";

interface Props {
  onConnected?: () => void;
}

export function ConnectPanel({ onConnected }: Props) {
  const { connect, notice } = useGemini();
  const [key, setKey] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (value = key) => {
    const clean = value.trim();
    if (!clean) {
      setError("Cole sua chave do Gemini para continuar.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await connect(clean, remember);
      onConnected?.();
    } catch (e) {
      const err = toGeminiError(e);
      logGemini(err);
      setError(userMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  const pasteFromClipboard = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      setKey(text);
      if (looksLikeApiKey(text)) void submit(text);
      else setError("O que está na área de transferência não parece uma chave do Gemini (começa com AIza).");
    } catch {
      setError("Seu navegador não permitiu ler a área de transferência. Cole a chave no campo com Ctrl+V.");
    }
  };

  return (
    <form className="connect" onSubmit={onSubmit} noValidate>
      <ol className="connect-steps">
        <li>
          <span className="step-n" aria-hidden="true">1</span>
          <div>
            <strong>Abra o Google AI Studio</strong>
            <p>Entre com sua conta Google. É grátis e não pede cartão.</p>
            <a className="btn btn-ghost" href={AI_STUDIO_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} /> Abrir aistudio.google.com/api-key
            </a>
          </div>
        </li>
        <li>
          <span className="step-n" aria-hidden="true">2</span>
          <div>
            <strong>Crie e copie a chave</strong>
            <p>Clique em “Criar chave de API” (Create API key) e copie o código que começa com AIza.</p>
          </div>
        </li>
        <li>
          <span className="step-n" aria-hidden="true">3</span>
          <div className="grow">
            <strong>Cole aqui</strong>
            <div className="key-row">
              <div className="input-wrap">
                <KeyRound size={16} aria-hidden="true" />
                <input
                  type={show ? "text" : "password"}
                  value={key}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="AIza…"
                  aria-label="Chave da API do Gemini"
                  onChange={(e) => {
                    setKey(e.target.value);
                    setError(null);
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text").trim();
                    if (looksLikeApiKey(text)) {
                      e.preventDefault();
                      setKey(text);
                      void submit(text);
                    }
                  }}
                />
                <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar chave" : "Mostrar chave"}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="button" className="btn btn-ghost" onClick={pasteFromClipboard}>
                <ClipboardPaste size={14} /> Colar
              </button>
            </div>
          </div>
        </li>
      </ol>

      <label className="check">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <span>Lembrar neste dispositivo (desmarque em computador compartilhado)</span>
      </label>

      {(error || notice) && (
        <p className="alert alert-error" role="alert">
          {error ?? notice}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
        {busy ? <Loader2 size={16} className="spin" /> : null}
        {busy ? "Verificando chave…" : "Conectar Gemini"}
      </button>

      <p className="fineprint">
        A Google não permite que um site pegue sua chave sozinho, por isso você cola uma vez. Ela fica só no seu navegador e é enviada
        apenas ao Google, nunca a um servidor nosso.
      </p>
    </form>
  );
}
