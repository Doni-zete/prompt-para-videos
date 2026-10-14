import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { LibraryItem } from "../data/types";
import type { PreparedImage } from "../lib/gemini";
import { useGenerate } from "../hooks/useGenerate";
import { BASE_SYSTEM, PROMPT_CRAFT } from "../tools/knowledge";
import { ImageDropzone } from "./ImageDropzone";
import { Modal } from "./Modal";
import { ResultView } from "./ResultView";

const SYSTEM = `${BASE_SYSTEM}\n\n${PROMPT_CRAFT}\n\nSua tarefa: adaptar um prompt existente ao produto do usuário. Mantenha a estrutura, o estilo, o ritmo e as regras de restrição do prompt original, trocando apenas o que depende do produto (tipo de peça, cor, material, ambiente coerente, falas). Não invente características. Entregue uma única seção "Prompt adaptado" com os itens: "Prompt adaptado" (pronto para colar) e "Observações de uso" (o que subir no Flow e em qual modo). Se o original for de duas imagens (Frames), mantenha os dois prompts e o de movimento como itens separados.`;

export function AdaptDialog({ item, onClose }: { item: LibraryItem | null; onClose: () => void }) {
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState<PreparedImage[]>([]);
  const gen = useGenerate();
  const { reset } = gen;

  useEffect(() => {
    setDesc("");
    setImages([]);
    reset();
  }, [item?.id, reset]);

  const submit = () => {
    if (!item) return;
    void gen.run({
      system: SYSTEM,
      temperature: 0.7,
      build: async () => ({
        parts: [
          ...images.map((i) => i.part),
          {
            text: `PROMPT ORIGINAL (${item.title}):\n${item.prompt}\n\nOBSERVAÇÕES ORIGINAIS:\n${item.obs}\n\nMEU PRODUTO:\n${desc.trim() || "veja as imagens"}\n\nAdapte o prompt para o meu produto.`,
          },
        ],
      }),
    });
  };

  const running = gen.state.status === "running";

  return (
    <Modal open={!!item} onClose={onClose} title={item ? `Adaptar: ${item.title}` : "Adaptar"} wide>
      <div className="stack">
        <div className="field">
          <label htmlFor="adapt-desc">Descreva seu produto</label>
          <textarea id="adapt-desc" rows={3} value={desc} placeholder="Ex.: blusa cropped canelada preta, manga curta, tecido com elastano" onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Imagens do produto (opcional)</span>
          <ImageDropzone items={images} onChange={setImages} max={3} hint="Com imagem, o Gemini descreve cores e detalhes reais." />
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={submit} disabled={running || (!desc.trim() && !images.length)}>
          {running ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
          {running ? gen.state.message || "Gerando…" : "Adaptar prompt"}
        </button>
        {gen.state.status === "error" && <p className="alert alert-error" role="alert">{gen.state.error}</p>}
        {gen.state.status === "done" && gen.state.output && (
          <ResultView output={gen.state.output} model={gen.state.model} filename="prompt-adaptado" onRegenerate={submit} busy={running} />
        )}
      </div>
    </Modal>
  );
}
