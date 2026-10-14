import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Heart, ImageOff, Pencil, RotateCcw, Sparkles, Trash2, Upload, Wand2, X } from "lucide-react";
import { AutoTextarea } from "../../components/AutoTextarea";
import { CopyButton } from "../../components/CopyButton";
import { MediaPicker } from "../../components/MediaPicker";
import { Modal } from "../../components/Modal";
import { SUBJECT_CHIP } from "../../data/subjectChip";
import type { MediaItem } from "../../lib/mediaResolver";
import { playMuted, useAutoplay } from "../../lib/videoMotion";
import { HOW_TO, STYLE_LABEL, displayTitle, subtitleOf, type Edit, type GaleriaView } from "../lib/galeria";

export interface DetailActions {
  onPrev: () => void;
  onNext: () => void;
  onFav: () => void;
  onSave: (e: Edit) => void;
  /** Troca só o nome (lápis ao lado do título). */
  onRename: (title: string) => void;
  onReset: () => void;
  onDelete: () => void;
  /** Vídeos no formato novo. */
  onMontar: () => void;
  onVeo: () => void;
  /** Prompts prontos que não são de vídeo no formato novo. */
  onAdapt: () => void;
}

interface BodyProps extends DetailActions {
  item: GaleriaView;
  media: MediaItem | null;
  index: number;
  total: number;
  fav: boolean;
  canAi: boolean;
  startEditing: boolean;
}

function Body({ item, media, index, total, fav, canAi, startEditing, onPrev, onNext, onFav, onSave, onReset, onDelete, onMontar, onVeo, onAdapt }: BodyProps) {
  const [editing, setEditing] = useState(startEditing && !item.hasSpec);
  const [title, setTitle] = useState(item.title);
  const [prompt, setPrompt] = useState(item.prompt);
  const [obs, setObs] = useState(item.obs);
  const [confirmDel, setConfirmDel] = useState(false);
  const [autoplay] = useAutoplay();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (editing || el?.closest("input, textarea, select")) return;
      if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onPrev, onNext]);

  const lib = item.origin === "lib";
  const folder = lib ? `public/media/library/${item.mediaNames[0]}.${item.kind === "video" ? "mp4" : "jpg"}` : `public/media/gallery/${item.mediaNames[0]}.${item.kind === "video" ? "mp4" : "jpg"}`;
  const empty = !item.prompt.trim();
  const titleEditable = !lib || item.userMade;
  const obsEditable = lib && !item.hasSpec;
  // Nos vídeos no formato novo a descrição já é o resumo; as observações começam com ele, então tiro a repetição.
  const obsShown = item.hasSpec && item.obs.startsWith(item.description) ? item.obs.slice(item.description.length).trim() : item.obs;
  const startEdit = () => {
    setTitle(item.title);
    setPrompt(item.prompt);
    setObs(item.obs);
    setEditing(true);
  };

  return (
    <div className="gd">
      <div className="gd-media">
        {media ? (
          media.kind === "video" ? (
            <video key={media.url} ref={(v) => { if (v && autoplay) void playMuted(v); }} src={media.url} poster={media.poster} controls loop muted playsInline autoPlay={autoplay} aria-label={`Vídeo de ${displayTitle(item.title)}`} />
          ) : (
            <img src={media.url} alt={`Prévia de ${displayTitle(item.title)}`} />
          )
        ) : (
          <div className="gd-nomedia" style={item.cover ? { background: `linear-gradient(165deg, hsl(${item.cover.hue} 50% 22%), #07070a)` } : undefined}>
            {item.cover?.emoji ? <span className="gl-emoji">{item.cover.emoji}</span> : <ImageOff size={30} aria-hidden="true" />}
            <strong>Sem {item.kind === "video" ? "vídeo" : "imagem"} ainda</strong>
            <MediaPicker category={item.mediaCategory} name={item.mediaNames[0]} label={`Escolher imagem ou vídeo para ${displayTitle(item.title)}`} className="btn btn-primary">
              <Upload size={15} /> Escolher imagem ou vídeo
            </MediaPicker>
            <small>Com <code>npm run dev</code> o arquivo vai sozinho para <code>{folder}</code>. No site publicado ele é baixado para você colocar lá.</small>
          </div>
        )}
        {media && (
          <span className="gd-swap">
            <MediaPicker category={item.mediaCategory} name={item.mediaNames[0]} label={`Trocar a ${media.kind === "video" ? "vídeo" : "imagem"} de ${displayTitle(item.title)}`} className="gd-pencil">
              <Pencil size={15} aria-hidden="true" />
            </MediaPicker>
          </span>
        )}
        {total > 1 && (
          <>
            <button type="button" className="gd-arrow prev" onClick={onPrev} aria-label="Prompt anterior"><ChevronLeft size={20} /></button>
            <button type="button" className="gd-arrow next" onClick={onNext} aria-label="Próximo prompt"><ChevronRight size={20} /></button>
            <span className="gd-count" aria-live="polite">{index + 1} de {total}</span>
          </>
        )}
      </div>

      <div className="gd-info">
        <p className="gd-desc">{item.description}</p>
        <div className="gd-tags">
          <span className="chip">{subtitleOf(item)}</span>
          {lib && item.collection === "prontas" && <span className="chip">Prompts Prontas</span>}
          <span className="chip">{item.kind === "image" ? "Imagem" : "Vídeo"}</span>
          {item.styles.map((s) => <span className="chip" key={s}>{STYLE_LABEL[s]}</span>)}
          {item.lib?.spec && <span className="chip">{SUBJECT_CHIP[item.lib.spec.subject]}</span>}
          {item.mode && <span className="chip">{item.mode === "frames" ? "Frames" : "Elementos"}</span>}
          {item.draft && <span className="chip" title="Texto reconstruído: confira antes de usar">Rascunho</span>}
          {item.userMade && <span className="chip chip-new">Seu prompt</span>}
          {item.fromMedia && <span className="chip chip-new">Novo na mídia</span>}
          {item.edited && <span className="chip chip-ai">Editado por você</span>}
        </div>

        <div className="gd-actions">
          {item.hasSpec ? (
            <>
              <button type="button" className="btn btn-primary" onClick={onMontar}><Wand2 size={15} /> Montar prompt</button>
              <button type="button" className="btn btn-ghost" onClick={onVeo} disabled={!canAi} title={canAi ? "A IA gera o prompt olhando a sua foto" : "Conecte o Gemini para usar"}><Sparkles size={15} /> Gerar com IA</button>
            </>
          ) : (
            <>
              <CopyButton text={item.prompt} label="Copiar prompt inteiro" variant="primary" disabled={empty} />
              <button type="button" className="gd-pencil" onClick={startEdit} aria-label="Editar prompt" title="Editar prompt" aria-pressed={editing}>
                <Pencil size={16} />
              </button>
              {lib && (
                <button type="button" className="btn btn-ghost" onClick={onAdapt} disabled={!canAi} title={canAi ? "A IA reescreve este prompt para o seu produto" : "Conecte o Gemini para usar"}>
                  <Sparkles size={15} /> Adaptar com IA
                </button>
              )}
            </>
          )}
          <button type="button" className={`btn btn-ghost gd-fav ${fav ? "on" : ""}`} onClick={onFav} aria-pressed={fav}>
            <Heart size={15} fill={fav ? "currentColor" : "none"} /> {fav ? "Favoritado" : "Favoritar"}
          </button>
          {item.userMade &&
            (confirmDel ? (
              <>
                <button type="button" className="btn btn-quiet danger" onClick={onDelete}><Trash2 size={14} /> Confirmar exclusão</button>
                <button type="button" className="btn btn-quiet" onClick={() => setConfirmDel(false)}>Manter</button>
              </>
            ) : (
              <button type="button" className="btn btn-quiet danger" onClick={() => setConfirmDel(true)}><Trash2 size={14} /> Excluir</button>
            ))}
        </div>

        <p className="gd-label">{item.hasSpec ? "MODELO DO PROMPT" : "PROMPT"}</p>
        {item.hasSpec && <p className="ws-help">Este modelo tem campos para preencher com o seu produto. Use <strong>Montar prompt</strong> (os campos se completam sozinhos) ou <strong>Gerar com IA</strong>.</p>}
        {editing ? (
          <form className="gd-edit" onSubmit={(e) => { e.preventDefault(); onSave({ title, prompt, obs }); setEditing(false); }}>
            {titleEditable && (
              <div className="ws-field">
                <label htmlFor="gd-title">Título</label>
                <input id="gd-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            )}
            <div className="ws-field">
              <label htmlFor="gd-prompt">Prompt</label>
              <AutoTextarea id="gd-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Escreva ou cole o prompt." autoFocus />
            </div>
            {obsEditable && (
              <div className="ws-field">
                <label htmlFor="gd-obs">Observações</label>
                <AutoTextarea id="gd-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Como usar, modelo recomendado, o que trocar…" />
              </div>
            )}
            <div className="gd-edit-actions">
              <button type="submit" className="btn btn-primary">Salvar</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
              {item.edited && (
                <button type="button" className="btn btn-quiet" onClick={() => { onReset(); setEditing(false); }}>
                  <RotateCcw size={14} /> Restaurar original
                </button>
              )}
            </div>
            <p className="ws-help">A edição fica salva neste navegador. “Restaurar original” volta ao texto de fábrica.</p>
          </form>
        ) : (
          <div className="gd-prompt">
            {!item.hasSpec && (
              <div className="gd-prompt-tools">
                <CopyButton text={item.prompt} label="Copiar" variant="quiet" disabled={empty} />
                <button type="button" className="gd-pencil sm" onClick={startEdit} aria-label="Editar prompt (ao lado do copiar)" title="Editar prompt">
                  <Pencil size={14} />
                </button>
              </div>
            )}
            {empty ? <p className="gd-empty">Sem prompt ainda. Clique no lápis para escrever o prompt deste {item.kind === "video" ? "vídeo" : "item"}.</p> : <pre>{item.prompt}</pre>}
          </div>
        )}

        {lib ? (
          obsShown.trim() && (
            <>
              <p className="gd-label">OBSERVAÇÕES</p>
              <div className="gd-how"><pre>{obsShown}</pre></div>
            </>
          )
        ) : (
          <>
            <p className="gd-label">COMO USAR</p>
            <p className="gd-how">{HOW_TO[item.kind]}</p>
          </>
        )}
      </div>
    </div>
  );
}

interface Props extends DetailActions {
  item: GaleriaView | null;
  media: MediaItem | null;
  index: number;
  total: number;
  fav: boolean;
  canAi: boolean;
  startEditing: boolean;
  onClose: () => void;
}

/** Título no cabeçalho com lápis: clique para renomear; “Restaurar nome” volta ao original. */
function TitleEditor({ item, onRename }: { item: GaleriaView; onRename: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.title);
  const renamed = item.title !== item.originalTitle;
  const done = () => {
    const t = value.trim();
    if (t && t !== item.title) onRename(t);
    setEditing(false);
  };
  if (editing) {
    return (
      <form className="gd-rename" onSubmit={(e) => { e.preventDefault(); done(); }}>
        <input value={value} onChange={(e) => setValue(e.target.value)} aria-label="Nome do prompt" autoFocus maxLength={120} onKeyDown={(e) => e.key === "Escape" && (e.preventDefault(), e.stopPropagation(), setEditing(false))} />
        <button type="submit" className="gd-pencil sm" aria-label="Salvar nome" title="Salvar nome"><Check size={14} /></button>
        <button type="button" className="gd-pencil sm" aria-label="Cancelar" title="Cancelar" onClick={() => setEditing(false)}><X size={14} /></button>
        {renamed && (
          <button type="button" className="btn btn-quiet" onClick={() => { onRename(item.originalTitle); setEditing(false); }}>
            <RotateCcw size={13} /> Restaurar nome
          </button>
        )}
      </form>
    );
  }
  return (
    <div className="gd-titlebar">
      <h2>{displayTitle(item.title)}</h2>
      <button type="button" className="gd-pencil sm gd-title-pencil" aria-label="Editar nome" title="Editar nome" onClick={() => { setValue(item.title); setEditing(true); }}>
        <Pencil size={14} />
      </button>
    </div>
  );
}

/** Janela de detalhes: mídia à esquerda (com setas), prompt à direita (copiar e editar com o lápis). */
export function GaleriaDetail({ item, onClose, startEditing, ...rest }: Props) {
  return (
    <Modal open={!!item} onClose={onClose} title={item ? displayTitle(item.title) : "Prompt"} gallery head={item ? <TitleEditor key={`${item.id}:${item.title}`} item={item} onRename={rest.onRename} /> : undefined}>
      {item && <Body key={`${item.id}:${startEditing}`} item={item} startEditing={startEditing} {...rest} />}
    </Modal>
  );
}
