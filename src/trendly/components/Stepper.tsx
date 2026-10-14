import type { ReactNode } from "react";

interface StepperProps {
  label: string;
  title: string;
  total: number;
  filled: number;
}

/** Cabeçalho do assistente: "PASSO X DE N", título e barras de progresso. */
export function Stepper({ label, title, total, filled }: StepperProps) {
  return (
    <header className="tw-stepper">
      <p className="tw-step-label">{label}</p>
      <h1 className="tw-step-title">{title}</h1>
      <div className="tw-bars" role="progressbar" aria-label="Progresso" aria-valuemin={0} aria-valuemax={total} aria-valuenow={filled}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < filled ? "on" : ""} />
        ))}
      </div>
    </header>
  );
}

interface CardProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function WizardCard({ title, subtitle, onBack, children, footer }: CardProps) {
  return (
    <section className="tw-card" aria-label={title}>
      <header className="tw-card-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {onBack && (
          <button type="button" className="tw-back" onClick={onBack}>
            Voltar
          </button>
        )}
      </header>
      <div className="tw-card-body">{children}</div>
      {footer && <footer className="tw-card-foot">{footer}</footer>}
    </section>
  );
}
