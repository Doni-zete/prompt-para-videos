import { useEffect, useState } from "react";
import type { LibraryItem, PromptMode } from "../data/types";
import { useToast } from "../context/ToastContext";
import type { MediaCategory } from "../lib/mediaResolver";
import { ACCEPT, outcomeMessage, uploadMedia, validateFile } from "../lib/mediaUpload";
import { slug } from "../lib/slug";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  categories?: readonly string[];
  defaultCategory?: string;
  /** Quando informado, o diálogo deixa escolher uma imagem ou vídeo para o prompt novo (vai para public/media/<pasta>). */
  mediaCategory?: MediaCategory;
  onSave: (data: Omit<LibraryItem, "id" | "source">) => void;
}

export function NewPromptDialog({ open, onClose, categories, defaultCategory, mediaCategory, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaultCategory ?? categories?.[0] ?? "");
  const [mode, setMode] = useState<"" | PromptMode>("");
  const [prompt, setPrompt] = useState("");
  const [obs, setObs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setTitle("");
      setPrompt("");
      setObs("");
      setMode("");
      setError(null);
      setFile(null);
      setCategory(defaultCategory ?? categories?.[0] ?? "");
    }
  }, [open, categories, defaultCategory]);

  const save = () => {
    if (!title.trim() || !prompt.trim()) {
      setError("Preencha o título e o prompt.");
      return;
    }
    const bad = file ? validateFile(file) : null;
    if (bad) {
      setError(bad);
      return;
    }
    onSave({
      title: title.trim(),
      prompt: prompt.trim(),
      obs: obs.trim(),
      category: categories ? category : undefined,
      mode: mode || undefined,
      cover: { hue: Math.floor(Math.random() * 360), emoji: "✨" },
    });
    if (file && mediaCategory) {
      // o card do prompt novo procura o arquivo pelo título em "slug" (ex.: "Mesa bonita" -> mesa-bonita)
      void uploadMedia(mediaCategory, slug(title.trim()) || "prompt", file)
        .then((r) => toast(outcomeMessage(r), "ok"))
        .catch((e: Error) => toast(`O prompt foi salvo, mas a mídia não: ${e.message}`, "error"));
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo prompt"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={save}>Salvar prompt</button>
        </>
      }
    >
      <div className="stack">
        <div className="field">
          <label htmlFor="np-title">Título</label>
          <input id="np-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {categories && (
          <div className="field">
            <label htmlFor="np-cat">Seção</label>
            <select id="np-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="np-mode">Modo no Flow</label>
          <select id="np-mode" value={mode} onChange={(e) => setMode(e.target.value as "" | PromptMode)}>
            <option value="">Não definir</option>
            <option value="frames">Frames</option>
            <option value="elementos">Elementos</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="np-prompt">Prompt</label>
          <textarea id="np-prompt" rows={7} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        {mediaCategory && (
          <div className="field">
            <label htmlFor="np-media">Imagem ou vídeo (opcional)</label>
            <input id="np-media" type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <small className="muted">O arquivo é colocado na pasta certa quando você salva. Dá para trocar depois pelo lápis do card.</small>
          </div>
        )}
        <div className="field">
          <label htmlFor="np-obs">Observações</label>
          <textarea id="np-obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
