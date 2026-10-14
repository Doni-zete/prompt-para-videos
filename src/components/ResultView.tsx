import { Download, RefreshCw } from "lucide-react";
import type { ToolOutput } from "../lib/gemini";
import { downloadText } from "../lib/clipboard";
import { outputToText } from "../tools/normalize";
import { CopyButton } from "./CopyButton";

interface Props {
  output: ToolOutput;
  model?: string;
  filename: string;
  onRegenerate?: () => void;
  busy?: boolean;
}

export function ResultView({ output, model, filename, onRegenerate, busy }: Props) {
  const full = outputToText(output);
  return (
    <div className="result">
      <div className="result-bar">
        <CopyButton text={full} label="Copiar tudo" variant="primary" />
        <button type="button" className="btn btn-ghost" onClick={() => downloadText(`${filename}.txt`, full)}>
          <Download size={14} /> Baixar .txt
        </button>
        {onRegenerate && (
          <button type="button" className="btn btn-ghost" onClick={onRegenerate} disabled={busy}>
            <RefreshCw size={14} /> Gerar de novo
          </button>
        )}
        {model && <span className="model-tag">via {model}</span>}
      </div>

      {output.summary && <p className="result-summary">{output.summary}</p>}

      {output.sections.map((section, si) => (
        <section className="result-section" key={`${section.title}-${si}`}>
          <header>
            <h3>{section.title}</h3>
            <CopyButton
              variant="quiet"
              label="Copiar seção"
              text={() => section.items.map((i) => (i.label ? `[${i.label}]\n${i.text}` : i.text)).join("\n\n")}
            />
          </header>
          {section.items.map((item, ii) => (
            <article className="result-item" key={ii}>
              <div className="result-item-head">
                {item.label ? <span className="chip">{item.label}</span> : <span />}
                <CopyButton text={item.text} variant="quiet" label="Copiar" />
              </div>
              <p className="result-text">{item.text}</p>
              {item.hint && <p className="result-hint">{item.hint}</p>}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
