import { logEvent } from "../lib/diagnostics";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { useInView } from "../hooks/useInView";
import type { MediaItem } from "../lib/mediaResolver";
import { playMuted, useAutoplay } from "../lib/videoMotion";

interface Props {
  item: MediaItem;
  title: string;
  /** Vídeo toca sozinho (mudo, em loop) enquanto o cartão está na tela. Use em cartões de seleção. */
  autoplay?: boolean;
  /** Imagem decorativa (o cartão já tem texto): sem texto alternativo. */
  decorative?: boolean;
}

/** Mostra uma imagem ou um vídeo. Preenche o contêiner. */
export function MediaView({ item, title, autoplay = false, decorative = false }: Props) {
  // O vídeo só começa a baixar quando o card chega perto da tela (a galeria tem dezenas).
  const [ref, seen, visible] = useInView<HTMLVideoElement>();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [allowed] = useAutoplay();
  const canAutoplay = autoplay && allowed;

  useEffect(() => {
    const v = ref.current;
    if (!canAutoplay || !seen || !v) return;
    if (visible) void playMuted(v);
    else v.pause();
  }, [canAutoplay, seen, visible, ref]);

  if (item.kind === "image") return <img src={item.url} alt={decorative ? "" : `Prévia de ${title}`} loading="lazy" decoding="async" />;

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  };
  return (
    <>
      <video
        ref={ref}
        // "#t=0.1" faz o navegador mostrar um quadro do vídeo em vez de uma caixa preta.
        src={seen ? `${item.url}#t=0.1` : undefined}
        poster={item.poster}
        muted
        loop
        playsInline
        preload={seen ? "metadata" : "none"}
        aria-label={decorative ? undefined : `Prévia em vídeo de ${title}`}
        aria-hidden={decorative || undefined}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setFailed(true);
          logEvent("video", `Vídeo não toca: ${item.url.split("/").slice(-2).join("/")}`);
        }}
        onMouseEnter={autoplay ? undefined : () => void ref.current?.play().catch(() => undefined)}
        onMouseLeave={autoplay ? undefined : () => ref.current?.pause()}
        onClick={autoplay ? undefined : toggle}
      />
      {failed && (
        <span className="media-fail" role="alert">
          Este vídeo não toca no navegador. Converta para MP4 (H.264) ou WebM.
        </span>
      )}
      {!autoplay && !playing && !failed && (
        <button type="button" className="media-play" onClick={toggle} aria-label="Reproduzir prévia">
          <Play size={18} fill="currentColor" />
        </button>
      )}
    </>
  );
}
