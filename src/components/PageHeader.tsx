import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  to?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, to = "/", actions }: Props) {
  return (
    <header className="page-head">
      <Link to={to} className="back" aria-label="Voltar">
        <ArrowLeft size={18} />
      </Link>
      <div className="page-head-text">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </header>
  );
}
