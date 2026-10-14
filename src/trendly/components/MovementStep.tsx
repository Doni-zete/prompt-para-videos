import { Check, Video } from "lucide-react";
import { GALLERY } from "../data/gallery";
import { TrendlyMedia } from "./TrendlyMedia";

const VIDEOS = GALLERY.filter((g) => g.kind === "video");

interface Props {
  value: string | null;
  onChange: (id: string) => void;
}

export function MovementStep({ value, onChange }: Props) {
  return (
    <div className="tw-move-grid" role="radiogroup" aria-label="Prompt de movimento">
      {VIDEOS.map((g) => {
        const on = g.id === value;
        return (
          <TrendlyMedia
            key={g.id}
              autoplay
            category="gallery"
            names={[g.id]}
            title={g.title}
            badge={
              on ? (
                <span className="tw-check"><Check size={13} aria-hidden="true" /></span>
              ) : (
                <span className="tl-badge"><Video size={12} aria-hidden="true" /> Vídeo</span>
              )
            }
            caption={
              <>
                <h3>{g.title}</h3>
                <p>{g.description}</p>
              </>
            }
            stretch={<button type="button" role="radio" aria-checked={on} aria-label={g.title} className={`tl-stretch ${on ? "is-picked" : ""}`} onClick={() => onChange(g.id)} />}
          >
            <div className="tl-cover-art" style={{ background: `linear-gradient(160deg, hsl(${(g.id.length * 47) % 360} 50% 22%), #0a0a0d)` }}>
              <Video size={28} aria-hidden="true" />
            </div>
          </TrendlyMedia>
        );
      })}
    </div>
  );
}
