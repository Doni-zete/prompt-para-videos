import { useMemo, useState } from "react";
import { Eraser, Search } from "lucide-react";
import { CopyButton } from "../../components/CopyButton";
import { PageHeader } from "../../components/PageHeader";
import { PromptText } from "../../components/PromptText";
import { usePersistentState } from "../../hooks/usePersistentState";
import { BASE_OBRIGATORIA, CENAS, NEGATIVE_PROMPT, PERFIL_DICA, PERFIS } from "../data/kit";
import { PROFISSOES, VAZIO, filtrarCenas, montarPerfil, montarVideo, temProfissao, textoCena, type Caracteristicas } from "../lib/prompts";
import "../seguidores2k.css";

type Aba = "perfil" | "videos";

interface Salvo {
  campos: Record<string, Caracteristicas>;
  profissao: string;
  frase: boolean;
}
const INICIAL: Salvo = { campos: {}, profissao: "", frase: true };

/** 2K DE SEGUIDORES NO TIKTOK: 13 prompts de perfil (com campos) e 50 vídeos prontos com a base obrigatória. */
export default function Seguidores2kPage() {
  const [saved, setSaved] = usePersistentState<Salvo>("seguidores2k:v1", INICIAL);
  const st: Salvo = { ...INICIAL, ...saved };
  const [aba, setAba] = useState<Aba>("perfil");
  const [q, setQ] = useState("");
  const cenas = useMemo(() => filtrarCenas(q), [q]);

  const setCampo = (id: string, patch: Partial<Caracteristicas>) =>
    setSaved((p) => ({ ...INICIAL, ...p, campos: { ...(p.campos ?? {}), [id]: { ...VAZIO, ...(p.campos?.[id] ?? {}), ...patch } } }));
  const set = (patch: Partial<Salvo>) => setSaved((p) => ({ ...INICIAL, ...p, ...patch }));

  return (
    <div className="page sg">
      <PageHeader title="2K DE SEGUIDORES" subtitle="Kit para crescer um perfil de personagem no TikTok: crie a modelo (13 profissões) e use a base obrigatória com 50 ideias de vídeo" />

      <div className="mq-tabs" role="group" aria-label="Seções do kit">
        <button type="button" className={aba === "perfil" ? "on" : ""} aria-pressed={aba === "perfil"} onClick={() => setAba("perfil")}>Seção 1: Criação de perfil</button>
        <button type="button" className={aba === "videos" ? "on" : ""} aria-pressed={aba === "videos"} onClick={() => setAba("videos")}>Seção 2: 50 vídeos</button>
      </div>

      {aba === "perfil" ? (
        <section className="mq-panel" aria-labelledby="sg-s1">
          <h2 id="sg-s1" className="mq-h">Criação de perfil</h2>
          <p className="mq-lede">Escolha a profissão, preencha o cabelo, a pele e outra característica (em inglês) e copie o prompt para o gerador de imagens. Os campos vazios ficam de fora do texto.</p>
          <p className="sg-tip"><strong>Dica:</strong> {PERFIL_DICA}</p>
          <label className="veo-check">
            <input type="checkbox" checked={st.frase} onChange={(e) => set({ frase: e.target.checked })} />
            <span><strong>Repetir a frase-chave no fim de cada prompt</strong> (“smartphone photo, natural Brazilian environment…”).</span>
          </label>
          <div className="sg-grid">
            {PERFIS.map((p) => {
              const c = { ...VAZIO, ...(st.campos[p.id] ?? {}) };
              const text = montarPerfil(p, c, st.frase);
              return (
                <article className="mq-card" key={p.id} aria-labelledby={`sg-p-${p.id}`}>
                  <header><span className="mq-n">Perfil {p.id}</span></header>
                  <h3 id={`sg-p-${p.id}`}>{p.title}</h3>
                  <div className="sg-fields">
                    <div className="ws-field"><label htmlFor={`sg-h-${p.id}`}>Hair (cabelo)</label><input id={`sg-h-${p.id}`} value={c.hair} placeholder="long wavy dark brown hair" onChange={(e) => setCampo(p.id, { hair: e.target.value })} /></div>
                    <div className="ws-field"><label htmlFor={`sg-s-${p.id}`}>Skin (pele)</label><input id={`sg-s-${p.id}`} value={c.skin} placeholder="light tan skin" onChange={(e) => setCampo(p.id, { skin: e.target.value })} /></div>
                    <div className="ws-field"><label htmlFor={`sg-o-${p.id}`}>Other characteristic (outra)</label><input id={`sg-o-${p.id}`} value={c.other} placeholder="small freckles" onChange={(e) => setCampo(p.id, { other: e.target.value })} /></div>
                  </div>
                  <PromptText text={text} />
                  <div className="mq-card-actions">
                    <CopyButton text={text} label="Copiar prompt do perfil" variant="primary" />
                    <button type="button" className="btn btn-quiet" onClick={() => setCampo(p.id, VAZIO)} aria-label={`Limpar campos do perfil ${p.id}`}><Eraser size={14} /> Limpar</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <>
          <section className="mq-panel" aria-labelledby="sg-base">
            <h2 id="sg-base" className="mq-h">Base obrigatória</h2>
            <p className="mq-lede">Cole no começo de <strong>todos</strong> os prompts, com a foto da modelo como primeiro quadro. A lógica é simples: base obrigatória + uma cena de vídeo.</p>
            <PromptText text={BASE_OBRIGATORIA} />
            <div className="mq-card-actions"><CopyButton text={BASE_OBRIGATORIA} label="Copiar base obrigatória" variant="primary" /></div>
            <h3 className="sg-sub">Negative prompt (se a ferramenta tiver o campo)</h3>
            <PromptText text={NEGATIVE_PROMPT} />
            <div className="mq-card-actions"><CopyButton text={NEGATIVE_PROMPT} label="Copiar negative prompt" /></div>
          </section>

          <section className="mq-panel" aria-labelledby="sg-vid">
            <h2 id="sg-vid" className="mq-h">50 vídeos</h2>
            <div className="mq-fields">
              <div className="ws-field">
                <label htmlFor="sg-q">Buscar vídeo</label>
                <p className="ws-help">Número, título ou palavra da cena.</p>
                <div className="sg-search"><Search size={15} aria-hidden="true" /><input id="sg-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: café, 19, espelho" /></div>
              </div>
              <div className="ws-field">
                <label htmlFor="sg-prof">Profissão (troca [PROFESSION])</label>
                <p className="ws-help">Usada nos vídeos 19 e 26. Escreva em português.</p>
                <input id="sg-prof" list="sg-profs" value={st.profissao} placeholder="Ex.: enfermeira" onChange={(e) => set({ profissao: e.target.value })} />
                <datalist id="sg-profs">{PROFISSOES.map((p) => <option key={p} value={p} />)}</datalist>
              </div>
            </div>
            <p className="ws-help" role="status">{cenas.length} de {CENAS.length} vídeos</p>
            {cenas.length === 0 && <p className="empty-inline">Nenhum vídeo encontrado para essa busca.</p>}
            <div className="sg-grid">
              {cenas.map((c) => {
                const text = textoCena(c, st.profissao);
                return (
                  <article className="mq-card" key={c.id} aria-labelledby={`sg-v-${c.id}`}>
                    <header><span className="mq-n">Vídeo {c.id}</span></header>
                    <h3 id={`sg-v-${c.id}`}>{c.title}</h3>
                    {temProfissao(c) && !st.profissao.trim() && <p className="ws-help">Preencha a profissão acima para trocar o [PROFESSION].</p>}
                    <p className="sg-scene">{text}</p>
                    <div className="mq-card-actions">
                      <CopyButton text={() => montarVideo(c, st.profissao)} label="Copiar base + cena" variant="primary" />
                      <CopyButton text={text} label="Copiar só a cena" />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
