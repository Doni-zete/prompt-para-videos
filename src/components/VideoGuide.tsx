import { Sparkles } from "lucide-react";

const STEPS = [
  <>No <strong>Flow</strong>, escolha <strong>“Frames to Video”</strong> e suba a <strong>foto real do seu produto</strong>.</>,
  <>Aqui, abra o card que combina com o seu produto (<strong>Montar prompt</strong>), <strong>envie a foto e cole a descrição</strong>: a IA preenche tudo. Revise e ajuste.</>,
  <>Copie o <strong>Prompt do vídeo</strong> e cole no Flow. Gere <strong>3 ou 4 versões</strong> e fique com a em que o produto está igual à foto.</>,
  <>Quer vários cortes rápidos? Copie os <strong>Clipes extras</strong> (mesma foto, ação diferente) e junte no CapCut.</>,
];

const TERMS: [string, string][] = [
  ["Flow / Veo", "A ferramenta do Google que transforma a sua foto em vídeo."],
  ["Frames to Video", "A opção do Flow em que a foto vira o PRIMEIRO QUADRO do vídeo. É isso que impede o produto de mudar."],
  ["Foto de catálogo", "Foto com fundo branco. Nesse caso, gere antes uma foto do produto no ambiente (aba “Foto da cena”)."],
  ["Clipe extra", "Outro vídeo curto feito com a mesma foto, mudando só a ação. Serve para montar cortes rápidos na edição."],
  ["Narração", "A fala do vídeo, em português. Só pode falar o que está na descrição do produto."],
];

interface Props {
  canGenerate: boolean;
  onGenerate: () => void;
}

/** Explica, em linguagem simples, para que servem os prompts desta página e como usá-los. */
export function VideoGuide({ canGenerate, onGenerate }: Props) {
  return (
    <section className="vguide" aria-labelledby="vguide-h">
      <header className="vguide-head">
        <div>
          <h2 id="vguide-h">Como funciona (leia em 30 segundos)</h2>
          <p>
            Cada card é uma <strong>ideia de vídeo</strong>. O texto (prompt) que você copia serve para o <strong>Flow (Google Veo)</strong> transformar a <strong>foto do seu produto em um vídeo</strong>. Para o produto não mudar, a sua foto entra como o <strong>primeiro quadro</strong> do vídeo.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onGenerate} disabled={!canGenerate} title={canGenerate ? "A IA olha a sua foto e preenche tudo" : "Conecte o Gemini em Configurações"}>
          <Sparkles size={14} /> Gerar com IA a partir da foto
        </button>
      </header>
      <ol className="vguide-steps">
        {STEPS.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <details className="vguide-check">
        <summary>Entenda os termos</summary>
        <dl className="vguide-terms">
          {TERMS.map(([t, d]) => (
            <div key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
