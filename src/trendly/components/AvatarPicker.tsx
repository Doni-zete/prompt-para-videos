import { Check } from "lucide-react";
import type { Avatar } from "../data/avatars";
import { AvatarImage } from "./AvatarStep";

interface Props {
  avatars: Avatar[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** Seletor compacto de avatar (usado nos Hacks). */
export function AvatarPicker({ avatars, selectedId, onSelect }: Props) {
  return (
    <div className="tw-avatar-grid tw-avatar-grid-sm" role="radiogroup" aria-label="Escolha um avatar">
      {avatars.map((a) => {
        const on = a.id === selectedId;
        return (
          <button key={a.id} type="button" role="radio" aria-checked={on} className={`tw-avatar ${on ? "on" : ""}`} onClick={() => onSelect(on ? null : a.id)}>
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
    </div>
  );
}
