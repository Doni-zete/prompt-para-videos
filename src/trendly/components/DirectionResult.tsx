import type { MediaItem } from "../../lib/mediaResolver";
import { useState } from "react";
import { Check, ExternalLink, Loader2, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { CopyButton } from "../../components/CopyButton";
import type { ToolOutput } from "../../lib/gemini";
import type { GenerateState } from "../../hooks/useGenerate";
import { findItem, takeItems } from "../lib/direction";
import { RefImage } from "./RefImage";

const TOOLS = [
  { name: "Grok", sub: "Geração de vídeo pela xAI", badge: "Aurora", url: "https://grok.com/" },
  { name: "YouTube", sub: "YouTube Create", badge: "Dream Screen", url: "https://www.youtube.com/" },
  { name: "Flow", sub: "Google Labs", badge: "Veo 3", url: "https://labs.google/fx/tools/flow" },
  { name: "Google Opal", sub: "Geração de IA pela Google", badge: "Opal", url: "https://opal.google/" },
];

interface Ref {
  label: string;
  sub?: string;
  url?: string;
  item?: MediaItem | null;
}

interface Props {
  style: "ugc" | "pov";
  avatar?: Ref;
  product: Ref;
  output: ToolOutput;
  expectedTakes: number;
  frame: GenerateState;
  onFrame: () => void;
  onNew: () => void;
}

/** "Direção de IA Pronta!": storyboard técnico + checklist (Estação de Trabalho). */
export function DirectionResult({ style, avatar, product, output, expectedTakes, frame, onFrame, onNew }: Props) {
  const items = takeItems(output);
  const n = items.length || expectedTakes;
  const summary = findItem(output, /resumo/i);
  const [open, setOpen] = useState<number | null>(null);
  const frameText = frame.output?.sections[0]?.items[0]?.text;
  const single = n === 1;

  return (
    <section className="tw-dir" aria-label="Direção de IA pronta">
      <header className="tw-dir-head">
        <span className="tw-ok" aria-hidden="true">
          <Check size={22} />
        </span>
        <h2>Direção de IA Pronta!</h2>
        <p>Seu storyboard técnico foi gerado. Siga o checklist ao lado para finalizar.</p>
      </header>

      <div className="tw-dir-grid">
        <div className="tw-dir-left">
          {style === "ugc" && avatar && <RefImage big {...avatar} sub="ATOR PRINCIPAL" />}
          <RefImage {...product} sub="PRODUTO FOCO" />
          <div className="tw-frame">
            <h4>
              <Wand2 size={14} aria-hidden="true" /> Gerar Primeiro Frame
            </h4>
            <p>Crie o prompt ideal para gerar a imagem estática perfeita baseada nas suas configurações, antes de transformar em vídeo.</p>
            <button type="button" className="tw-dark-btn" onClick={onFrame} disabled={frame.status === "running"}>
              {frame.status === "running" ? <Loader2 size={14} className="spin" /> : null} Gerar Prompt de Imagem
            </button>
            {frame.status === "error" && <p className="alert alert-error" role="alert">{frame.error}</p>}
            {frameText && (
              <div className="tw-frame-out">
                <pre>{frameText}</pre>
                <CopyButton text={frameText} label="Copiar prompt" variant="ghost" />
              </div>
            )}
          </div>
        </div>

        <aside className="tw-station" aria-label="Estação de Trabalho">
          <h3>
            <Sparkles size={15} aria-hidden="true" /> Estação de Trabalho
          </h3>
          <ol>
            <li>
              <strong>Salvar Referências Visuais</strong>
              <span>Clique nas imagens ao lado para baixar os assets.</span>
            </li>
            <li>
              <strong>Roteiro de Direção (Veo 3)</strong>
              <span>
                {single ? "1 take de 8 segundos." : `${n} takes de 8 segundos cada. Gere cada vídeo separadamente e junte na edição.`}
              </span>
              {summary && <em className="tw-summary">{summary.text}</em>}
              <div className="tw-takes">
                {Array.from({ length: n }, (_, i) => {
                  const text = items[i]?.text ?? "";
                  return (
                    <div className="tw-take-row" key={i}>
                      <div className="tw-take-top">
                        <span>{single ? "● ROTEIRO NEURAL SINCRONIZADO" : `● TAKE ${i + 1}/${n}`}</span>
                        <button type="button" className="tw-link" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                          {single ? "[Ver Roteiro]" : "[Ver Prompt]"}
                        </button>
                      </div>
                      {open === i && <pre className="tw-take-pre">{text || "Sem texto para este take."}</pre>}
                      <CopyButton text={text} label={single ? "Copiar Roteiro Oficial" : `Copiar Take ${i + 1}`} variant="ghost" disabled={!text} />
                    </div>
                  );
                })}
              </div>
            </li>
            <li>
              <strong>Gerar com IA de vídeo</strong>
              <span>Escolha onde usar o roteiro copiado.</span>
              <div className="tw-tools">
                {TOOLS.map((t) => (
                  <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer" className="tw-tool">
                    <strong>
                      {t.name} <ExternalLink size={11} aria-hidden="true" />
                    </strong>
                    <span>{t.sub}</span>
                    <em>{t.badge}</em>
                  </a>
                ))}
              </div>
            </li>
          </ol>
        </aside>
      </div>

      <button type="button" className="tw-restart" onClick={onNew}>
        <RotateCcw size={13} aria-hidden="true" /> Começar Novo Projeto
      </button>
    </section>
  );
}

