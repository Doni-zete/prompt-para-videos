import { Link } from "react-router-dom";
import { Camera, Shirt, UserRound } from "lucide-react";
import { STYLES, type StyleId } from "../data/styles";
import { TrendlyMedia } from "../components/TrendlyMedia";

const ICONS: Record<StyleId, typeof Camera> = { ugc: UserRound, pov: Camera, provador: Shirt };

/** Reels Studio: "Escolha o estilo do seu vídeo". */
export default function ReelsHome() {
  return (
    <section>
      <header className="tl-hero">
        <h1>Escolha o estilo do seu vídeo</h1>
        <p>Selecione o formato ideal para criar conteúdos que convertem.</p>
      </header>
      <div className="tl-styles">
        {STYLES.map((s) => {
          const Icon = ICONS[s.id];
          return (
            <article className="tl-style" key={s.id}>
              <TrendlyMedia
                autoplay
                hideCaptionWhenMedia
                category="styles"
                names={[s.id]}
                title={s.title}
                ratio="ratio-style"
                caption={
                  <>
                    <h2>{s.title}</h2>
                    <p>{s.description}</p>
                  </>
                }
                stretch={<Link className="tl-stretch" to={`/trendly/reels/${s.id}`} aria-label={`Criar vídeo ${s.title}`} />}
              >
                <div className="tl-cover-art" style={{ background: `linear-gradient(160deg, hsl(${s.hue} 70% 38%), hsl(${(s.hue + 50) % 360} 60% 14%))` }}>
                  <Icon size={44} aria-hidden="true" />
                </div>
              </TrendlyMedia>
            </article>
          );
        })}
      </div>
      <p className="tl-foot-note">Capas: coloque ugc.jpg, pov.jpg e provador.jpg em public/media/styles (veja o Mapa de mídia). Se a imagem já tiver o título escrito, o app não repete o texto por cima.</p>
    </section>
  );
}
