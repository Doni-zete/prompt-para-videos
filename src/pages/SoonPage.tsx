import { Link, useParams } from "react-router-dom";
import { Hourglass } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { SOON } from "../data/catalog";
import NotFound from "./NotFound";

export default function SoonPage() {
  const { id = "" } = useParams();
  const info = SOON[id];
  if (!info) return <NotFound />;
  return (
    <div className="page narrow">
      <PageHeader title={info.title} />
      <div className="empty">
        <span className="empty-icon"><Hourglass size={26} /></span>
        <h2>Ainda não está disponível</h2>
        <p>{info.text}</p>
        <Link className="btn btn-primary" to="/">Voltar ao painel</Link>
      </div>
    </div>
  );
}
