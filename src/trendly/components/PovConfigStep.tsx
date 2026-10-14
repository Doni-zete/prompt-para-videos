import { Check } from "lucide-react";
import { DURATIONS, POV_HANDS, POV_PRESENTATIONS, POV_SCENES } from "../data/options";
import { InfoCards, Pills, SectionLabel } from "./Choice";
import { TrendlyMedia } from "./TrendlyMedia";

export interface PovState {
  povScene: string;
  povSceneCustom: string;
  povHands: string;
  povPresentation: string;
  durationTakes: number;
}

interface Props {
  value: PovState;
  onChange: (patch: Partial<PovState>) => void;
}

export function PovConfigStep({ value, onChange }: Props) {
  return (
    <div className="tw-stack">
      <SectionLabel>Cenário</SectionLabel>
      <Pills options={POV_SCENES} value={value.povScene} onChange={(povScene) => onChange({ povScene })} label="Cenário" />
      {value.povScene === "custom" && (
        <input className="tw-input" value={value.povSceneCustom} placeholder="Descreva o cenário (ex.: mesa de madeira clara com luz de janela)" aria-label="Cenário personalizado" onChange={(e) => onChange({ povSceneCustom: e.target.value })} />
      )}

      <SectionLabel>Aparência das mãos</SectionLabel>
      <div className="tw-hands" role="radiogroup" aria-label="Aparência das mãos">
        {POV_HANDS.map((h) => {
          const on = h.id === value.povHands;
          const Icon = h.icon;
          return (
            <div className={`tw-photocard ${on ? "on" : ""}`} key={h.id}>
              <p className="tw-hand-title">{h.label}</p>
              <TrendlyMedia
                autoplay
                category="hands"
                names={[h.id]}
                title={h.label}
                ratio="ratio-avatar"
                badge={on ? <span className="tw-check"><Check size={13} aria-hidden="true" /></span> : undefined}
                caption={<p>{h.desc}</p>}
                stretch={<button type="button" role="radio" aria-checked={on} aria-label={h.label} className="tl-stretch" onClick={() => onChange({ povHands: h.id })} />}
              >
                <div className="tl-cover-art tl-cover-avatar">
                  <Icon size={28} aria-hidden="true" />
                </div>
              </TrendlyMedia>
            </div>
          );
        })}
      </div>

      <SectionLabel>Estilo de apresentação</SectionLabel>
      <InfoCards options={POV_PRESENTATIONS} value={value.povPresentation} onChange={(povPresentation) => onChange({ povPresentation })} label="Estilo de apresentação" />

      <SectionLabel>Duração</SectionLabel>
      <div className="tw-durations" role="radiogroup" aria-label="Duração">
        {DURATIONS.map((d) => (
          <button key={d.takes} type="button" role="radio" aria-checked={value.durationTakes === d.takes} className={`tw-duration ${value.durationTakes === d.takes ? "on" : ""}`} onClick={() => onChange({ durationTakes: d.takes })}>
            <strong>{d.label}</strong>
            <span>{d.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
