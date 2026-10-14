import { useState } from "react";
import { categoriesFor, commandsIn, type Mode } from "../data/commands";

interface Props {
  mode: Mode;
  selected: string[];
  onToggle: (id: string) => void;
}

export function CommandPicker({ mode, selected, onToggle }: Props) {
  const cats = categoriesFor(mode);
  const [cat, setCat] = useState(cats[0].id);
  const active = cats.some((c) => c.id === cat) ? cat : cats[0].id;
  const list = commandsIn(mode, active);
  const countIn = (id: string) => commandsIn(mode, id).filter((c) => selected.includes(c.id)).length;

  return (
    <div>
      <div className="hm-tabs" role="tablist" aria-label="Categorias de comandos">
        {cats.map((c) => {
          const n = countIn(c.id);
          return (
            <button key={c.id} type="button" role="tab" aria-selected={active === c.id} className={active === c.id ? "on" : ""} onClick={() => setCat(c.id)}>
              {c.label}
              {n > 0 && <span className="hm-count">{n}</span>}
            </button>
          );
        })}
      </div>
      <div className="hm-cmds" role="tabpanel">
        {list.map((c) => {
          const on = selected.includes(c.id);
          return (
            <label key={c.id} className={`hm-cmd ${on ? "on" : ""}`}>
              <input type="checkbox" checked={on} onChange={() => onToggle(c.id)} />
              <span className="hm-cmd-text">
                <strong>{c.title}</strong>
                <small>{c.desc}</small>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
