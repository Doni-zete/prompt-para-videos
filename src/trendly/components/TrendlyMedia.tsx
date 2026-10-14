import type { ReactNode } from "react";
import { MediaView } from "../../components/MediaView";
import { media } from "../../lib/media";
import type { MediaCategory } from "../../lib/mediaResolver";

interface Props {
  category: MediaCategory;
  /** Nomes de arquivo aceitos (sem extensão). O primeiro que existir em public/media/<categoria>/ é usado. */
  names: string[];
  title: string;
  children?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  caption?: ReactNode;
  /** Elemento que cobre toda a mídia (ex.: link do card). */
  stretch?: ReactNode;
  ratio?: string;
  /** Mostra o nome de arquivo esperado quando ainda não existe mídia. */
  hint?: boolean;
  /** Vídeos tocam sozinhos enquanto estão na tela (use em cartões de seleção). */
  autoplay?: boolean;
  /** Esconde a legenda quando existe arquivo (a imagem já traz o título escrito). */
  hideCaptionWhenMedia?: boolean;
}

/** Mídia do card (estilo Trendly). Lida do repositório: public/media/<categoria>/<nome>.mp4|jpg|png|webp. */
export function TrendlyMedia({ category, names, title, children, badge, actions, caption, stretch, ratio = "ratio-portrait", hint, autoplay, hideCaptionWhenMedia }: Props) {
  const item = media.resolve(category, names);
  const expected = `public/media/${category}/${names[0]}.mp4 ou .jpg`;
  return (
    <div className="tl-media-wrap">
      <div className={`tl-media ${ratio}`} title={item ? undefined : `Falta o arquivo: ${expected}`}>
        {item ? <MediaView item={item} title={title} autoplay={autoplay} /> : <div className="tl-cover">{children}</div>}
        {!item && hint && <span className="tl-expected">{expected}</span>}
        {caption && !(item && hideCaptionWhenMedia) && <div className="tl-caption">{caption}</div>}
        {stretch}
        <div className="tl-media-top">
          <div className="tl-badge-slot">{badge}</div>
          <div className="tl-media-actions">{actions}</div>
        </div>
      </div>
    </div>
  );
}
