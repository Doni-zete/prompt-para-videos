import { useState } from "react";
import { Activity, Copy, RefreshCw, Trash2 } from "lucide-react";
import { useGemini } from "../context/GeminiContext";
import { useToast } from "../context/ToastContext";
import { copyText } from "../lib/clipboard";
import { KIND_LABEL, buildReport, clearEvents, fmtBytes, storageUsage, useDiagEvents } from "../lib/diagnostics";
import { useAutoplay } from "../lib/videoMotion";

interface Published {
  state: "idle" | "loading" | "ok" | "none" | "error";
  version?: string;
  builtAt?: string;
}

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("pt-BR") : "");

/** Seção "Diagnóstico" das Configurações: tudo local, nada é enviado para fora e a chave do Gemini nunca é gravada. */
export function DiagnosticsPanel() {
  const events = useDiagEvents();
  const gem = useGemini();
  const toast = useToast();
  const [autoplay] = useAutoplay();
  const [published, setPublished] = useState<Published>({ state: "idle" });
  const [usage, setUsage] = useState(() => storageUsage());
  const connected = gem.status === "connected" && !!gem.apiKey;

  const check = async () => {
    setPublished({ state: "loading" });
    setUsage(storageUsage());
    try {
      const r = await fetch(new URL(`health.json?t=${Date.now()}`, document.baseURI).toString(), { cache: "no-store" });
      const ct = r.headers.get("content-type") || "";
      if (!r.ok || !ct.includes("json")) return setPublished({ state: "none" });
      const j = (await r.json()) as { version?: string; builtAt?: string };
      setPublished({ state: "ok", version: j.version, builtAt: j.builtAt });
    } catch {
      setPublished({ state: "error" });
    }
  };

  const copy = async () => {
    const text = buildReport({
      version: __APP_VERSION__,
      builtAt: __BUILD_TIME__,
      geminiConnected: connected,
      autoplay,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      usage: storageUsage(),
      events,
    });
    toast((await copyText(text)) ? "Relatório copiado." : "Não consegui copiar. Selecione e copie à mão.", "ok");
  };

  const newer = published.state === "ok" && published.builtAt && published.builtAt !== __BUILD_TIME__;

  return (
    <section className="panel stack" aria-labelledby="diag-title" id="diagnostico">
      <h2 className="panel-title" id="diag-title"><Activity size={16} aria-hidden="true" /> Diagnóstico</h2>
      <p className="muted">Mostra o que deu errado neste navegador. Fica só aqui: nada é enviado para fora e a chave do Gemini nunca é gravada.</p>

      <dl className="diag-info">
        <div><dt>Versão em uso</dt><dd>{__APP_VERSION__} <span className="muted">(build {fmt(__BUILD_TIME__)})</span></dd></div>
        <div><dt>Gemini</dt><dd>{connected ? "conectado" : "desconectado"}</dd></div>
        <div><dt>Armazenamento deste navegador</dt><dd>{fmtBytes(usage.bytes)} em {usage.keys} itens</dd></div>
      </dl>

      <div className="row">
        <button type="button" className="btn btn-ghost" onClick={() => void check()} disabled={published.state === "loading"}>
          <RefreshCw size={14} className={published.state === "loading" ? "spin" : ""} /> Verificar versão publicada
        </button>
        <span className="muted" role="status" aria-live="polite">
          {published.state === "ok" && (newer ? `Publicada: ${published.version} (${fmt(published.builtAt)}). É diferente da que você está usando: recarregue com Ctrl+F5.` : `Publicada: ${published.version} (${fmt(published.builtAt)}). É a mesma que você está usando.`)}
          {published.state === "none" && "Este endereço não tem o arquivo de versão (ele só existe no site publicado, depois do build)."}
          {published.state === "error" && "Não consegui consultar agora. Verifique a internet."}
        </span>
      </div>

      <h3 className="diag-sub">Problemas registrados ({events.length})</h3>
      {events.length === 0 ? (
        <p className="muted" data-testid="diag-empty">Nenhum problema registrado. Quando algo falhar (tela, Gemini, vídeo ou envio de arquivo), aparece aqui.</p>
      ) : (
        <ul className="diag-list" data-testid="diag-list">
          {events.map((e) => (
            <li key={`${e.kind}|${e.where}|${e.message}`}>
              <span className={`diag-kind k-${e.kind}`}>{KIND_LABEL[e.kind]}</span>
              <p>{e.message}</p>
              <small className="muted">Tela {e.where} · {e.count}x · último em {new Date(e.last).toLocaleString("pt-BR")}</small>
            </li>
          ))}
        </ul>
      )}

      <div className="row">
        <button type="button" className="btn btn-ghost" onClick={() => void copy()}><Copy size={14} /> Copiar relatório</button>
        <button type="button" className="btn btn-quiet danger" onClick={() => { clearEvents(); toast("Lista de problemas limpa.", "ok"); }} disabled={events.length === 0}>
          <Trash2 size={14} /> Limpar lista
        </button>
      </div>
    </section>
  );
}
