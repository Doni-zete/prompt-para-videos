import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export default function NotFound() {
  return (
    <div className="page narrow">
      <PageHeader title="Página não encontrada" />
      <div className="empty">
        <p>Esse endereço não existe. Volte ao painel para escolher uma ferramenta.</p>
        <Link className="btn btn-primary" to="/">Ir para o painel</Link>
      </div>
    </div>
  );
}
