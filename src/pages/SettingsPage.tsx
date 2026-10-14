import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ConnectPanel, AI_STUDIO_URL } from "../components/ConnectPanel";
import { DiagnosticsPanel } from "../components/DiagnosticsPanel";
import { UserDataBar } from "../components/UserDataBar";
import { Modal } from "../components/Modal";
import { useGemini } from "../context/GeminiContext";
import { useToast } from "../context/ToastContext";
import { usePersistentState } from "../hooks/usePersistentState";
import { toGeminiError, userMessage } from "../lib/gemini";
import { maskKey } from "../lib/keyStore";
import { logGemini } from "../lib/diagnostics";
import { storage } from "../lib/storage";
import { useAutoplay } from "../lib/videoMotion";

export default function SettingsPage() {
  const gem = useGemini();
  const toast = useToast();
  const [name, setName] = usePersistentState<string>("name", "Criador");
  const [changing, setChanging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [autoplay, setAutoplay] = useAutoplay();
  const connected = gem.status === "connected" && !!gem.apiKey;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await gem.refreshModels();
      toast("Lista de modelos atualizada.");
    } catch (e) {
      const err = toGeminiError(e);
      logGemini(err);
      toast(userMessage(err), "error");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="page narrow">
      <PageHeader title="Configurações" subtitle="Perfil, conexão com o Gemini e dados salvos" />

      <div className="settings-grid">
      <section className="panel stack">
        <h2 className="panel-title">Perfil</h2>
        <div className="field">
          <label htmlFor="name">Seu nome</label>
          <input id="name" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
        </div>
      </section>

      <section className="panel stack">
        <h2 className="panel-title">Gemini (Google AI Studio)</h2>
        {connected && !changing ? (
          <>
            <p className="status-ok"><CheckCircle2 size={16} aria-hidden="true" /> Conectado · chave <code>{maskKey(gem.apiKey!)}</code> · {gem.remember ? "salva neste dispositivo" : "só nesta sessão"}</p>
            {gem.notice && <p className="alert alert-warn">{gem.notice}</p>}

            <div className="field">
              <label htmlFor="model">Modelo</label>
              <select id="model" value={gem.selected} onChange={(e) => gem.setSelected(e.target.value)}>
                <option value="auto">Automático (recomendado): escolhe o melhor e troca se faltar cota</option>
                {gem.models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <p className="field-help">
                {gem.models.length ? `${gem.models.length} modelos disponíveis na sua chave.` : "Usando a lista padrão."} Ordem de tentativa: {gem.chain.slice(0, 3).join(" → ")}{gem.chain.length > 3 ? " …" : ""}
              </p>
            </div>

            <div className="row">
              <button type="button" className="btn btn-ghost" onClick={refresh} disabled={refreshing}>
                {refreshing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} Atualizar modelos
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setChanging(true)}>Trocar chave</button>
              <button type="button" className="btn btn-quiet danger" onClick={gem.disconnect}>Remover chave</button>
              <a className="btn btn-quiet" href="https://aistudio.google.com/usage" target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Ver cota no Google</a>
            </div>
          </>
        ) : (
          <>
            <p className="muted">Gere sua chave em <a href={AI_STUDIO_URL} target="_blank" rel="noopener noreferrer">aistudio.google.com/api-key</a> e cole abaixo.</p>
            <ConnectPanel onConnected={() => { setChanging(false); toast("Gemini conectado!"); }} />
            {changing && <button type="button" className="btn btn-quiet" onClick={() => setChanging(false)}>Cancelar</button>}
          </>
        )}
      </section>

      <section className="panel stack">
        <h2 className="panel-title">Seus dados no projeto</h2>
        <p className="muted">Prompts criados, edições e favoritos podem ser salvos no projeto (<code>src/data/userData.json</code>) para valerem no GitHub Pages e na Vercel. A chave do Gemini e o histórico de gerações nunca entram nesse arquivo.</p>
        <UserDataBar showClean />
      </section>

      <section className="panel stack">
        <h2 className="panel-title">Vídeos</h2>
        <label className="tl-check-row">
          <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
          <span>Vídeos de prévia tocam sozinhos (mudos e em loop), como um GIF. Desligue se o movimento incomoda ou pesa no seu computador.</span>
        </label>
      </section>

      <DiagnosticsPanel />

      <section className="panel stack">
        <h2 className="panel-title">Dados deste navegador</h2>
        <p className="muted">Histórico de gerações, favoritos, edições de prompts e seus prompts cadastrados ficam salvos só aqui. Nada é enviado para servidores.</p>
        <div className="row">
          <button type="button" className="btn btn-quiet danger" onClick={() => setConfirmClear(true)}><Trash2 size={14} /> Apagar todos os dados</button>
        </div>
      </section>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Apagar todos os dados?"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmClear(false)}>Cancelar</button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                gem.disconnect();
                storage.clearAll();
                window.location.reload();
              }}
            >
              Apagar tudo
            </button>
          </>
        }
      >
        <p>Isso remove sua chave, histórico, favoritos, edições e prompts cadastrados deste navegador. Não dá para desfazer.</p>
      </Modal>
      </div>
    </div>
  );
}
