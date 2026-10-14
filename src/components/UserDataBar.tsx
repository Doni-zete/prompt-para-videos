import { useEffect, useState } from "react";
import { CloudUpload, Download } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { canSaveToProject, downloadUserData, keepMine, saveToProject, adoptProjectVersion, useSyncState } from "../lib/userData";

/** Aviso de "salvar no projeto": só aparece quando há prompts, edições ou favoritos que o projeto ainda não tem. */
export function UserDataBar({ showClean = false }: { showClean?: boolean }) {
  const { dirty, conflict } = useSyncState();
  const toast = useToast();
  const [dev, setDev] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void canSaveToProject().then(setDev);
  }, []);

  if (conflict) {
    return (
      <div className="gl-tip ud-bar" role="alert">
        <span>
          <strong>O projeto tem uma versão mais nova dos seus prompts</strong>, mas este navegador também tem alterações que não foram salvas. Qual vale?
        </span>
        <button type="button" className="btn btn-primary btn-sm" onClick={adoptProjectVersion}>Usar a do projeto</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={keepMine}>Manter a deste navegador</button>
      </div>
    );
  }
  if (!dirty) return showClean ? <p className="muted" role="status">Tudo o que você criou já está salvo no projeto.</p> : null;

  const save = async () => {
    setBusy(true);
    try {
      const r = await saveToProject();
      toast(`Salvo no projeto (${r.keys} grupos de dados). Faça o commit de src/data/userData.json para publicar.`, "ok");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="gl-tip ud-bar" role="status">
      <CloudUpload size={16} aria-hidden="true" />
      <span>
        <strong>Seus prompts, edições e favoritos só existem neste navegador.</strong>{" "}
        {dev ? "Salve no projeto para valerem também no site publicado (GitHub Pages, Vercel)." : "Baixe o arquivo, coloque em src/data/userData.json e faça o commit para valerem no site publicado."}
      </span>
      {dev ? (
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void save()}>
          <CloudUpload size={14} /> Salvar no projeto
        </button>
      ) : (
        <button type="button" className="btn btn-primary btn-sm" onClick={downloadUserData}>
          <Download size={14} /> Baixar userData.json
        </button>
      )}
    </div>
  );
}
