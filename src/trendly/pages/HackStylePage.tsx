import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, ShieldCheck, Wand2 } from "lucide-react";
import NotFound from "../../pages/NotFound";
import { TrendlyMedia } from "../components/TrendlyMedia";
import { ViralCreator } from "../components/ViralCreator";
import { getHack } from "../data/hacks";

export default function HackStylePage() {
  const { id } = useParams();
  const hack = getHack(id);
  const [open, setOpen] = useState(false);
  if (!hack) return <NotFound />;

  return (
    <section>
      <Link to="/trendly/hacks" className="tl-back-link"><ArrowLeft size={16} /> Voltar para Hacks</Link>

      <div className="tl-banner" style={{ background: `linear-gradient(120deg, ${hack.colors[0]}, ${hack.colors[1]})` }}>
        <span className="tl-banner-emoji" aria-hidden="true">{hack.emoji}</span>
        <div>
          <h1>{hack.title}</h1>
          <p>{hack.description}</p>
          <a className="tl-dark-btn" href={`https://www.tiktok.com/search?q=${encodeURIComponent(hack.tiktokQuery)}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} /> Mais vídeos no TikTok
          </a>
        </div>
      </div>

      <h2 className="tl-section-title">Exemplos de Vídeos</h2>
      <div className="tl-examples">
        {[1, 2].map((n) => (
          <TrendlyMedia key={n} autoplay category="hacks" names={[`${hack.id}-ex${n}`]} title={`Exemplo ${n} de ${hack.title}`} ratio="ratio-reel" hint caption={<h3>Exemplo {n}</h3>}>
            <div className="tl-cover-art tl-cover-dark"><span>Vídeo de referência</span></div>
          </TrendlyMedia>
        ))}
        <button type="button" className="tl-create-card" onClick={() => setOpen(true)}>
          <span className="tl-create-ic"><Wand2 size={22} /></span>
          Criar meu vídeo do Zero
        </button>
      </div>

      <div className="tl-rules" role="note">
        <strong><ShieldCheck size={15} aria-hidden="true" /> Regras deste estilo</strong>
        <ul>{hack.rules.map((r) => <li key={r}>{r}</li>)}</ul>
      </div>

      <ViralCreator hack={hack} open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
