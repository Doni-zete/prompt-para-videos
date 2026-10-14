import { useState } from "react";
import { Link } from "react-router-dom";
import { Images, Info, Sparkles } from "lucide-react";
import { AvatarImage } from "../components/AvatarStep";
import { avatarNames, type Avatar } from "../data/avatars";
import { media } from "../../lib/media";
import { useAvatars } from "../hooks/useAvatars";

type Tab = "f" | "m" | "mine";
const TABS: [Tab, string][] = [["f", "Mulheres"], ["m", "Homens"], ["mine", "Meus Avatares"]];

function Card({ avatar }: { avatar: Avatar }) {
  const names = avatarNames(avatar);
  const found = media.resolve("avatars", names);
  const has = !!found;
  return (
    <article className="tl-avatar-card">
      <div className="tl-media ratio-avatar">
        <div className="tl-cover">
          <div className="tw-avatar-static">
            <AvatarImage avatar={avatar} />
          </div>
        </div>
        <div className="tl-caption">
          <h2>{avatar.name}</h2>
        </div>
      </div>
      <div className="tl-avatar-fields">
        <p className={`tw-file-status ${has ? "ok" : ""}`}>{has ? (found?.kind === "video" ? "Vídeo encontrado" : "Foto encontrada") : "Sem foto ainda"}</p>
        {!has && <code className="tw-file">public/media/avatars/{names[0]}.jpg (ou .mp4)</code>}
        {avatar.description && <p className="tw-hint">{avatar.description}</p>}
      </div>
    </article>
  );
}

/** Influencer Studio: os avatares usados nos vídeos. As fotos vêm de public/media/avatars. */
export default function InfluencerPage() {
  const { avatars } = useAvatars();
  const [tab, setTab] = useState<Tab>("f");
  const list = avatars.filter((a) => (tab === "mine" ? a.mine : !a.mine && a.gender === tab));

  return (
    <section>
      <header className="tl-gallery-head">
        <div>
          <h1>Influencer <em>Studio</em></h1>
          <p>Os avatares ficam no repositório. Coloque a foto de cada um em public/media/avatars e ela aparece aqui e nos vídeos.</p>
        </div>
        <div className="row">
          <Link className="tl-ghost-pill" to="/trendly/midia"><Images size={14} /> Mapa de mídia</Link>
          <Link className="tl-ghost-pill" to="/ferramenta/influencer"><Sparkles size={14} /> Gerar um influencer com IA</Link>
        </div>
      </header>

      <div className="tl-note tl-note-info">
        <Info size={15} aria-hidden="true" />
        <div>
          <strong>Como adicionar um avatar seu:</strong> salve a foto como <code>f-nome.jpg</code> (mulher) ou <code>m-nome.jpg</code> (homem) em <code>public/media/avatars/</code>, faça o commit e ele aparece em “Meus Avatares”. Para dar rosto a um avatar-base, use o nome dele, por exemplo <code>carolina.jpg</code>. Use apenas fotos suas, de quem autorizou ou de personagens fictícios criados por IA.
        </div>
      </div>

      <div className="tw-tabs tw-tabs-left" role="tablist" aria-label="Tipo de avatar">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="tl-empty">
          <h2>Nenhum avatar seu ainda</h2>
          <p>Coloque uma foto como f-nome.jpg ou m-nome.jpg em public/media/avatars e ela aparece aqui.</p>
        </div>
      ) : (
        <div className="tl-avatar-grid">
          {list.map((a) => (
            <Card key={a.id} avatar={a} />
          ))}
        </div>
      )}
    </section>
  );
}
