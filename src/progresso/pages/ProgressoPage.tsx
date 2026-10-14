import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, FileSpreadsheet, Quote as QuoteIcon, Target } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { MetasTab } from "../components/MetasTab";
import { PlanilhaTab } from "../components/PlanilhaTab";
import { RelatorioTab } from "../components/RelatorioTab";
import { quoteOfDay } from "../lib/progresso";
import "../progresso.css";

const TABS = [
  { id: "relatorio", label: "Gerar Relatório", Icon: BarChart3 },
  { id: "metas", label: "Metas e progresso", Icon: Target },
  { id: "planilha", label: "Importar/Exportar Planilha", Icon: FileSpreadsheet },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** Progresso Semanal: três abas (metas, planilha Excel e relatórios), todas com gráficos coloridos. */
export default function ProgressoPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("aba");
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : TABS[0].id;
  const quote = useMemo(() => quoteOfDay(new Date()), []);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const go = useCallback((id: TabId, focus = false) => {
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (id === TABS[0].id) n.delete("aba");
      else n.set("aba", id);
      return n;
    }, { replace: true });
    if (focus) setTimeout(() => refs.current[id]?.focus(), 0);
  }, [setParams]);

  useEffect(() => {
    window.scrollTo?.({ top: 0 });
  }, [tab]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const k = e.key;
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(k)) return;
    e.preventDefault();
    const next = k === "Home" ? 0 : k === "End" ? TABS.length - 1 : (i + (k === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    go(TABS[next].id, true);
  };

  return (
    <div className="page pg">
      <PageHeader title="Progresso Semanal" subtitle="Metas por dia, planilhas em Excel e relatórios com gráficos coloridos." />

      <figure className="pg-quote">
        <QuoteIcon size={18} aria-hidden="true" />
        <blockquote>“{quote.quote}”</blockquote>
        <figcaption>{quote.author}</figcaption>
      </figure>

      <div className="pg-tabs" role="tablist" aria-label="Seções do Progresso Semanal">
        {TABS.map(({ id, label, Icon }, i) => (
          <button
            key={id}
            ref={(el) => { refs.current[id] = el; }}
            id={`pg-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`pg-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className={`pg-tab ${tab === id ? "is-on" : ""}`}
            onClick={() => go(id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <Icon size={15} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      <div className="pg-pane" hidden={tab !== "metas"}><MetasTab goTo={(t) => go(t)} /></div>
      <div className="pg-pane" hidden={tab !== "planilha"}><PlanilhaTab /></div>
      <div className="pg-pane" hidden={tab !== "relatorio"}><RelatorioTab active={tab === "relatorio"} /></div>
    </div>
  );
}
