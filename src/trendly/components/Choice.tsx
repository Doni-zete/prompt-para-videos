import type { Option } from "../data/options";

interface Props {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}

/** Pílulas com ícone (cenários). */
export function Pills({ options, value, onChange, label }: Props) {
  return (
    <div className="tw-pills" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const Icon = o.icon;
        const on = o.id === value;
        return (
          <button key={o.id} type="button" role="radio" aria-checked={on} className={`tw-pill ${on ? "on" : ""}`} onClick={() => onChange(o.id)}>
            <Icon size={18} aria-hidden="true" />
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Cartões com ícone, título e descrição (estilo de apresentação). */
export function InfoCards({ options, value, onChange, label }: Props) {
  return (
    <div className="tw-infocards" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const Icon = o.icon;
        const on = o.id === value;
        return (
          <button key={o.id} type="button" role="radio" aria-checked={on} className={`tw-infocard ${on ? "on" : ""}`} onClick={() => onChange(o.id)}>
            <Icon size={18} aria-hidden="true" />
            <strong>{o.label}</strong>
            {o.desc && <span>{o.desc}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const SectionLabel = ({ children }: { children: string }) => <p className="tw-section-label">{children}</p>;
