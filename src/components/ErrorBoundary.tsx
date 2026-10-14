import { Component, type ErrorInfo, type ReactNode } from "react";
import { logEvent } from "../lib/diagnostics";

interface State {
  failed: boolean;
}

/** Se uma tela quebrar, mostra um aviso com saídas em vez de uma página em branco, e registra o erro no Diagnóstico. */
export class ErrorBoundary extends Component<{ children: ReactNode; /** Muda a cada troca de tela: tira o aviso e tenta de novo. */ resetKey?: string }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const where = info.componentStack?.split("\n").find((l) => l.trim())?.trim() ?? "";
    logEvent("tela", `${error.message || "Erro desconhecido"}${where ? ` (${where})` : ""}`);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="page narrow" role="alert">
        <section className="panel stack">
          <h1 className="panel-title">Algo deu errado nesta tela</h1>
          <p className="muted">O problema foi anotado no Diagnóstico (só neste navegador). Você pode recarregar ou voltar ao painel.</p>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={() => location.reload()}>Recarregar</button>
            <a className="btn btn-ghost" href="#/">Voltar ao painel</a>
            <a className="btn btn-ghost" href="#/configuracoes">Abrir Diagnóstico</a>
          </div>
        </section>
      </div>
    );
  }
}
