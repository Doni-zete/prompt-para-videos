import { useRef, useState, type ReactNode } from "react";
import { Loader2, Pencil } from "lucide-react";
import { useToast } from "../context/ToastContext";
import type { MediaCategory } from "../lib/mediaResolver";
import { ACCEPT, outcomeMessage, uploadMedia } from "../lib/mediaUpload";

interface Props {
  category: MediaCategory;
  /** Nome do arquivo sem extensão, ou uma função que decide o nome a partir do arquivo escolhido. */
  name: string | ((file: File) => string);
  /** Texto lido por leitores de tela (e dica ao passar o mouse). */
  label: string;
  className?: string;
  /** Sem filhos, vira só o ícone de lápis. */
  children?: ReactNode;
  onUploaded?: () => void;
}

/** Botão que abre a escolha de imagem/vídeo e coloca o arquivo em public/media/<categoria>/<nome>.<ext>. */
export function MediaPicker({ category, name, label, className = "btn btn-ghost", children, onUploaded }: Props) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const send = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await uploadMedia(category, typeof name === "function" ? name(file) : name, file);
      toast(outcomeMessage(r), "ok");
      onUploaded?.();
    } catch (err) {
      toast((err as Error).message || "Não foi possível salvar o arquivo.", "error");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <>
      <input ref={input} type="file" accept={ACCEPT} hidden tabIndex={-1} aria-hidden="true" onChange={(e) => void send(e.target.files?.[0])} />
      <button type="button" className={className} disabled={busy} onClick={() => input.current?.click()} aria-label={children ? undefined : label} title={label}>
        {busy ? <Loader2 size={14} className="spin" /> : children ? null : <Pencil size={14} />}
        {children}
      </button>
    </>
  );
}
