import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { HACKS } from "../data/hacks";

export default function HacksPage() {
  return (
    <section>
      <header className="tl-gallery-head">
        <div>
          <h1><em>Hacks</em> de vídeo</h1>
          <p>Estilos de vídeo que funcionam bem no TikTok. Escolha um para ver exemplos e criar o seu do zero.</p>
        </div>
      </header>
      <div className="tl-hacks">
        {HACKS.map((h) => (
          <Link key={h.id} to={`/trendly/hacks/${h.id}`} className="tl-hack" style={{ background: `linear-gradient(120deg, ${h.colors[0]}, ${h.colors[1]})` }}>
            <span className="tl-hack-emoji" aria-hidden="true">{h.emoji}</span>
            <span className="tl-hack-text">
              <strong>{h.title}</strong>
              <span>{h.description}</span>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
