import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, Eraser, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useGemini } from "../context/GeminiContext";
import type { LibraryItem } from "../data/types";
import { useGenerate } from "../hooks/useGenerate";
import { usePersistentState } from "../hooks/usePersistentState";
import type { PreparedImage } from "../lib/gemini";
import {
  EMPTY_FILL, FILL_SYSTEM, SUBJECT_FIELD, buildClip, buildPromptA, buildPromptB, checkNarration, cleanNarration, countWords, fillUserPrompt, missingParts,
  narrationRange, narrationTooLong, needsRealUse, parseFill, type PromptFill, type VideoSpec,
} from "../lib/veo/briefing";
import { CopyButton } from "./CopyButton";
import { ImageDropzone } from "./ImageDropzone";
import { Modal } from "./Modal";
import { PromptText } from "./PromptText";
import { SUBJECT_CHIP } from "../data/subjectChip";

interface FormState extends PromptFill {
  seconds: number;
  voice: "female" | "male";
  speaking: "offscreen" | "onscreen";
  /** Dados do produto, usados pela IA. */
  product: string;
  description: string;
  measures: string;
  /** Ação adaptada ao produto pela IA (substitui a do card). */
  actionEn: string;
  actionPt: string;
  clipsEn: string[];
  clipsPt: string[];
  /** Cada clipe extra tem a sua fala (true) ou fica sem fala, para narrar na edição (false). */
  clipVoice: boolean;
  clipNarr: string[];
  aiNotes: string[];
}

const defaults = (card: VideoSpec): FormState => ({
  ...EMPTY_FILL, seconds: 8, voice: card.voice, speaking: card.speaking,
  product: "", description: "", measures: "", actionEn: "", actionPt: "", clipsEn: [], clipsPt: [], clipVoice: true, clipNarr: [], aiNotes: [],
});

type Tab = "video" | "clips" | "scene";

function Field({ id, label, help, note, children }: { id: string; label: string; help: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="ws-field">
      <label htmlFor={id}>{label}</label>
      <p className="ws-help">{help}</p>
      {children}
      {note && <p className="ws-note" role="status"><CircleAlert size={14} aria-hidden="true" /> {note}</p>}
    </div>
  );
}

const SHEET_RE = /\b(?:peso|altura|largura|profundidade|espessura)\s*(?:\(.*?\))?\s*:|\bkg\b/i;

function Body({ item }: { item: LibraryItem }) {
  const card = item.spec as VideoSpec;
  const [saved, setSaved] = usePersistentState<Partial<FormState>>(`veoform:${item.id}`, {});
  const form: FormState = { ...defaults(card), ...saved };
  const set = (patch: Partial<FormState>) => setSaved((prev) => ({ ...prev, ...patch }));
  const [tab, setTab] = useState<Tab>("video");
  const [images, setImages] = useState<PreparedImage[]>([]);
  const { status } = useGemini();
  const connected = status === "connected";
  const gen = useGenerate();

  // A resposta da IA preenche os campos (só os que ela conseguiu preencher) e adapta a ação ao produto.
  useEffect(() => {
    if (gen.state.status !== "done" || !gen.state.output) return;
    const f = parseFill(gen.state.output);
    const clips = ([[f.clip2, f.clip2Pt, f.narration2], [f.clip3, f.clip3Pt, f.narration3]] as const).filter(([en]) => !!en);
    setSaved((prev) => ({
      ...prev,
      ...(f.visual ? { visual: f.visual } : {}),
      ...(f.scale ? { scale: f.scale } : {}),
      ...(f.subject ? { subject: f.subject } : {}),
      ...(f.narration ? { narration: f.narration } : {}),
      ...(f.action ? { actionEn: f.action, actionPt: f.actionPt ?? "", realUse: "" } : {}),
      ...(clips.length ? { clipsEn: clips.map(([en]) => en as string), clipsPt: clips.map(([, pt]) => pt ?? "A IA adaptou esta ação ao seu produto."), clipNarr: clips.map(([, , n]) => n ?? "") } : {}),
      aiNotes: f.alerts,
    }));
  }, [gen.state.status, gen.state.output, setSaved]);

  const running = gen.state.status === "running";
  const runAi = () =>
    void gen.run({
      system: FILL_SYSTEM,
      temperature: 0.5,
      build: async () => ({
        parts: [
          ...images.map((i) => i.part),
          { text: fillUserPrompt({ title: item.title, subject: card.subject, action: card.action, scene: card.scene, product: form.product, description: form.description, measures: form.measures, seconds: form.seconds, hasPhoto: images.length > 0, extraClips: form.clipVoice ? card.variants.length : 0 }) },
        ],
      }),
    });

  const adapted = !!form.actionEn;
  const spec: VideoSpec = {
    ...card,
    voice: form.voice,
    speaking: form.speaking,
    action: form.actionEn || card.action,
    variants: form.clipsEn.length ? form.clipsEn : card.variants,
    variantsPt: form.clipsEn.length ? form.clipsPt : card.variantsPt,
  };
  const prompt = buildPromptB(spec, form, form.seconds);
  const range = narrationRange(form.seconds);
  const narr = cleanNarration(form.narration);
  const narrLong = !!narr && narrationTooLong(narr, form.seconds);
  const nc = narr ? checkNarration(narr, form.seconds) : null;
  const clips = spec.variants.map((_, i) => buildClip(spec, i, form, form.clipVoice ? { narration: form.clipNarr[i] ?? "", seconds: form.seconds } : undefined));
  const usable = (t: string) => {
    const c = cleanNarration(t);
    return c && !narrationTooLong(c, form.seconds) ? c : "";
  };
  const script = [{ n: 1, text: narr && !narrLong ? narr : "" }, ...spec.variants.map((_, i) => ({ n: i + 2, text: usable(form.clipNarr[i] ?? "") }))].filter((e) => e.text);
  const scriptText = script.map((e) => `Clipe ${e.n}: ${e.text}`).join("\n\n");
  const scriptWords = script.reduce((a, e) => a + countWords(e.text), 0);
  const clipMissing = form.clipVoice ? spec.variants.filter((_, i) => !usable(form.clipNarr[i] ?? "")).length : 0;
  const setClipNarr = (i: number, text: string) => {
    const arr = [...form.clipNarr];
    while (arr.length <= i) arr.push("");
    arr[i] = text;
    set({ clipNarr: arr });
  };
  const narrMessage = (text: string): { cls: string; msg: string } => {
    const c = cleanNarration(text);
    if (!c) return { cls: "", msg: `Ideal: ${range.min} a ${range.max} palavras para ${form.seconds >= 7 ? "8 s" : "4 a 6 s"}.` };
    if (narrationTooLong(c, form.seconds)) return { cls: "warn", msg: `Isso é uma ficha técnica, não uma fala (${countWords(c)} palavras). Ela não entra no prompt.` };
    const k = checkNarration(c, form.seconds);
    const rest = k.ok ? "" : k.words < range.min ? ` Faltam ${range.min - k.words}.` : ` Sobram ${k.words - range.max}.`;
    return { cls: k.ok && k.banned.length === 0 ? "ok" : "warn", msg: `${k.words} palavras. O ideal é de ${range.min} a ${range.max}.${rest}${k.banned.length ? ` Evite: ${k.banned.join(", ")}.` : ""}` };
  };
  const scene = buildPromptA(spec, form);
  const missing = missingParts(prompt);
  const hasSubject = spec.subject !== "none";
  const askUse = needsRealUse(spec.action);
  const visualSheet = form.visual.length > 350 || SHEET_RE.test(form.visual);

  const required = [
    { ok: !!form.visual.trim(), name: "o que a foto mostra" },
    { ok: !!form.scale.trim(), name: "o tamanho" },
    ...(hasSubject ? [{ ok: !!form.subject.trim(), name: "quem aparece" }] : []),
    ...(askUse ? [{ ok: !!form.realUse.trim(), name: "como se usa" }] : []),
    { ok: !!narr && !narrLong, name: narrLong ? "a narração (a colada é longa demais)" : "a narração" },
  ];
  const done = required.filter((r) => r.ok).length;
  const subjectField = hasSubject ? SUBJECT_FIELD[spec.subject as Exclude<typeof spec.subject, "none">] : null;
  const seconds = form.seconds >= 7 ? "8 s" : "4 a 6 s";

  return (
    <div className="ws">
      <div className="ws-left">
        <section aria-label="O que acontece neste vídeo">
          <div className="vcard-chips">
            <span className="chip">{SUBJECT_CHIP[spec.subject]}</span>
            <span className="chip">{form.speaking === "onscreen" ? "A pessoa fala" : "Voz fora de cena"}</span>
            {adapted && <span className="chip chip-ai">Adaptado ao seu produto pela IA</span>}
          </div>
          <h3 className="ws-h">O que acontece neste vídeo</h3>
          <p className="ws-resumo">{form.actionPt || card.resumo}</p>
          {adapted && (
            <button type="button" className="btn btn-quiet" onClick={() => set({ actionEn: "", actionPt: "", clipsEn: [], clipsPt: [], clipNarr: [] })}>
              <RotateCcw size={14} /> Voltar à ação do card
            </button>
          )}
        </section>

        <section className="ws-steps" aria-label="Como usar">
          <h3 className="ws-h">Como usar (3 passos)</h3>
          <ol>
            <li>No <strong>Flow</strong>, escolha <strong>“Frames to Video”</strong> e suba a <strong>foto real do seu produto</strong> (ela vira o primeiro quadro do vídeo).</li>
            <li>Aqui, <strong>envie a foto e cole a descrição</strong> do produto: a IA preenche os campos. Revise e ajuste.</li>
            <li><strong>Copie o “Prompt do vídeo”</strong> e cole no Flow. Gere 3 ou 4 vezes e escolha a versão em que o produto está igual à foto.</li>
          </ol>
        </section>

        <section className="ws-ai" aria-label="A IA preenche para você">
          <h3 className="ws-h">Passo 1: a IA preenche para você</h3>
          <p className="ws-help">Envie a foto e cole o título e a descrição do produto (pode ser a ficha técnica inteira). A IA escolhe só o que importa: cria a <strong>narração curta</strong>, tira o <strong>tamanho</strong> das medidas, descreve <strong>o que a foto mostra</strong> e <strong>adapta a ação ao seu produto</strong>.</p>
          <ImageDropzone items={images} onChange={setImages} max={2} hint="A foto do produto (recomendado). Sem foto, a IA não descreve o que aparece nela." />
          <div className="ws-field">
            <label htmlFor="ws-ai-product">Título do produto</label>
            <input id="ws-ai-product" value={form.product} placeholder="Ex.: Cômoda Paris 2 Portas 4 Gavetas Preto Fosco" onChange={(e) => set({ product: e.target.value })} />
          </div>
          <div className="ws-field">
            <label htmlFor="ws-ai-desc">Descrição ou ficha técnica</label>
            <textarea id="ws-ai-desc" rows={5} value={form.description} placeholder="Cole aqui a descrição de venda. Pode ser longa: a IA resume." onChange={(e) => set({ description: e.target.value })} />
          </div>
          <div className="ws-field">
            <label htmlFor="ws-ai-measures">Medidas reais (opcional)</label>
            <input id="ws-ai-measures" value={form.measures} placeholder="Ex.: 114 x 90 x 35 cm (se já estiverem na descrição, pode deixar vazio)" onChange={(e) => set({ measures: e.target.value })} />
          </div>
          <button type="button" className="btn btn-primary btn-lg" onClick={runAi} disabled={!connected || running || !form.description.trim()} title={connected ? "A IA preenche os campos abaixo" : "Conecte o Gemini em Configurações"}>
            {running ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} {running ? gen.state.message || "Preenchendo…" : "Preencher tudo com IA"}
          </button>
          {!connected && <p className="ws-help">Conecte o Gemini em Configurações para usar a IA. Você também pode escrever os campos abaixo.</p>}
          {connected && !form.description.trim() && <p className="ws-help">Cole a descrição do produto para liberar o botão.</p>}
          {gen.state.status === "error" && <p className="alert alert-error" role="alert">{gen.state.error}</p>}
          {form.aiNotes.length > 0 && (
            <div className="ws-ainotes" role="status">
              <strong><CircleAlert size={14} aria-hidden="true" /> Avisos da IA</strong>
              <ul>{form.aiNotes.map((n) => <li key={n}>{n}</li>)}</ul>
            </div>
          )}
        </section>

        <section className="ws-form" aria-label="Campos">
          <h3 className="ws-h">Passo 2: revise os campos (você pode editar)</h3>
          <div className={`ws-progress ${done === required.length ? "done" : ""}`} role="status">
            {done === required.length ? <CircleCheck size={16} aria-hidden="true" /> : <CircleAlert size={16} aria-hidden="true" />}
            <span>{done === required.length ? "Tudo preenchido: é só copiar." : `Preenchido ${done} de ${required.length}. Falta: ${required.filter((r) => !r.ok).map((r) => r.name).join(", ")}.`}</span>
          </div>
          <p className="ws-hint">Pode escrever em português. O restante do prompt está em inglês, como o formato pede; se puder, escreva estes campos em inglês simples. A narração fica sempre em português.</p>

          <Field id="ws-visual" label="O que aparece na foto do produto" help="Só o que você VÊ: formato, cores, materiais e detalhes, em 1 ou 2 frases. Não é para colar título, descrição nem ficha técnica." note={visualSheet ? "Parece uma ficha técnica (tem peso, medidas ou texto longo). Aqui vai só o que se vê na foto. Tamanho e peso vão no campo seguinte; ou deixe a IA resumir no Passo 1." : undefined}>
            <textarea id="ws-visual" rows={3} value={form.visual} placeholder="Ex.: cômoda preta fosca com duas portas e quatro gavetas, puxadores pequenos" onChange={(e) => set({ visual: e.target.value })} />
          </Field>

          <Field id="ws-scale" label="Tamanho do produto" help="Compare com algo que aparece na foto (a mão, o animal, o chão) ou escreva as medidas reais. Se não souber, deixe vazio: não chute.">
            <input id="ws-scale" value={form.scale} placeholder="Ex.: cabe na palma da mão  /  114 cm de altura, 90 cm de largura" onChange={(e) => set({ scale: e.target.value })} />
          </Field>

          {subjectField && (
            <Field id="ws-subject" label={subjectField.label} help="Descreva pelos traços que dá para ver. Isso impede o vídeo de trocar ou acrescentar alguém.">
              <input id="ws-subject" value={form.subject} placeholder={subjectField.example} onChange={(e) => set({ subject: e.target.value })} />
            </Field>
          )}

          {askUse && (
            <Field id="ws-use" label="Como o produto é usado de verdade" help="O gesto mais simples e seguro que a pessoa faz com ele. Em inglês, com um verbo no gerúndio, fica melhor.">
              <input id="ws-use" value={form.realUse} placeholder="Ex.: pressing the power button  (apertando o botão de ligar)" onChange={(e) => set({ realUse: e.target.value })} />
            </Field>
          )}

          <Field id="ws-narr" label="Narração (a fala do vídeo, em português)" help="Uma fala curta sobre o produto, sem narrar o que aparece na tela e sem listar especificações. Use só o que está na descrição de venda.">
            <textarea id="ws-narr" rows={4} value={form.narration} placeholder="Ex.: Quer organizar o quarto sem gastar muito? Essa cômoda tem quatro gavetas e duas portas, e o acabamento fosco combina com tudo!" onChange={(e) => set({ narration: e.target.value })} />
            <p className={`ws-count ${narrLong ? "warn" : nc ? (nc.ok && nc.banned.length === 0 ? "ok" : "warn") : ""}`} role="status">
              {narrLong
                ? `Isso é uma ficha técnica, não uma fala: tem ${nc?.words} palavras e o ideal é de ${range.min} a ${range.max}. Ela não entra no prompt. Deixe a IA criar uma fala curta no Passo 1.`
                : nc
                  ? `${nc.words} palavras. O ideal é de ${range.min} a ${range.max} para ${seconds}.${nc.ok ? "" : nc.words < range.min ? ` Faltam ${range.min - nc.words}.` : ` Sobram ${nc.words - range.max}.`}${nc.banned.length ? ` Evite: ${nc.banned.join(", ")}.` : ""}`
                  : `Ideal: ${range.min} a ${range.max} palavras para ${seconds}.`}
            </p>
          </Field>

          <div className="ws-row">
            <div className="ws-field">
              <label htmlFor="ws-sec">Duração da fala</label>
              <select id="ws-sec" value={form.seconds} onChange={(e) => set({ seconds: Number(e.target.value) })}>
                <option value={8}>8 segundos</option>
                <option value={5}>4 a 6 segundos</option>
              </select>
            </div>
            <div className="ws-field">
              <label htmlFor="ws-voice">Voz</label>
              <select id="ws-voice" value={form.voice} onChange={(e) => set({ voice: e.target.value as FormState["voice"] })}>
                <option value="female">Feminina</option>
                <option value="male">Masculina</option>
              </select>
            </div>
            <div className="ws-field">
              <label htmlFor="ws-speak">Quem fala</label>
              <select id="ws-speak" value={form.speaking} onChange={(e) => set({ speaking: e.target.value as FormState["speaking"] })}>
                <option value="offscreen">Voz fora de cena</option>
                <option value="onscreen">A pessoa da foto</option>
              </select>
            </div>
          </div>

          <button type="button" className="btn btn-quiet" onClick={() => setSaved({})}>
            <Eraser size={14} /> Limpar tudo
          </button>
        </section>
      </div>

      <div className="ws-right">
        <div className="ws-tabs" role="tablist" aria-label="Prompts prontos">
          {(
            [
              ["video", "Prompt do vídeo"],
              ["clips", `Clipes extras (${clips.length})`],
              ["scene", "Foto da cena (opcional)"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {tab === "video" && (
          <section role="tabpanel" aria-label="Prompt do vídeo" className="ws-panel">
            <div className="ws-panel-head">
              <div>
                <h3>Prompt do vídeo</h3>
                <p>Este é o texto que você <strong>cola no Flow</strong>, em “Frames to Video”, com a foto do produto já enviada. É ele que cria o vídeo.</p>
              </div>
              <CopyButton text={prompt} label="Copiar prompt do vídeo" variant="primary" />
            </div>
            {missing.length > 0 ? (
              <p className="ws-warn" role="status"><CircleAlert size={15} aria-hidden="true" /> Ainda faltam {missing.length} {missing.length === 1 ? "trecho" : "trechos"} (destacados em amarelo). Use o Passo 1 (IA) ou preencha os campos ao lado.</p>
            ) : (
              <p className="ws-ok" role="status"><CircleCheck size={15} aria-hidden="true" /> Prompt completo: é só copiar e colar no Flow.</p>
            )}
            <PromptText text={prompt} />
          </section>
        )}

        {tab === "clips" && (
          <section role="tabpanel" aria-label="Clipes extras" className="ws-panel">
            <div className="ws-panel-head">
              <div>
                <h3>Clipes extras</h3>
                <p>Cada clipe é um <strong>vídeo de {form.seconds >= 7 ? "8 segundos" : "4 a 6 segundos"} separado</strong>, gerado com a <strong>mesma foto</strong> (só a ação muda). Use para montar uma sequência (clipe 1, 2, 3) ou para ter cortes rápidos no CapCut, em pedaços de 1 a 1,5 s.</p>
              </div>
            </div>

            <fieldset className="ws-voicemode">
              <legend>Fala dos clipes extras</legend>
              <label>
                <input type="radio" name="clip-voice" checked={form.clipVoice} onChange={() => set({ clipVoice: true })} />
                <span><strong>Cada clipe com a sua fala</strong>: continua a história do clipe 1. O perfil de voz vai repetido igual em todos.</span>
              </label>
              <label>
                <input type="radio" name="clip-voice" checked={!form.clipVoice} onChange={() => set({ clipVoice: false })} />
                <span><strong>Sem fala</strong>: eu coloco a narração na edição (CapCut).</span>
              </label>
              {form.clipVoice && <p className="ws-help">Como cada clipe é gerado separado, a voz pode variar um pouco de um para outro. Se isso incomodar, use “Sem fala” e narre tudo de uma vez na edição.</p>}
            </fieldset>

            {form.clipVoice && clipMissing > 0 && (
              <p className="ws-warn" role="status"><CircleAlert size={15} aria-hidden="true" /> Falta a fala de {clipMissing} {clipMissing === 1 ? "clipe" : "clipes"}. Use o Passo 1 (IA) ou escreva abaixo. A chamada para ação vai só no último clipe.</p>
            )}

            {form.clipVoice && script.length >= 2 && (
              <div className="ws-script">
                <div>
                  <h4>Roteiro completo da sequência</h4>
                  <p>Todas as falas em ordem ({script.length} clipes, {scriptWords} palavras). Serve para conferir a história e para legendar no CapCut.</p>
                  <ol>
                    {script.map((e) => (
                      <li key={e.n}><strong>Clipe {e.n}:</strong> {e.text}</li>
                    ))}
                  </ol>
                </div>
                <CopyButton text={scriptText} label="Copiar roteiro completo" variant="primary" />
              </div>
            )}

            {clips.map((text, i) => {
              const nm = narrMessage(form.clipNarr[i] ?? "");
              return (
                <article className="ws-clip" key={i}>
                  <header>
                    <div>
                      <strong>Clipe {i + 2}</strong>
                      <span>{spec.variantsPt?.[i]}</span>
                    </div>
                    <CopyButton text={text} label={`Copiar clipe ${i + 2}`} variant="primary" />
                  </header>
                  {form.clipVoice && (
                    <div className="ws-field">
                      <label htmlFor={`ws-clipnarr-${i}`}>Fala do clipe {i + 2} (em português)</label>
                      <textarea id={`ws-clipnarr-${i}`} rows={3} value={form.clipNarr[i] ?? ""} placeholder="Continue a história do clipe anterior com outro benefício. A chamada para ação vai só no último clipe." onChange={(e) => setClipNarr(i, e.target.value)} />
                      <p className={`ws-count ${nm.cls}`} role="status">{nm.msg}</p>
                    </div>
                  )}
                  <PromptText text={text} />
                </article>
              );
            })}
          </section>
        )}

        {tab === "scene" && (
          <section role="tabpanel" aria-label="Foto da cena" className="ws-panel">
            <div className="ws-panel-head">
              <div>
                <h3>Foto da cena (só se a sua foto for de catálogo)</h3>
                <p>Se a foto do produto tem <strong>fundo branco</strong>, use este texto num gerador de imagens, junto com a foto do produto, para criar a foto dele no ambiente. Confira se o produto ficou <strong>idêntico</strong> e use essa nova foto como primeiro quadro no Flow. Se a sua foto já mostra o produto em uso, pule este passo.</p>
              </div>
              <CopyButton text={scene} label="Copiar prompt da foto" variant="primary" />
            </div>
            <PromptText text={scene} />
          </section>
        )}
      </div>
    </div>
  );
}

interface Props {
  item: LibraryItem | null;
  onClose: () => void;
}

/** Área de trabalho de um card de vídeo: a IA preenche a partir da foto e da descrição; campos em português; prompts prontos. */
export function VideoWorkspace({ item, onClose }: Props) {
  return (
    <Modal open={!!item} onClose={onClose} title={item ? `Montar prompt: ${item.title}` : "Montar prompt"} full>
      {item && <Body key={item.id} item={item} />}
    </Modal>
  );
}
