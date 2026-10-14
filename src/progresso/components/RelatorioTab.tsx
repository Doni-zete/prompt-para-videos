import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Printer } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { usePersistentState } from "../../hooks/usePersistentState";
import { copyText, downloadText } from "../../lib/clipboard";
import { storage } from "../../lib/storage";
import { LEVEL_COLORS, goalColor, levelOf } from "../lib/cores";
import { EMPTY_GRADE, gradeStats, type Grade } from "../lib/grade";
import { guardarLinhas, reconhecerRelatorio, type Cliques, type LinhaGuardada } from "../lib/afiliados";
import { readTableFile, type TableRows } from "../lib/csv";
import { DEFAULT_GOALS, MONTHS, addDays, monthDays, toIso, weekDays, weekStart, type DoneMap, type Goal } from "../lib/progresso";
import { buildReport, reportToText } from "../lib/relatorio";
import { BarChart, Donut } from "./Charts";
import { IndicadoresReport, ItensReport, type Guardado } from "./AfiliadosReports";

type Scope = "week" | "lastweek" | "month" | "lastmonth";
const SCOPES: { id: Scope; label: string }[] = [
  { id: "week", label: "Esta semana" },
  { id: "lastweek", label: "Semana passada" },
  { id: "month", label: "Este mês" },
  { id: "lastmonth", label: "Mês passado" },
];

function MetasReport({ active }: { active: boolean }) {
  const toast = useToast();
  const [scope, setScope] = useState<Scope>("week");
  const now = useMemo(() => new Date(), []);
  const today = toIso(now);
  // Os dados são lidos de novo toda vez que a aba é aberta (a aba Metas guarda no mesmo lugar).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { goals, done, grade } = useMemo(() => ({
    goals: storage.get<Goal[]>("progresso:goals", DEFAULT_GOALS),
    done: storage.get<DoneMap>("progresso:done", {}),
    grade: storage.get<Grade>("progresso:planilha", EMPTY_GRADE),
  }), [active]);
  const report = useMemo(() => {
    const ws = weekStart(now);
    if (scope === "week") return buildReport(goals, done, weekDays(ws), today, "Esta semana");
    if (scope === "lastweek") return buildReport(goals, done, weekDays(addDays(ws, -7)), today, "Semana passada");
    const ref = scope === "month" ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return buildReport(goals, done, monthDays(ref.getFullYear(), ref.getMonth()), today, `${MONTHS[ref.getMonth()]} de ${ref.getFullYear()}`);
  }, [scope, goals, done, today, now]);
  const prod = grade.rows.length ? gradeStats(grade) : undefined;
  const text = reportToText(report, prod && prod.total > 0 ? prod : undefined);

  return (
    <section className="panel pg-report" aria-labelledby="pg-rm-t" data-testid="report">
      <h2 id="pg-rm-t" className="panel-title">Relatório de metas</h2>
      <div className="pg-scope" role="group" aria-label="Período do relatório">
        {SCOPES.map((s) => (
          <button key={s.id} type="button" className={`btn btn-ghost ${scope === s.id ? "is-on" : ""}`} aria-pressed={scope === s.id} onClick={() => setScope(s.id)}>{s.label}</button>
        ))}
      </div>
      <h3 className="pg-rep-title">Relatório de progresso: {report.title}</h3>
      <p className="muted">Período: {report.period}</p>
      <div className="pg-rep-top">
        <Donut pct={report.pct} label="Percentual geral do período" size={110} />
        <div className="pg-rep-kpis">
          <div style={{ borderTopColor: LEVEL_COLORS[levelOf(report.pct)] }}><strong data-testid="rep-pct">{report.pct}%</strong><span>geral</span></div>
          <div style={{ borderTopColor: "#3b82f6" }}><strong>{report.done} de {report.total}</strong><span>marcações</span></div>
          <div style={{ borderTopColor: "#22c55e" }}><strong>{report.perfectDays}</strong><span>dias perfeitos</span></div>
          <div style={{ borderTopColor: "#f97316" }}><strong>{report.streak}</strong><span>sequência (dias)</span></div>
        </div>
      </div>
      <p className="pg-verdict">{report.verdict}</p>
      {report.goals.length > 0 && (
        <BarChart title="Percentual por meta (%)" format={(n) => `${n}%`} data={report.goals.map((g, i) => ({ name: g.text, value: g.pct, color: goalColor(i) }))} />
      )}
      {report.goals.length > 0 && (
        <table className="pg-rep-table">
          <caption className="sr-only">Percentual por meta</caption>
          <thead><tr><th scope="col">Meta</th><th scope="col">Dias</th><th scope="col">%</th></tr></thead>
          <tbody>{report.goals.map((g) => <tr key={g.text}><th scope="row">{g.text}</th><td>{g.done} de {g.total}</td><td>{g.pct}%</td></tr>)}</tbody>
        </table>
      )}
      <ul className="pg-rep-notes">
        {report.bestGoal && <li>Meta mais cumprida: <strong>{report.bestGoal}</strong></li>}
        {report.weakestGoal && <li>Meta que mais precisa de atenção: <strong>{report.weakestGoal}</strong></li>}
        {report.bestWeekday && <li>Melhor dia da semana: <strong>{report.bestWeekday}</strong></li>}
        {report.weakestWeekday && <li>Pior dia da semana: <strong>{report.weakestWeekday}</strong></li>}
        {prod && prod.total > 0 && <li>Planilha de produção: <strong>{prod.pct}% concluído</strong> ({prod.counts["Concluído"]} de {prod.total} células)</li>}
      </ul>
      {report.days.length > 0 && (
        <>
          <h4 className="pg-sub">Dia a dia</h4>
          <BarChart title="Percentual por dia (%)" format={(n) => `${n}%`} data={report.days.map((d) => ({ name: d.label, value: d.pct, color: LEVEL_COLORS[levelOf(d.pct)] }))} />
        </>
      )}
      <div className="row pg-tools pg-noprint">
        <button type="button" className="btn btn-ghost" onClick={async () => toast((await copyText(text)) ? "Relatório copiado." : "Não foi possível copiar.", "ok")}><Copy size={14} /> Copiar texto</button>
        <button type="button" className="btn btn-ghost" onClick={() => downloadText(`relatorio-progresso-${today}.txt`, text)}><Download size={14} /> Baixar .txt</button>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer size={14} /> Imprimir / salvar PDF</button>
      </div>
    </section>
  );
}

/** Aba "Gerar Relatório": relatório de metas e os relatórios do painel de afiliados (cliques + comissão), guardados no navegador. */
export function RelatorioTab({ active }: { active: boolean }) {
  const toast = useToast();
  const [cliques, setCliques] = usePersistentState<Guardado<Cliques> | null>("progresso:r:cliques", null);
  const [itens, setItens] = usePersistentState<Guardado<LinhaGuardada[]> | null>("progresso:r:itens", null);
  const [legado, setLegado] = usePersistentState<Guardado<TableRows> | null>("progresso:r:ind", null);

  // se o navegador não deixou guardar (arquivo grande demais), avisa em vez de sumir sem explicação
  useEffect(() => {
    const falhou = (k: string, v: unknown) => v !== null && storage.get(k, null) === null;
    if (falhou("progresso:r:cliques", cliques) || falhou("progresso:r:itens", itens) || falhou("progresso:r:ind", legado)) {
      toast("O arquivo é grande demais para ficar guardado: ele aparece agora, mas some se você recarregar a página.", "error");
    }
  }, [cliques, itens, legado, toast]);

  const importar = async (f: File) => {
    try {
      const lido = reconhecerRelatorio(readTableFile(f.name, new Uint8Array(await f.arrayBuffer())).sheets);
      if (lido.kind === "cliques") {
        setCliques({ name: f.name, data: lido.cliques });
        toast(`Cliques importados: ${lido.cliques.total} cliques.`);
      } else if (lido.kind === "itens") {
        setItens({ name: f.name, data: guardarLinhas(lido.itens.linhas) });
        toast(`Comissão importada: ${lido.itens.pedidosTodos} pedidos.`);
      } else {
        setLegado({ name: f.name, data: lido.rows });
        toast("Indicadores por dia importados.");
      }
    } catch (e) {
      toast((e as Error).message || "Não consegui ler o arquivo.", "error");
    }
  };

  return (
    <div id="pg-panel-relatorio" role="tabpanel" aria-labelledby="pg-tab-relatorio" className="pg-relatorio">
      <ItensReport itens={itens} onFile={importar} onClear={() => setItens(null)} />
      <IndicadoresReport cliques={cliques} itens={itens} legado={legado} onFile={importar} onClear={() => { setCliques(null); setLegado(null); }} />
      <MetasReport active={active} />
    </div>
  );
}
