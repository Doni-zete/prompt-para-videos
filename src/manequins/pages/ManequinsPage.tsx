import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, Eraser, Loader2, Sparkles } from "lucide-react";
import { AutoTextarea } from "../../components/AutoTextarea";
import { CopyButton } from "../../components/CopyButton";
import { PageHeader } from "../../components/PageHeader";
import { PromptText } from "../../components/PromptText";
import { useGemini } from "../../context/GeminiContext";
import { useGenerate } from "../../hooks/useGenerate";
import { usePersistentState } from "../../hooks/usePersistentState";
import { checkNarration, cleanNarration, countWords, narrationRange, narrationTooLong } from "../../lib/veo/briefing";
import { GARMENTS, TONES, defaultScene, getGarment } from "../data/garments";
import { MANNEQUIN_VIDEOS, type MannequinVideo } from "../data/videos";
import {
  DEFAULT_CONFIG, NARRATIONS_SYSTEM, buildImagePrompt, buildVideoPrompt, narrationFor, narrationsUserPrompt, parseNarrations, summaryFor, type MqConfig,
} from "../lib/prompts";
import "../manequins.css";

interface MqState extends MqConfig {
  /** Falas que o usuário escreveu ou que a IA gerou (por id de vídeo). */
  narr: Record<string, string>;
  notes: string[];
}

const DEFAULTS: MqState = { ...DEFAULT_CONFIG, narr: {}, notes: [] };
type Tab = "front" | "back" | "all";

const STEPS = [
  <><strong>Vista o manequim com a sua peça:</strong> use o prompt de imagem do Passo 2 (frente e costas) num gerador de imagens, com a foto da sua peça. O resultado é o manequim usando a SUA roupa.</>,
  <>No <strong>Flow</strong>, escolha <strong>“Frames to Video”</strong> e suba a foto do manequim: a de <strong>frente</strong> para os vídeos de frente e a de <strong>costas</strong> para os de costas.</>,
  <>Escolha um dos <strong>10 vídeos</strong> (5 de frente e 5 de costas, cada um com um movimento diferente), copie o prompt e cole no Flow.</>,
  <>A <strong>fala</strong> (22 a 26 palavras) tem um espaço separado em cada vídeo. Ela entra no fim do prompt para a voz falar no vídeo; se preferir narrar na edição, desligue essa opção.</>,
];

export default function ManequinsPage() {
  const [saved, setSaved] = usePersistentState<Partial<MqState>>("manequins:v1", {});
  const st: MqState = { ...DEFAULTS, ...saved };
  const set = (patch: Partial<MqState>) => setSaved((prev) => ({ ...prev, ...patch }));
  const [tab, setTab] = useState<Tab>("front");
  const { status } = useGemini();
  const connected = status === "connected";
  const gen = useGenerate();
  const garment = getGarment(st.garment);

  useEffect(() => {
    if (gen.state.status !== "done" || !gen.state.output) return;
    const r = parseNarrations(gen.state.output);
    setSaved((prev) => ({ ...prev, narr: { ...(prev.narr ?? {}), ...r.byId }, notes: r.alerts }));
  }, [gen.state.status, gen.state.output, setSaved]);

  const running = gen.state.status === "running";
  const runAi = () => void gen.run({ system: NARRATIONS_SYSTEM, temperature: 0.8, build: async () => ({ parts: [{ text: narrationsUserPrompt(st) }] }) });

  const range = narrationRange(8);
  const narrOf = (v: MannequinVideo) => narrationFor(v, st, st.narr);
  const outOfRange = MANNEQUIN_VIDEOS.filter((v) => {
    const t = cleanNarration(narrOf(v));
    return t && !checkNarration(t, 8).ok;
  }).length;
  const empty = MANNEQUIN_VIDEOS.filter((v) => !cleanNarration(narrOf(v))).length;

  const narrMessage = (text: string) => {
    const c = cleanNarration(text);
    if (!c) return { cls: "", msg: `Ideal: ${range.min} a ${range.max} palavras para 8 s.` };
    if (narrationTooLong(c, 8)) return { cls: "warn", msg: `Isso é uma ficha técnica, não uma fala (${countWords(c)} palavras). Ela não entra no prompt.` };
    const k = checkNarration(c, 8);
    const rest = k.ok ? "" : k.words < range.min ? ` Faltam ${range.min - k.words}.` : ` Sobram ${k.words - range.max}.`;
    return { cls: k.ok && k.banned.length === 0 ? "ok" : "warn", msg: `${k.words} palavras. O ideal é de ${range.min} a ${range.max}.${rest}${k.banned.length ? ` Evite: ${k.banned.join(", ")}.` : ""}` };
  };

  const shown = MANNEQUIN_VIDEOS.filter((v) => tab === "all" || v.side === tab);
  const setGender = (gender: "female" | "male") => set({ gender, hand: gender === "female" ? "feminine" : "masculine", voice: gender });

  return (
    <div className="page mq">
      <PageHeader title="Manequins" subtitle="Vídeos de roupa em manequim: 5 de frente e 5 de costas, com a peça 100% igual à foto" />

      <section className="vguide" aria-labelledby="mq-guide-h">
        <header className="vguide-head">
          <div>
            <h2 id="mq-guide-h">Como funciona (leia em 30 segundos)</h2>
            <p>Cada vídeo é um movimento diferente de câmera e mão sobre um <strong>manequim parado</strong> usando a sua roupa. O texto (prompt) serve para o <strong>Flow (Google Veo)</strong> criar o vídeo a partir da <strong>foto do manequim</strong>, e a roupa não muda porque a foto é o primeiro quadro.</p>
          </div>
        </header>
        <ol className="vguide-steps">{STEPS.map((s, i) => <li key={i}>{s}</li>)}</ol>
        <details className="vguide-check">
          <summary>Entenda os termos</summary>
          <dl className="vguide-terms">
            {[
              ["Flow / Veo", "A ferramenta do Google que transforma a foto em vídeo."],
              ["Frames to Video", "A opção do Flow em que a foto vira o PRIMEIRO QUADRO do vídeo."],
              ["Trocar a roupa", "Escolher a sua peça no Passo 1: os 10 prompts passam a falar dela (calça, blusa, conjunto…)."],
              ["Fala", "A narração em português, em um espaço separado em cada vídeo, com contador de palavras."],
            ].map(([t, d]) => (
              <div key={t}><dt>{t}</dt><dd>{d}</dd></div>
            ))}
          </dl>
        </details>
      </section>

      <section className="mq-panel" aria-labelledby="mq-p1">
        <h2 id="mq-p1" className="mq-h">Passo 1: a sua peça e o manequim</h2>
        <div className="mq-fields">
          <div className="ws-field">
            <label htmlFor="mq-garment">Tipo de peça</label>
            <p className="ws-help">Troque aqui e todos os prompts passam a falar da sua peça.</p>
            <select id="mq-garment" value={st.garment} onChange={(e) => set({ garment: e.target.value as MqConfig["garment"] })}>
              {GARMENTS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
          <div className="ws-field">
            <label htmlFor="mq-name">Nome da peça (opcional)</label>
            <p className="ws-help">Ajuda a IA a escrever as falas.</p>
            <input id="mq-name" value={st.name} placeholder="Ex.: Vestido midi floral" onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="ws-field">
            <label htmlFor="mq-gender">Manequim</label>
            <p className="ws-help">Sempre sem rosto e parado.</p>
            <select id="mq-gender" value={st.gender} onChange={(e) => setGender(e.target.value as "female" | "male")}>
              <option value="female">Feminino</option>
              <option value="male">Masculino</option>
            </select>
          </div>
          <div className="ws-field">
            <label htmlFor="mq-tone">Tom do manequim</label>
            <p className="ws-help">Cor fosca do manequim.</p>
            <select id="mq-tone" value={st.tone} onChange={(e) => set({ tone: e.target.value as MqConfig["tone"] })}>
              {TONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="ws-field">
            <label htmlFor="mq-hand">Mão que aparece</label>
            <p className="ws-help">Quem toca o tecido nos vídeos.</p>
            <select id="mq-hand" value={st.hand} onChange={(e) => set({ hand: e.target.value as MqConfig["hand"] })}>
              <option value="feminine">Feminina</option>
              <option value="masculine">Masculina</option>
            </select>
          </div>
          <div className="ws-field">
            <label htmlFor="mq-voice">Voz da fala</label>
            <p className="ws-help">Voz em português do Brasil.</p>
            <select id="mq-voice" value={st.voice} onChange={(e) => set({ voice: e.target.value as MqConfig["voice"] })}>
              <option value="female">Feminina</option>
              <option value="male">Masculina</option>
            </select>
          </div>
          <div className="ws-field mq-wide">
            <label htmlFor="mq-scene">Cenário (em inglês)</label>
            <p className="ws-help">Deixe vazio para usar o padrão de boutique.</p>
            <textarea id="mq-scene" rows={2} value={st.scene} placeholder={defaultScene(st.gender)} onChange={(e) => set({ scene: e.target.value })} />
          </div>
          <div className="ws-field mq-wide">
            <label htmlFor="mq-desc">Descrição ou ficha técnica da peça</label>
            <p className="ws-help">Usada só pela IA para escrever as 10 falas. Pode ser longa: ela escolhe o que importa.</p>
            <textarea id="mq-desc" rows={4} value={st.description} placeholder="Cole aqui a descrição de venda da peça." onChange={(e) => set({ description: e.target.value })} />
          </div>
        </div>

        <label className="veo-check">
          <input type="checkbox" checked={st.withNarration} onChange={(e) => set({ withNarration: e.target.checked })} />
          <span><strong>Colocar a fala dentro do prompt</strong> (a voz fala no vídeo). Desmarque para narrar tudo na edição.</span>
        </label>

        <div className="mq-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={runAi} disabled={!connected || running || !st.description.trim()} title={connected ? "A IA escreve as 10 falas" : "Conecte o Gemini em Configurações"}>
            {running ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} {running ? gen.state.message || "Escrevendo…" : "Gerar as 10 falas com IA"}
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setSaved({})}><Eraser size={14} /> Voltar aos padrões</button>
        </div>
        {!connected && <p className="ws-help">Conecte o Gemini em Configurações para a IA escrever as falas. Você também pode escrevê-las à mão em cada vídeo.</p>}
        {connected && !st.description.trim() && <p className="ws-help">Cole a descrição da peça para liberar o botão.</p>}
        {gen.state.status === "error" && <p className="alert alert-error" role="alert">{gen.state.error}</p>}
        {st.notes.length > 0 && (
          <div className="ws-ainotes" role="status">
            <strong><CircleAlert size={14} aria-hidden="true" /> Avisos da IA</strong>
            <ul>{st.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        )}
      </section>

      <section className="mq-panel" aria-labelledby="mq-p2">
        <h2 id="mq-p2" className="mq-h">Passo 2: vista o manequim com a sua peça</h2>
        <p className="mq-lede">Para <strong>trocar a roupa</strong>: cole cada texto abaixo num <strong>gerador de imagens</strong>, anexando a foto da sua peça (a da <strong>frente</strong> no primeiro, a das <strong>costas</strong> no segundo). Confira se a peça ficou <strong>idêntica</strong>. Essas fotos do manequim são o primeiro quadro dos vídeos no Flow.</p>
        <div className="mq-imgs">
          {(["front", "back"] as const).map((side) => {
            const text = buildImagePrompt(side, st);
            return (
              <article className="mq-img" key={side}>
                <header>
                  <div>
                    <h3>{side === "front" ? "Foto do manequim de frente" : "Foto do manequim de costas"}</h3>
                    <p>Anexe a foto {side === "front" ? "da frente" : "das costas"} d{garment.pt === "calça" || garment.pt === "saia" || garment.pt === "blusa" || garment.pt === "jaqueta" ? "a" : "o"} {garment.pt}.</p>
                  </div>
                  <CopyButton text={text} label={side === "front" ? "Copiar prompt da frente" : "Copiar prompt das costas"} variant="primary" />
                </header>
                <PromptText text={text} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="mq-panel" aria-labelledby="mq-p3">
        <h2 id="mq-p3" className="mq-h">Passo 3: escolha o vídeo</h2>
        <div className="mq-tabs" role="tablist" aria-label="Lado do manequim">
          {([["front", "De frente (5)"], ["back", "De costas (5)"], ["all", "Todos (10)"]] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        {(outOfRange > 0 || empty > 0) && (
          <p className="ws-warn" role="status">
            <CircleAlert size={15} aria-hidden="true" />
            <span>
              {empty > 0 && `${empty} ${empty === 1 ? "vídeo está" : "vídeos estão"} sem fala. `}
              {outOfRange > 0 && `${outOfRange} ${outOfRange === 1 ? "fala está" : "falas estão"} fora de ${range.min} a ${range.max} palavras ou com palavras a evitar. `}
              Use “Gerar as 10 falas com IA” no Passo 1 ou ajuste à mão em cada vídeo.
            </span>
          </p>
        )}
        {outOfRange === 0 && empty === 0 && (
          <p className="ws-ok" role="status"><CircleCheck size={15} aria-hidden="true" /> As 10 falas estão dentro de {range.min} a {range.max} palavras.</p>
        )}
        <div className="mq-grid">
          {shown.map((v) => {
            const narr = narrOf(v);
            const prompt = buildVideoPrompt(v, st, narr);
            const nm = narrMessage(narr);
            const edited = v.id in st.narr;
            return (
              <article className="mq-card" key={v.id} aria-label={`Vídeo ${v.n}`}>
                <header>
                  <span className="mq-n">Vídeo {v.n}</span>
                  <span className="chip">{v.side === "front" ? "De frente" : "De costas"}</span>
                </header>
                <h3>{v.title}</h3>
                <p className="vcard-label">O que acontece</p>
                <p className="mq-sum">{summaryFor(v, st)}</p>

                <div className="ws-field">
                  <label htmlFor={`mq-narr-${v.id}`}>Fala do vídeo {v.n} (em português)</label>
                  <AutoTextarea id={`mq-narr-${v.id}`} value={narr} placeholder="Escreva a fala (22 a 26 palavras) ou use “Gerar as 10 falas com IA”." onChange={(e) => set({ narr: { ...st.narr, [v.id]: e.target.value } })} />
                  <p className={`ws-count ${nm.cls}`} role="status">{nm.msg}</p>
                  {edited && st.garment === "vestido" && (
                    <button type="button" className="btn btn-quiet" onClick={() => { const n = { ...st.narr }; delete n[v.id]; set({ narr: n }); }}>Restaurar a fala do modelo</button>
                  )}
                </div>

                <div className="mq-prompt">
                  <h4>Prompt do vídeo</h4>
                  <PromptText text={prompt} />
                </div>
                <div className="mq-card-actions">
                  <CopyButton text={prompt} label={`Copiar prompt do vídeo ${v.n}`} variant="primary" />
                  <CopyButton text={cleanNarration(narr)} label={`Copiar só a fala ${v.n}`} disabled={!cleanNarration(narr)} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
