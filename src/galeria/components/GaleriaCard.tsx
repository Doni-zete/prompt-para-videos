import { logEvent } from "../../lib/diagnostics";
import { useEffect, useState } from "react";
import { Copy, Heart, Image as ImageIcon, Pencil, Sparkles, Video, Wand2 } from "lucide-react";
import { useInView } from "../../hooks/useInView";
import type { MediaItem } from "../../lib/mediaResolver";
import { playMuted, useAutoplay } from "../../lib/videoMotion";
import { displayTitle, subtitleOf, type GaleriaView } from "../lib/galeria";


/** Prévia do card: o vídeo só baixa quando o card chega perto da tela e toca sozinho (mudo, em loop, como um GIF) enquanto estiver na tela. */
function CardMedia({ item, title }: { item: MediaItem; title: string }) {
  const [ref, seen, visible] = useInView<HTMLVideoElement>();
  const [autoplay] = useAutoplay();
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const run = () => {
    const v = ref.current;
    if (!v || !seen) return;
    if (visible && autoplay) void playMuted(v).then((ok) => setBlocked(!ok));
    else {
      v.pause();
      setBlocked(false);
    }
  };
  useEffect(run, [seen, visible, autoplay]); // eslint-disable-line react-hooks/exhaustive-deps

  if (item.kind === "image") return <img src={item.url} alt="" loading="lazy" decoding="async" />;
  return (
    <>
      <video
        ref={ref}
        src={seen ? `${item.url}#t=0.1` : undefined}
        poster={item.poster}
        muted
        loop
        playsInline
        preload={seen ? "metadata" : "none"}
        aria-hidden="true"
        aria-label={`Prévia em vídeo de ${title}`}
        onLoadedData={run}
        onError={() => {
          setFailed(true);
          logEvent("video", `Vídeo não toca: ${item.url.split("/").slice(-2).join("/")}`);
        }}
      />
      {blocked && !failed && <span className="gl-blocked" aria-hidden="true">▶</span>}
      {failed && <span className="media-fail">Este vídeo não toca no navegador. Converta para MP4 (H.264) ou WebM.</span>}
    </>
  );
}

interface Props {
  item: GaleriaView;
  media: MediaItem | null;
  fav: boolean;
  onFav: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onCopy: () => void;
  /** Vídeos no formato novo: montar o prompt e gerar com IA. */
  canAi: boolean;
  onMontar: () => void;
  onVeo: () => void;
}

/** Card da galeria: mídia em tela cheia, selos, coração e, ao passar o mouse, copiar e lápis (editar). */
export function GaleriaCard({ item, media, fav, onFav, onOpen, onEdit, onCopy, canAi, onMontar, onVeo }: Props) {
  const Kind = item.kind === "image" ? ImageIcon : Video;
  const name = displayTitle(item.title);
  return (
    <article
      className="gl-card"
      data-id={item.id}
    >
      <button type="button" className="gl-open" onClick={onOpen}>
        <span className="gl-media">
          {media ? (
            <CardMedia item={media} title={name} />
          ) : (
            <span className="gl-art" style={{ background: `linear-gradient(165deg, hsl(${item.cover?.hue ?? (item.id.length * 47) % 360} 50% 26%), #0a0a0d)` }} aria-hidden="true">
              {item.cover?.emoji ? <span className="gl-emoji">{item.cover.emoji}</span> : <Kind size={30} />}
            </span>
          )}
        </span>
        <span className="gl-shade" aria-hidden="true" />
        <span className="gl-title">
          <span className="sr-only">Abrir </span>
          <strong>{name}</strong>
          <small>{subtitleOf(item)}</small>
        </span>
      </button>

      <div className="gl-chips">
        <span className="gl-chip">{item.kind === "image" ? "Imagem" : "Vídeo"}</span>
        {item.fromMedia && <span className="gl-chip new">Novo</span>}
        {item.edited && <span className="gl-chip ed">Editado</span>}
        {item.userMade && <span className="gl-chip mine">Seu</span>}
      </div>

      <div className="gl-side">
        <button type="button" className={`gl-btn ${fav ? "on" : ""}`} onClick={onFav} aria-pressed={fav} aria-label={fav ? `Remover ${name} dos favoritos` : `Favoritar ${name}`}>
          <Heart size={15} fill={fav ? "currentColor" : "none"} />
        </button>
        {item.hasSpec ? (
          <>
            <button type="button" className="gl-btn gl-quick" onClick={onMontar} aria-label={`Montar prompt de ${name}`} title="Montar prompt">
              <Wand2 size={15} />
            </button>
            <button type="button" className="gl-btn gl-quick" onClick={onVeo} disabled={!canAi} aria-label={`Gerar com IA ${name}`} title={canAi ? "Gerar com IA a partir da sua foto" : "Conecte o Gemini para usar"}>
              <Sparkles size={15} />
            </button>
          </>
        ) : (
          <>
            <button type="button" className="gl-btn gl-quick" onClick={onCopy} aria-label={`Copiar prompt de ${name}`} title="Copiar prompt" disabled={!item.prompt.trim()}>
              <Copy size={15} />
            </button>
            <button type="button" className="gl-btn gl-quick" onClick={onEdit} aria-label={`Editar prompt de ${name}`} title="Editar prompt">
              <Pencil size={15} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
