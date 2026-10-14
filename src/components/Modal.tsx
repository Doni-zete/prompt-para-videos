import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  /** Ocupa quase a tela inteira (áreas de trabalho com duas colunas). */
  full?: boolean;
  /** Janela de detalhes com mídia ao lado do texto. */
  gallery?: boolean;
  /** Substitui o título padrão do cabeçalho (precisa trazer o próprio <h2>). */
  head?: ReactNode;
}

/** Modal acessível sobre o <dialog> nativo: foco preso, Esc fecha, clique fora fecha. */
export function Modal({ open, onClose, title, children, footer, wide, full, gallery, head }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""} ${full ? "modal-full" : ""} ${gallery ? "modal-gallery" : ""}`}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
    >
      {open && (
        <div className="modal-body">
          <header className="modal-head">
            {head ?? <h2>{title}</h2>}
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
              <X size={18} />
            </button>
          </header>
          <div className="modal-content">{children}</div>
          {footer && <footer className="modal-foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
