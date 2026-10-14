import { Download, ImageOff } from "lucide-react";
import type { MediaItem } from "../../lib/mediaResolver";

interface Props {
  label: string;
  sub?: string;
  /** Imagem direta (ex.: foto enviada pelo usuário no passo do produto). */
  url?: string;
  /** Arquivo de public/media: imagem ou vídeo. */
  item?: MediaItem | null;
  big?: boolean;
}

const slugName = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "referencia";
const extOf = (u: string) => (u.split("?")[0].split(".").pop() ?? "").toLowerCase();

/** Referência visual clicável: baixa o arquivo (como "Salvar Referências Visuais"). */
export function RefImage({ label, sub, url, item, big }: Props) {
  const caption = (
    <span className="tw-ref-cap">
      {sub && <small>{sub}</small>}
      <strong>{label}</strong>
    </span>
  );
  const file = item?.url ?? url;
  if (!file) {
    return (
      <div className={`tw-ref tw-ref-empty ${big ? "big" : ""}`}>
        <ImageOff size={22} aria-hidden="true" />
        <span>Sem imagem</span>
        {caption}
      </div>
    );
  }
  const isVideo = item?.kind === "video";
  const ext = isVideo ? extOf(file) || "mp4" : "jpg";
  return (
    <a className={`tw-ref ${big ? "big" : ""}`} href={file} download={`${slugName(label)}.${ext}`} title={isVideo ? "Clique para baixar o vídeo" : "Clique para baixar a imagem"}>
      {isVideo ? <video src={`${file}#t=0.1`} poster={item?.poster} muted playsInline preload="metadata" aria-label={label} /> : <img src={file} alt={label} />}
      <span className="tw-ref-dl" aria-hidden="true">
        <Download size={14} />
      </span>
      {caption}
    </a>
  );
}
