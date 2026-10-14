import { Brain, ExternalLink } from "lucide-react";
import { CopyButton } from "../../components/CopyButton";
import { Modal } from "../../components/Modal";
import { copyText } from "../../lib/clipboard";
import { useToast } from "../../context/ToastContext";

interface Props {
  open: boolean;
  onClose: () => void;
  prompt: string;
}

const SITES = [
  { label: "Abrir ChatGPT", url: "https://chatgpt.com/" },
  { label: "Abrir Gemini", url: "https://gemini.google.com/app" },
];

/** "Criar meu roteiro com IA": o usuário copia o prompt e cola na IA favorita. */
export function ScriptModal({ open, onClose, prompt }: Props) {
  const toast = useToast();
  const openSite = async (url: string) => {
    const ok = await copyText(prompt);
    toast(ok ? "Prompt copiado! Cole na IA que abriu." : "Abra o site e cole o prompt manualmente.", ok ? "ok" : "error");
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <Modal open={open} onClose={onClose} title="Criar meu roteiro com IA">
      <div className="tw-stack">
        <p className="tw-hint">
          <Brain size={13} aria-hidden="true" /> Copie o prompt e cole na sua IA favorita.
        </p>
        <p className="tw-tip">
          <strong>Dica:</strong> apenas copie o texto abaixo e cole no ChatGPT ou Gemini. Eles farão o resto do trabalho.
        </p>
        <textarea className="tw-mono" readOnly rows={9} value={prompt} aria-label="Prompt para criar o roteiro" onFocus={(e) => e.currentTarget.select()} />
        <div className="tw-modal-actions">
          <CopyButton text={prompt} label="Copiar prompt" variant="ghost" />
          {SITES.map((s) => (
            <button key={s.url} type="button" className="tw-white-btn" onClick={() => void openSite(s.url)}>
              <ExternalLink size={14} aria-hidden="true" /> {s.label}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
