import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { prepareImage, type PreparedImage } from "../lib/gemini";
import { useToast } from "../context/ToastContext";

interface Props {
  items: PreparedImage[];
  onChange: (items: PreparedImage[]) => void;
  max: number;
  hint: string;
}

export function ImageDropzone({ items, onChange, max, hint }: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.previewUrl)), []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const room = max - itemsRef.current.length;
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (!images.length) {
        if (files.length) toast("Envie arquivos de imagem (JPG, PNG ou WEBP).", "error");
        return;
      }
      if (images.length > room) toast(`Limite de ${max} imagens. Algumas foram ignoradas.`, "error");
      setBusy(true);
      const added: PreparedImage[] = [];
      for (const file of images.slice(0, Math.max(room, 0))) {
        try {
          added.push(await prepareImage(file));
        } catch (e) {
          toast(e instanceof Error ? e.message : "Não consegui ler a imagem.", "error");
        }
      }
      setBusy(false);
      if (added.length) onChange([...itemsRef.current, ...added]);
    },
    [max, onChange, toast],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void addFiles(Array.from(e.dataTransfer.files));
  };

  const onPaste = (e: ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    if (files.length) {
      e.preventDefault();
      void addFiles(files);
    }
  };

  const remove = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <div
      className={`dropzone ${over ? "is-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onPaste={onPaste}
    >
      <p className="field-help">{hint}</p>
      <div className="thumbs">
        {items.map((img) => (
          <div className="thumb" key={img.id}>
            <img src={img.previewUrl} alt={img.name} />
            <button type="button" className="thumb-x" onClick={() => remove(img.id)} aria-label={`Remover ${img.name}`}>
              <X size={14} />
            </button>
          </div>
        ))}
        {items.length < max && (
          <button type="button" className="thumb thumb-add" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 size={22} className="spin" /> : <ImagePlus size={22} />}
            <span>{busy ? "Lendo…" : "Adicionar"}</span>
          </button>
        )}
      </div>
      <p className="dz-meta">
        {items.length} de {max} imagens · arraste, cole (Ctrl+V) ou clique
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          void addFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}
