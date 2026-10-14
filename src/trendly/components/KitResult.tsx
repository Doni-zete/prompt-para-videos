import type { MediaItem } from "../../lib/mediaResolver";
import { useState } from "react";
import { ChevronDown, ExternalLink, RotateCcw } from "lucide-react";
import { CopyButton } from "../../components/CopyButton";
import type { ToolOutput } from "../../lib/gemini";
import { findItem } from "../lib/direction";
import { RefImage } from "./RefImage";

export const FLOW_URL = "https://labs.google/fx/tools/flow";

interface Ref {
  label: string;
  url?: string;
  item?: MediaItem | null;
}

interface Props {
  avatar?: Ref;
  product: Ref;
  movementTitle: string;
  output: ToolOutput;
  onRedo: () => void;
}

function PromptCard({ title, step, tone, help, text }: { title: string; step: string; tone: "pink" | "green"; help: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tw-kit-card">
      <div className="tw-kit-top">
        <h4>{title}</h4>
        <CopyButton text={text} label="Copiar" variant="ghost" disabled={!text} />
      </div>
      <span className={`tw-step-chip ${tone}`}>{step}</span>
      <p>{help}</p>
      <button type="button" className="tw-more" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ChevronDown size={14} className={open ? "flip" : ""} aria-hidden="true" /> Ver Prompt Completo
      </button>
      {open && <pre className="tw-kit-pre">{text || "Sem texto."}</pre>}
    </div>
  );
}

/** "Seu Sistema de Criação Está Pronto": frame (passo 1) + vídeo (passo 2) para o Veo 3. */
export function KitResult({ avatar, product, movementTitle, output, onRedo }: Props) {
  const frame = findItem(output, /frame/i)?.text ?? "";
  const video = findItem(output, /v[ií]deo/i)?.text ?? "";
  return (
    <section className="tw-kit" aria-label="Sistema de criação pronto">
      <header className="tw-kit-head">
        <div>
          <h2>Seu Sistema de Criação Está Pronto</h2>
          <p>Baixe as imagens de referência, copie os prompts e gere seu vídeo no Veo 3.</p>
        </div>
        <button type="button" className="tw-redo" onClick={onRedo}>
          <RotateCcw size={13} aria-hidden="true" /> Refazer
        </button>
      </header>

      <div className="tw-kit-refs">
        {avatar && <RefImage big label={`Avatar: ${avatar.label}`} url={avatar.url} item={avatar.item} />}
        <RefImage big label={`Produto: ${product.label}`} url={product.url} item={product.item} />
      </div>

      <div className="tw-kit-prompts">
        <PromptCard title="Prompt do Frame" step="PASSO 1 · IMAGEM" tone="pink" help="Gere a imagem de referência (frame) primeiro — é a base que o Veo 3 vai animar." text={frame} />
        <PromptCard title={`Movimento: ${movementTitle}`} step="PASSO 2 · VÍDEO" tone="green" help="Use após gerar o frame — este prompt anima a imagem e gera o vídeo final no Veo 3." text={video} />
      </div>

      <div className="tw-magic">
        <div>
          <h3>Pronto para a mágica? ✨</h3>
          <p>Suas imagens de referência e prompts estão prontos. Agora é só gerar o vídeo ultra-realista no Veo 3.</p>
        </div>
        <a className="tw-white-btn" href={FLOW_URL} target="_blank" rel="noopener noreferrer">
          Abrir Veo 3 <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
