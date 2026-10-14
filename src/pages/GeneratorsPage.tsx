import { Link } from "react-router-dom";
import { Plug } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { GENERATORS } from "../data/catalog";
import { useGemini } from "../context/GeminiContext";

/** Hub único dos geradores de prompt: cada card abre a ferramenta (#/ferramenta/<id>). */
export default function GeneratorsPage() {
  const { status } = useGemini();
  return (
    <div className="page">
      <PageHeader title="Geradores de Prompt" subtitle="Todos os geradores reunidos num só lugar. Escolha um para começar." />
      {status !== "connected" && (
        <div className="banner">
          <Plug size={18} aria-hidden="true" />
          <p>Os geradores usam a sua chave gratuita do Gemini.</p>
          <Link className="btn btn-primary" to="/configuracoes">Conectar Gemini</Link>
        </div>
      )}
      <div className="tgrid" aria-label="Geradores">
        {GENERATORS.map((g) => (
          <article key={g.id} className="tcard">
            <Link to={g.to} className="tcard-main">
              <span className="tcard-icon"><g.icon size={20} /></span>
              <h2>{g.title}</h2>
              <p>{g.description}</p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
