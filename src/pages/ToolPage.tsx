import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, History, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ConnectPanel } from "../components/ConnectPanel";
import { ImageDropzone } from "../components/ImageDropzone";
import { VideoDropzone } from "../components/VideoDropzone";
import { FieldInput } from "../components/FieldInput";
import { ResultView } from "../components/ResultView";
import { useGemini } from "../context/GeminiContext";
import { useGenerate } from "../hooks/useGenerate";
import { useHistory } from "../hooks/useHistory";
import { deleteUploadedFile, uploadVideo, videoPart, type Part, type PreparedImage, type ToolOutput } from "../lib/gemini";
import { getTool } from "../tools/definitions";
import type { ToolDef } from "../tools/types";
import NotFound from "./NotFound";

function initialValues(tool: ToolDef): Record<string, string> {
  const out: Record<string, string> = {};
  tool.input.fields.forEach((f) => (out[f.id] = f.defaultValue ?? ""));
  return out;
}

const fmtDate = (t: number) => new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Workspace({ tool }: { tool: ToolDef }) {
  const { status } = useGemini();
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(tool));
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const history = useHistory(tool.id);
  const { push } = history;

  const onDone = useCallback(
    (output: ToolOutput, model: string) => push(output, model, values.product?.trim() || values.niche?.trim() || tool.title),
    [push, values.product, values.niche, tool.title],
  );
  const gen = useGenerate(onDone);

  if (status !== "connected") {
    return (
      <div className="page narrow">
        <PageHeader title={tool.title} subtitle={tool.description} />
        <section className="panel">
          <h2 className="panel-title">Conecte o Gemini para usar esta ferramenta</h2>
          <ConnectPanel />
        </section>
      </div>
    );
  }

  const validate = (): string | null => {
    for (const f of tool.input.fields) {
      if (f.required && !values[f.id]?.trim()) return `Preencha o campo “${f.label}”.`;
    }
    const need = tool.input.images?.min ?? 0;
    if (images.length < need) return `Anexe ${need === 1 ? "pelo menos 1 imagem" : `pelo menos ${need} imagens`}.`;
    if (tool.input.video && !video) return "Envie um vídeo para avaliar.";
    return null;
  };

  const submit = () => {
    const err = validate();
    setFormError(err);
    if (err) return;
    void gen.run({
      system: tool.system,
      temperature: tool.temperature,
      build: async ({ apiKey, signal, setStatus }) => {
        const parts: Part[] = [];
        let cleanup: (() => Promise<void>) | undefined;
        if (video) {
          const uploaded = await uploadVideo(apiKey, video, setStatus, signal);
          parts.push(videoPart(uploaded));
          cleanup = () => deleteUploadedFile(apiKey, uploaded.name);
        }
        images.forEach((i) => parts.push(i.part));
        parts.push({ text: tool.buildPrompt(values) });
        return { parts, cleanup };
      },
    });
  };

  const { state } = gen;
  const running = state.status === "running";
  const Icon = tool.icon;

  return (
    <div className="page">
      <PageHeader title={tool.title} subtitle={tool.description} />
      <div className="workspace">
        <section className="panel" aria-labelledby="in-title">
          <h2 className="panel-title" id="in-title"><Icon size={16} aria-hidden="true" /> {tool.panelTitle}</h2>

          {tool.input.images && (
            <div className="field">
              <span className="field-label">{tool.input.images.label}{tool.input.images.min > 0 && <span className="req"> *</span>}</span>
              <ImageDropzone items={images} onChange={setImages} max={tool.input.images.max} hint={tool.input.images.hint} />
            </div>
          )}
          {tool.input.video && (
            <div className="field">
              <span className="field-label">{tool.panelTitle}</span>
              <p className="field-help">Envie seu vídeo (até {tool.input.video.maxMB}MB) e receba uma avaliação completa: pontos fortes, o que melhorar, risco de violação, público provável e potencial de venda.</p>
              <VideoDropzone file={video} onChange={setVideo} maxMB={tool.input.video.maxMB} label={tool.input.video.label} hint={tool.input.video.hint} />
            </div>
          )}

          {tool.input.fields.map((f) => (
            <FieldInput key={f.id} field={f} value={values[f.id] ?? ""} onChange={(v) => setValues((s) => ({ ...s, [f.id]: v }))} />
          ))}

          {formError && <p className="alert alert-error" role="alert">{formError}</p>}

          {running ? (
            <button type="button" className="btn btn-ghost btn-lg" onClick={gen.cancel}><X size={16} /> Cancelar</button>
          ) : (
            <button type="button" className="btn btn-primary btn-lg" onClick={submit}><Sparkles size={16} /> {tool.cta}</button>
          )}
        </section>

        <section className="panel" aria-labelledby="out-title" aria-live="polite">
          <h2 className="panel-title" id="out-title"><Icon size={16} aria-hidden="true" /> {tool.resultTitle}</h2>
          <p className="alert alert-warn"><AlertTriangle size={15} aria-hidden="true" /> {tool.notice}</p>

          {state.status === "idle" && (
            <div className="empty">
              <span className="empty-icon"><Icon size={26} /></span>
              <h3>{tool.emptyTitle}</h3>
              <p>{tool.emptyText}</p>
            </div>
          )}

          {running && (
            <div className="empty" role="status">
              <Loader2 size={30} className="spin accent" />
              <h3>{state.message || "Gerando…"}</h3>
              {state.progress !== undefined && (
                <div className="progress" aria-label="Progresso do envio"><span style={{ width: `${Math.round(state.progress * 100)}%` }} /></div>
              )}
              <p>Isso costuma levar de 5 a 30 segundos. Vídeos levam mais.</p>
            </div>
          )}

          {state.status === "error" && (
            <div className="empty">
              <p className="alert alert-error" role="alert">{state.error}</p>
              <button type="button" className="btn btn-ghost" onClick={submit}>Tentar de novo</button>
            </div>
          )}

          {state.status === "done" && state.output && (
            <ResultView output={state.output} model={state.model} filename={tool.id} onRegenerate={submit} busy={running} />
          )}

          {history.entries.length > 0 && (
            <details className="history">
              <summary><History size={14} /> Histórico ({history.entries.length})</summary>
              <ul>
                {history.entries.map((h) => (
                  <li key={h.id}>
                    <button type="button" className="history-open" onClick={() => gen.show(h.output, h.model)}>
                      <strong>{h.label}</strong>
                      <span>{fmtDate(h.at)} · {h.model}</span>
                    </button>
                    <button type="button" className="icon-btn" onClick={() => history.remove(h.id)} aria-label={`Excluir ${h.label} do histórico`}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-quiet danger" onClick={history.clear}>Limpar histórico</button>
            </details>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ToolPage() {
  const { id = "" } = useParams();
  const tool = getTool(id);
  if (!tool) return <NotFound />;
  return <Workspace key={tool.id} tool={tool} />;
}
