import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Camera, Video } from "lucide-react";
import { MediaView } from "../../components/MediaView";
import { media } from "../../lib/media";
import type { Preset } from "../data/presets";

function Thumb({ preset, index }: { preset: Preset; index: number }) {
  const item = media.resolve("humano", [preset.id]);
  if (item) return <MediaView item={item} title={preset.title} autoplay decorative />;
  const Icon = preset.kind === "video" ? Video : Camera;
  return (
    <span className="hm-thumb-ph" style={{ background: `linear-gradient(160deg, hsl(${(index * 47 + 12) % 360} 38% 30%), #17161f)` }} aria-hidden="true">
      <Icon size={26} />
    </span>
  );
}

interface Props {
  presets: Preset[];
  selected: string[];
  onToggle: (id: string) => void;
}

export function PresetCarousel({ presets, selected, onToggle }: Props) {
  const rail = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, presets]);

  const go = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * (rail.current.clientWidth * 0.8), behavior: "smooth" });

  return (
    <div className="hm-carousel">
      {canPrev && (
        <button type="button" className="hm-arrow prev" onClick={() => go(-1)} aria-label="Presets anteriores">
          <ChevronLeft size={20} />
        </button>
      )}
      <div className="hm-rail" ref={rail} onScroll={measure}>
        {presets.map((p, i) => {
          const on = selected.includes(p.id);
          return (
            <label key={p.id} className={`hm-preset ${on ? "on" : ""}`}>
              <input type="checkbox" checked={on} onChange={() => onToggle(p.id)} aria-label={p.title} />
              <span className="hm-box" aria-hidden="true">{on && <Check size={12} strokeWidth={3} />}</span>
              <span className="hm-thumb">
                <Thumb preset={p} index={i} />
              </span>
              <span className="hm-preset-title">{p.title}</span>
            </label>
          );
        })}
      </div>
      {canNext && (
        <button type="button" className="hm-arrow next" onClick={() => go(1)} aria-label="Mais presets">
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
