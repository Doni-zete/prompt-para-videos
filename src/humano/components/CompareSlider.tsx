import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ChevronsUpDown } from "lucide-react";
import { MediaView } from "../../components/MediaView";
import type { MediaItem } from "../../lib/mediaResolver";

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

function Layer({ item, title, placeholder, tone }: { item: MediaItem | null; title: string; placeholder: ReactNode; tone: "original" | "realista" }) {
  return (
    <div className="hm-layer">
      {item ? <MediaView item={item} title={title} autoplay decorative /> : <div className={`hm-ph ${tone}`}>{placeholder}</div>}
    </div>
  );
}

interface Props {
  original: MediaItem | null;
  realista: MediaItem | null;
  /** Caminho sugerido, mostrado quando ainda não há arquivo. */
  hintOriginal: string;
  hintRealista: string;
}

/** Comparação "Original × Realista": arraste o divisor (ou use as setas do teclado). */
export function CompareSlider({ original, realista, hintOriginal, hintRealista }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [pos, setPos] = useState(50);

  const setFromX = (x: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r && r.width > 0) setPos(clamp(((x - r.left) / r.width) * 100));
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromX(e.clientX);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => dragging.current && setFromX(e.clientX);
  const up = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 4;
    if (e.key === "ArrowLeft") setPos((p) => clamp(p - step));
    else if (e.key === "ArrowRight") setPos((p) => clamp(p + step));
    else if (e.key === "Home") setPos(0);
    else if (e.key === "End") setPos(100);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={box} className="hm-compare" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <Layer item={realista} title="Realista" tone="realista" placeholder={<><strong>Realista (IA)</strong><code>{hintRealista}</code></>} />
      <div className="hm-clip" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` } as CSSProperties}>
        <Layer item={original} title="Original" tone="original" placeholder={<><strong>Original (IA)</strong><code>{hintOriginal}</code></>} />
      </div>
      <span className="hm-tag left">Original</span>
      <span className="hm-tag right">Realista</span>
      <div className="hm-divider" style={{ left: `${pos}%` }} aria-hidden="true" />
      <div
        className="hm-handle"
        style={{ left: `${pos}%` }}
        role="slider"
        tabIndex={0}
        aria-label="Comparar Original e Realista"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)}% Original`}
        onKeyDown={key}
      >
        <ChevronsUpDown size={18} aria-hidden="true" />
      </div>
    </div>
  );
}
