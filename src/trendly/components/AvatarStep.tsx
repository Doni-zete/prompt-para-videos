import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import { MediaView } from "../../components/MediaView";
import { media } from "../../lib/media";
import { avatarNames, type Avatar } from "../data/avatars";

export function AvatarImage({ avatar }: { avatar: Avatar }) {
  const photo = media.resolve("avatars", avatarNames(avatar));
  if (photo) return <MediaView item={photo} title={avatar.name || "Avatar"} autoplay decorative />;
  const hue = (avatar.name.charCodeAt(0) * 37) % 360;
  return (
    <span className="tw-avatar-ph" style={{ background: `linear-gradient(160deg, hsl(${hue} 45% 30%), #0b0b0e)` }} aria-hidden="true">
      {avatar.name.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

type Tab = "f" | "m" | "mine";
const TABS: [Tab, string][] = [["f", "Mulheres"], ["m", "Homens"], ["mine", "Meus Avatares"]];

interface Props {
  avatars: Avatar[];
  value: string | null;
  onChange: (id: string) => void;
}

export function AvatarStep({ avatars, value, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("f");
  const list = avatars.filter((a) => (tab === "mine" ? a.mine : !a.mine && a.gender === tab));
  return (
    <div className="tw-stack">
      <div className="tw-tabs" role="tablist" aria-label="Tipo de avatar">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="tw-avatar-grid" role="radiogroup" aria-label="Escolha o influencer">
        {list.map((a) => {
          const on = a.id === value;
          return (
            <button key={a.id} type="button" role="radio" aria-checked={on} className={`tw-avatar ${on ? "on" : ""}`} onClick={() => onChange(a.id)}>
              <AvatarImage avatar={a} />
              <span className="tw-avatar-name">{a.name.trim() || "Sem nome"}</span>
              {on && (
                <span className="tw-check" aria-hidden="true">
                  <Check size={13} />
                </span>
              )}
            </button>
          );
        })}
        {tab === "mine" && (
          <Link to="/trendly/influencer" className="tw-avatar tw-avatar-add">
            <Plus size={22} aria-hidden="true" />
            <span>Como importar meu avatar</span>
          </Link>
        )}
      </div>
      {list.length === 0 && tab === "mine" && <p className="tw-hint">Você ainda não tem avatares seus. Coloque uma foto chamada f-nome.jpg (ou m-nome.jpg) em public/media/avatars e ela aparece aqui.</p>}
    </div>
  );
}
