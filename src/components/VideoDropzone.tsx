import { useEffect, useRef, useState, type DragEvent } from "react";
import { UploadCloud, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

const TYPES = ["video/mp4", "video/quicktime", "video/webm"];

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
  maxMB: number;
  label: string;
  hint: string;
}

const fmt = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function VideoDropzone({ file, onChange, maxMB, label, hint }: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setUrl(null);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const accept = (f: File | undefined) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return toast("Formato não suportado. Use MP4, MOV ou WEBM.", "error");
    if (f.size > maxMB * 1024 * 1024) return toast(`O vídeo tem ${fmt(f.size)}. O limite é ${maxMB} MB.`, "error");
    onChange(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    accept(e.dataTransfer.files[0]);
  };

  if (file && url) {
    return (
      <div className="video-ready">
        <video src={url} controls preload="metadata" />
        <div className="video-meta">
          <span title={file.name}>{file.name}</span>
          <span>{fmt(file.size)}</span>
          <button type="button" className="icon-btn" onClick={() => onChange(null)} aria-label="Remover vídeo">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`video-drop ${over ? "is-over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <UploadCloud size={28} />
        <strong>{label}</strong>
        <span>{hint}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        hidden
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}
