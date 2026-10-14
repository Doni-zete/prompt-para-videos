import { useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Loader2, Sparkles } from "lucide-react";
import type { LibraryItem } from "../data/types";
import { useGenerate } from "../hooks/useGenerate";
import type { PreparedImage } from "../lib/gemini";
import { VEO_SYSTEM, checkNarration, findNarrations, veoUserPrompt } from "../lib/veo/briefing";
import { ImageDropzone } from "./ImageDropzone";
import { Modal } from "./Modal";
import { ResultView } from "./ResultView";

interface Props {
  open: boolean;
  /** Card de partida (preenche a ação e o cenário). Pode ser nulo. */
  item: LibraryItem | null;
  onClose: () => void;
}

function NarrationBadge({ text, seconds, label }: { text: string; seconds: number; label?: string }) {
  const c = checkNarration(text, seconds);
  const ok = c.ok && c.banned.length === 0;
  return (
    <p className={`veo-badge ${ok ? "ok" : "warn"}`} role="status">
      {ok ? <CircleCheck size={15} aria-hidden="true" /> : <CircleAlert size={15} aria-hidden="true" />}
      <span>
        {label ?? "Narração"}: <strong>{c.words} palavras</strong> (faixa de {c.min} a {c.max} para {seconds} s).
        {!c.ok && ` Fora da faixa: ${c.words < c.min ? "faltam" : "sobram"} ${c.words < c.min ? c.min - c.words : c.words - c.max}.`}
        {c.banned.length > 0 && ` Palavras proibidas: ${c.banned.join(", ")}.`}
      </span>
    </p>
  );
}

/** Gera os prompts (A, B e C) a partir da FOTO REAL do usuário, seguindo o briefing. Sem foto, não gera. */
export function VeoDialog({ open, item, onClose }: Props) {
  const spec = item?.spec;
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [catalog, setCatalog] = useState(true);
  const [product, setProduct] = useState("");
  const [description, setDescription] = useState("");
  const [measures, setMeasures] = useState("");
  const [seconds, setSeconds] = useState(8);
  const [extra, setExtra] = useState(2);
  const [extraVoice, setExtraVoice] = useState(true);
  const [voice, setVoice] = useState<"female" | "male">("female");
  const [speaking, setSpeaking] = useState<"offscreen" | "onscreen">("offscreen");
  const [action, setAction] = useState("");
  const gen = useGenerate();
  const { reset } = gen;
  const imagesRef = useRef<PreparedImage[]>([]);
  imagesRef.current = images;

  // Ao abrir OU ao fechar, volta ao padrão do card (nada da abertura anterior fica na tela) e libera as prévias da memória.
  useEffect(() => {
    imagesRef.current.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
    setCatalog(true);
    setProduct("");
    setDescription("");
    setMeasures("");
    setSeconds(8);
    setExtra(2);
    setExtraVoice(true);
    setVoice(spec?.voice ?? "female");
    setSpeaking(spec?.speaking ?? "offscreen");
    setAction(spec?.action ?? "");
    reset();
  }, [open, item?.id, spec, reset]);

  const running = gen.state.status === "running";
  const missingPhoto = images.length === 0;

  const submit = () => {
    if (missingPhoto) return;
    void gen.run({
      system: VEO_SYSTEM,
      temperature: 0.6,
      build: async () => ({
        parts: [
          ...images.map((i) => i.part),
          { text: veoUserPrompt({ catalogPhoto: catalog, product, description, measures, seconds, extraClips: extra, extraVoice, voice, speaking, action, scene: spec?.scene ?? "" }) },
        ],
      }),
    });
  };

  const out = gen.state.status === "done" ? gen.state.output : undefined;
  const narrations = findNarrations(out);

  return (
    <Modal open={open} onClose={onClose} title={item ? `Gerar com a minha foto: ${item.title}` : "Gerar com a minha foto"} wide>
      <div className="stack">
        <p className="muted">
          A foto real do produto é o <strong>primeiro quadro</strong> do vídeo (no Flow: “Frames to Video”). O prompt é escrito só com o que a foto mostra.
        </p>

        <div className="field">
          <span className="field-label">Foto real do produto <span className="req">*</span></span>
          <ImageDropzone items={images} onChange={setImages} max={2} hint="Envie a foto que vai ser o primeiro quadro. Sem foto não dá para gerar: o prompt precisa do que ela mostra." />
          {missingPhoto && <p className="field-help" role="note">Envie a foto para liberar o botão.</p>}
        </div>

        <fieldset className="veo-radio">
          <legend>Tipo da foto</legend>
          <label><input type="radio" name="veo-kind" checked={catalog} onChange={() => setCatalog(true)} /> Catálogo (fundo branco): gerar também o Prompt A</label>
          <label><input type="radio" name="veo-kind" checked={!catalog} onChange={() => setCatalog(false)} /> Cena (o produto já está no ambiente)</label>
        </fieldset>

        <div className="veo-grid">
          <div className="field">
            <label htmlFor="veo-product">Nome do produto</label>
            <input id="veo-product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ex.: Arranhador de papelão para gatos" />
          </div>
          <div className="field">
            <label htmlFor="veo-measures">Medidas reais (opcional)</label>
            <input id="veo-measures" value={measures} onChange={(e) => setMeasures(e.target.value)} placeholder="Ex.: 60 x 20 x 8 cm" />
            <p className="field-help">Sem medidas, a IA não estima: usa só a proporção visível e avisa.</p>
          </div>
        </div>

        <div className="field">
          <label htmlFor="veo-desc">Descrição do produto (única fonte da narração)</label>
          <textarea id="veo-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cole a descrição de venda. A narração só usa o que estiver escrito aqui." />
        </div>

        <div className="field">
          <label htmlFor="veo-action">Ideia de ação (a IA adapta ao uso real do produto)</label>
          <textarea id="veo-action" rows={3} value={action} onChange={(e) => setAction(e.target.value)} />
        </div>

        <div className="veo-grid veo-grid-4">
          <div className="field">
            <label htmlFor="veo-sec">Duração da narração</label>
            <select id="veo-sec" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))}>
              <option value={8}>8 s (22 a 26 palavras)</option>
              <option value={5}>4 a 6 s (12 a 18 palavras)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="veo-extra">Clipes extras</label>
            <select id="veo-extra" value={extra} onChange={(e) => setExtra(Number(e.target.value))}>
              {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 0 ? "Nenhum" : n}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="veo-voice">Voz</label>
            <select id="veo-voice" value={voice} onChange={(e) => setVoice(e.target.value as "female" | "male")}>
              <option value="female">Feminina</option>
              <option value="male">Masculina</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="veo-speak">Quem fala</label>
            <select id="veo-speak" value={speaking} onChange={(e) => setSpeaking(e.target.value as "offscreen" | "onscreen")}>
              <option value="offscreen">Voz fora de cena</option>
              <option value="onscreen">A pessoa da foto (lip sync)</option>
            </select>
          </div>
        </div>

        {extra > 0 && (
          <label className="veo-check">
            <input type="checkbox" checked={extraVoice} onChange={(e) => setExtraVoice(e.target.checked)} />
            <span><strong>Cada clipe extra com a sua fala</strong>: continua a história do clipe 1, com o mesmo perfil de voz e a chamada para ação só no último. Desmarque para narrar tudo na edição (CapCut).</span>
          </label>
        )}

        <button type="button" className="btn btn-primary btn-lg" onClick={submit} disabled={missingPhoto || running}>
          {running ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
          {running ? gen.state.message || "Gerando…" : "Gerar prompts"}
        </button>

        {gen.state.status === "error" && <p className="alert alert-error" role="alert">{gen.state.error}</p>}
        {out && (
          <>
            {narrations.length > 0 ? narrations.map((n, i) => <NarrationBadge key={i} text={n} seconds={seconds} label={narrations.length > 1 ? `Fala do clipe ${i + 1}` : "Narração"} />) : <p className="veo-badge warn" role="status"><CircleAlert size={15} aria-hidden="true" /> A resposta não trouxe a seção “Narração”. Gere de novo.</p>}
            <ResultView output={out} model={gen.state.model} filename="prompt-video-veo" onRegenerate={submit} busy={running} />
          </>
        )}
      </div>
    </Modal>
  );
}
