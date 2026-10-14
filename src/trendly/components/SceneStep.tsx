import { Check } from "lucide-react";
import { INTERACTIONS, POSES, SCENES, type Option } from "../data/options";
import { Pills, SectionLabel } from "./Choice";
import { TrendlyMedia } from "./TrendlyMedia";

export interface SceneState {
  scene: string;
  sceneCustom: string;
  interaction: string;
  pose: string;
}

function PhotoCards({ prefix, options, value, onChange, label }: { prefix: "interactions" | "poses"; options: Option[]; value: string; onChange: (id: string) => void; label: string }) {
  return (
    <div className="tw-photocards" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = o.id === value;
        const Icon = o.icon;
        return (
          <div className={`tw-photocard ${on ? "on" : ""}`} key={o.id}>
            <TrendlyMedia
              category={prefix}
              autoplay
              names={[o.id]}
              title={o.label}
              ratio="ratio-avatar"
              badge={on ? <span className="tw-check"><Check size={13} aria-hidden="true" /></span> : undefined}
              caption={<h3>{o.label}</h3>}
              stretch={<button type="button" role="radio" aria-checked={on} aria-label={o.label} className="tl-stretch" onClick={() => onChange(o.id)} />}
            >
              <div className="tl-cover-art tl-cover-avatar">
                <Icon size={30} aria-hidden="true" />
              </div>
            </TrendlyMedia>
            {o.desc && <p className="tw-photocard-desc">{o.desc}</p>}
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  value: SceneState;
  onChange: (patch: Partial<SceneState>) => void;
}

export function SceneStep({ value, onChange }: Props) {
  return (
    <div className="tw-stack">
      <p className="tw-lede">Defina como o influencer vai interagir com o produto, o cenário de fundo e a pose exata para a geração.</p>
      <SectionLabel>Cenário</SectionLabel>
      <Pills options={SCENES} value={value.scene} onChange={(scene) => onChange({ scene })} label="Cenário" />
      {value.scene === "custom" && (
        <input className="tw-input" value={value.sceneCustom} placeholder="Descreva o cenário (ex.: varanda com plantas e luz do fim de tarde)" aria-label="Cenário personalizado" onChange={(e) => onChange({ sceneCustom: e.target.value })} />
      )}
      <SectionLabel>Interação com o Produto</SectionLabel>
      <PhotoCards prefix="interactions" options={INTERACTIONS} value={value.interaction} onChange={(interaction) => onChange({ interaction })} label="Interação com o produto" />
      <SectionLabel>Pose do Avatar</SectionLabel>
      <PhotoCards prefix="poses" options={POSES} value={value.pose} onChange={(pose) => onChange({ pose })} label="Pose do avatar" />
    </div>
  );
}
