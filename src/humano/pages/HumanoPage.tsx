import { useMemo, useState } from "react";
import { ArrowDown, Check, Copy, Image as ImageIcon, Pencil, RefreshCcw, Trash2, TriangleAlert, Video } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { usePersistentState } from "../../hooks/usePersistentState";
import { copyText } from "../../lib/clipboard";
import { media } from "../../lib/media";
import { CommandPicker } from "../components/CommandPicker";
import { CompareSlider } from "../components/CompareSlider";
import { PresetCarousel } from "../components/PresetCarousel";
import type { Mode } from "../data/commands";
import { presetsFor } from "../data/presets";
import { INITIAL_STATE, compareNames, composePrompt, sanitizeState, type HumanoState } from "../lib/compose";
import "../humano.css";

const MODES: { id: Mode; label: string; icon: typeof ImageIcon }[] = [
  { id: "image", label: "Imagem", icon: ImageIcon },
  { id: "video", label: "Vídeo", icon: Video },
];

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** Humanizar IA: monta prompts que tiram a "cara de IA" de fotos e vídeos. */
export default function HumanoPage() {
  const toast = useToast();
  const [saved, setSaved] = usePersistentState<HumanoState>("humano:v1", INITIAL_STATE);
  const st = useMemo(() => sanitizeState(saved), [saved]);
  const [editing, setEditing] = useState(false);

  const patch = (p: Partial<HumanoState>) => setSaved({ ...st, ...p });
  const composed = useMemo(() => composePrompt(st), [st]);
  const text = st.custom ?? composed;
  const outdated = st.custom !== null && st.custom !== composed;

  const activePreset = st.presetIds[st.presetIds.length - 1];
  const original = media.resolve("humano", compareNames(st.mode, activePreset, "original"));
  const realista = media.resolve("humano", compareNames(st.mode, activePreset, "realista"));
  const folder = `public/media/humano/padrao-${st.mode === "image" ? "imagem" : "video"}`;

  const setMode = (mode: Mode) => {
    if (mode === st.mode) return;
    setSaved(sanitizeState({ ...st, mode, custom: null }));
    setEditing(false);
  };
  const clear = () => {
    setSaved({ ...INITIAL_STATE, mode: st.mode });
    setEditing(false);
  };
  const copy = async () => {
    if (!text.trim()) return toast("Marque presets ou comandos para montar o prompt.", "error");
    const ok = await copyText(text);
    toast(ok ? "Prompt copiado!" : "Não foi possível copiar. Selecione o texto e use Ctrl+C.", ok ? "ok" : "error");
  };

  return (
    <div className="hm">
      <header className="hm-head">
        <div className="hm-logo" aria-hidden="true">😎</div>
        <div className="hm-title">
          <h1>Humanizar IA</h1>
          <p>Prompts que deixam fotos e vídeos de IA com cara de gravação real</p>
        </div>
        <div className="hm-modes" role="radiogroup" aria-label="Tipo de conteúdo">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={st.mode === m.id} className={st.mode === m.id ? "on" : ""} onClick={() => setMode(m.id)}>
              <m.icon size={16} aria-hidden="true" /> {m.label}
            </button>
          ))}
        </div>
      </header>

      <div className="hm-grid">
        <div className="hm-col">
          <section className="hm-panel" aria-label="Comparação">
            <CompareSlider original={original} realista={realista} hintOriginal={`${folder}-original.jpg`} hintRealista={`${folder}-realista.jpg`} />
          </section>

          <section className="hm-panel" aria-labelledby="hm-prompt-h">
            <div className="hm-row">
              <h2 id="hm-prompt-h" className="hm-h">Seu prompt otimizado <ArrowDown size={15} aria-hidden="true" /></h2>
              <div className="hm-actions">
                <button type="button" className="hm-act" onClick={clear}><Trash2 size={14} aria-hidden="true" /> Limpar</button>
                <button type="button" className="hm-act" onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
                  {editing ? <Check size={14} aria-hidden="true" /> : <Pencil size={14} aria-hidden="true" />} {editing ? "Concluir" : "Editar"}
                </button>
                <button type="button" className="hm-act" onClick={() => void copy()}><Copy size={14} aria-hidden="true" /> Copiar</button>
              </div>
            </div>

            <details className="hm-base">
              <summary>Seu prompt original (opcional)</summary>
              <textarea rows={3} value={st.base} maxLength={2000} placeholder="Cole aqui o prompt da sua imagem ou vídeo. Os realismos marcados são acrescentados depois dele." aria-label="Seu prompt original" onChange={(e) => patch({ base: e.target.value })} />
            </details>

            {editing ? (
              <textarea className="hm-prompt hm-edit" rows={10} value={text} aria-label="Editar prompt" onChange={(e) => patch({ custom: e.target.value })} />
            ) : (
              <div className={`hm-prompt ${text ? "" : "empty"}`} aria-live="polite">
                {text || "Marque presets e comandos para montar o seu prompt."}
              </div>
            )}

            {outdated && (
              <button type="button" className="hm-refresh" onClick={() => patch({ custom: null })}>
                <RefreshCcw size={13} aria-hidden="true" /> Você editou o texto. Atualizar com as seleções
              </button>
            )}
            <p className="hm-note">
              <TriangleAlert size={14} aria-hidden="true" />
              <span>
                Use o prompt no gerador de {st.mode === "image" ? "imagens" : "vídeos"} que preferir (por exemplo, Nano Banana, GPT Image ou Veo). Ao publicar, <b>rotule como conteúdo feito com IA</b>.
              </span>
            </p>
          </section>
        </div>

        <div className="hm-col">
          <section className="hm-panel" aria-labelledby="hm-presets-h">
            <h2 id="hm-presets-h" className="hm-h">Presets realistas <ArrowDown size={15} aria-hidden="true" /></h2>
            <PresetCarousel presets={presetsFor(st.mode)} selected={st.presetIds} onToggle={(id) => patch({ presetIds: toggle(st.presetIds, id) })} />
          </section>

          <section className="hm-panel" aria-labelledby="hm-cmds-h">
            <h2 id="hm-cmds-h" className="hm-h">Comandos para realismo <ArrowDown size={15} aria-hidden="true" /></h2>
            <CommandPicker mode={st.mode} selected={st.commandIds} onToggle={(id) => patch({ commandIds: toggle(st.commandIds, id) })} />
          </section>
        </div>
      </div>
    </div>
  );
}
