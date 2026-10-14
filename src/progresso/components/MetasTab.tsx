import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CalendarCheck, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Flame, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { Modal } from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { usePersistentState } from "../../hooks/usePersistentState";
import { LEVEL_COLORS, goalColor, levelOf } from "../lib/cores";
import { applyImport, exportFileName, exportXlsx, parseXlsxFile, planImport, type ParsedMarks } from "../lib/planilha";
import {
  DEFAULT_GOALS, MAX_GOALS, MAX_GOAL_LEN, MONTHS, WEEKDAYS, addDays, addGoal, clearDays, fromIso, goalStats, monthDays, moveGoal, rangeLabel, rangeStat, removeGoal, renameGoal,
  setAllForDay, streak, toIso, toggleDone, weekDays, weekMessage, weekStart, weekdayStats, type DoneMap, type Goal,
} from "../lib/progresso";
import { Donut, LevelLegend } from "./Charts";
import { downloadBytes } from "../lib/baixar";

const longDay = (iso: string) => {
  const d = fromIso(iso);
  return `${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}`;
};
const lvColor = (pct: number, future = false) => LEVEL_COLORS[levelOf(pct, future)];

function GoalRow({ goal, index, total, onRename, onMove, onRemove }: { goal: Goal; index: number; total: number; onRename: (t: string) => void; onMove: (d: -1 | 1) => void; onRemove: () => void }) {
  const [text, setText] = useState(goal.text);
  const commit = () => {
    const t = text.replace(/\s+/g, " ").trim();
    if (!t) setText(goal.text);
    else if (t !== goal.text) onRename(t);
  };
  return (
    <li className="pg-goal">
      <i className="pg-dot" style={{ background: goalColor(index) }} aria-hidden="true" />
      <input value={text} maxLength={MAX_GOAL_LEN} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} aria-label={`Nome da meta ${index + 1}`} />
      <button type="button" className="icon-btn" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Subir meta ${goal.text}`}><ArrowUp size={14} /></button>
      <button type="button" className="icon-btn" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Descer meta ${goal.text}`}><ArrowDown size={14} /></button>
      <button type="button" className="icon-btn" onClick={onRemove} aria-label={`Excluir meta ${goal.text}`}><Trash2 size={14} /></button>
    </li>
  );
}

/** Aba "Metas e progresso": metas por dia, percentual da semana e do mês, sequência. */
export function MetasTab({ goTo }: { goTo: (tab: "planilha" | "relatorio") => void }) {
  const toast = useToast();
  const [goals, setGoals] = usePersistentState<Goal[]>("progresso:goals", DEFAULT_GOALS);
  const [done, setDone] = usePersistentState<DoneMap>("progresso:done", {});
  const now = useMemo(() => new Date(), []);
  const today = toIso(now);
  const [anchor, setAnchor] = useState(() => weekStart(now));
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [draft, setDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; parsed: ParsedMarks } | null>(null);

  const days = weekDays(anchor);
  const week = rangeStat(goals, done, days, today);
  const isoMonth = monthDays(month.y, month.m);
  const monthStat = rangeStat(goals, done, isoMonth, today);
  const perGoal = goalStats(goals, done, days, today);
  const perWeekday = weekdayStats(goals, done, isoMonth, today);
  const counted = week.days.filter((d) => !d.future).length;
  const sequence = streak(goals, done, today);
  const todayStat = rangeStat(goals, done, [today], today);
  const isThisWeek = days.includes(today);
  const best = [...perWeekday].filter((w) => w.days > 0 && w.pct > 0).sort((a, b) => b.pct - a.pct)[0];

  const exportExcel = () => {
    downloadBytes(exportXlsx(goals, done, isoMonth, today), exportFileName(month.y, month.m));
    toast(`Metas de ${MONTHS[month.m]} baixadas em Excel.`);
  };
  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPending({ name: file.name, parsed: parseXlsxFile(new Uint8Array(await file.arrayBuffer())) });
    } catch (e) {
      toast((e as Error).message || "Não consegui ler a planilha.", "error");
    }
  };
  const confirmImport = () => {
    if (!pending) return;
    const r = applyImport(goals, done, pending.parsed, today);
    setGoals(r.goals);
    setDone(r.done);
    setPending(null);
    toast(`Metas importadas: ${r.summary.marked} marcações em ${r.summary.days} dias.`);
  };
  const plan = pending ? planImport(goals, pending.parsed, today) : null;

  const shiftMonth = (n: number) =>
    setMonth(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const add = () => {
    const next = addGoal(goals, draft);
    if (next === goals) return;
    setGoals(next);
    setDraft("");
  };

  return (
    <div id="pg-panel-metas" role="tabpanel" aria-labelledby="pg-tab-metas">
      <div className="row pg-tools">
        <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={14} /> Importar metas (Excel)</button>
        <button type="button" className="btn btn-ghost" onClick={exportExcel}><FileSpreadsheet size={14} /> Exportar metas (Excel)</button>
        <input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden aria-label="Escolher planilha de metas para importar" onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>

      <section className="dtiles" aria-label="Resumo do progresso">
        <div className="dtile pg-tile pg-tile-donut">
          <Donut pct={week.pct} label="Progresso da semana" size={78} />
          <div><span className="dtile-label">Semana</span><strong data-testid="week-pct">{week.pct}%</strong><small>{weekMessage(week.pct, counted)}</small></div>
        </div>
        <div className="dtile pg-tile"><span className="dtile-icon pg-ic-blue"><CalendarCheck size={16} aria-hidden="true" /></span><span className="dtile-label">Hoje</span><strong data-testid="today-count">{todayStat.done} de {goals.length}</strong><small>{goals.length === 0 ? "Cadastre uma meta" : todayStat.pct === 100 ? "Tudo feito hoje" : "metas cumpridas"}</small></div>
        <div className="dtile pg-tile"><span className="dtile-icon pg-ic-orange"><Flame size={16} aria-hidden="true" /></span><span className="dtile-label">Sequência</span><strong data-testid="streak">{sequence} {sequence === 1 ? "dia" : "dias"}</strong><small>com todas as metas</small></div>
        <div className="dtile pg-tile pg-tile-donut">
          <Donut pct={monthStat.pct} label={`Progresso de ${MONTHS[month.m]}`} size={78} />
          <div><span className="dtile-label">{MONTHS[month.m]}</span><strong data-testid="month-pct">{monthStat.pct}%</strong><small>{monthStat.total ? `${monthStat.done} de ${monthStat.total} marcações` : "mês sem dias contados"}</small></div>
        </div>
      </section>

      <section className="panel pg-week" aria-labelledby="pg-week-t">
        <div className="pg-bar-head">
          <h2 id="pg-week-t" className="panel-title">Semana de {rangeLabel(days)}</h2>
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => setAnchor((a) => addDays(a, -7))} aria-label="Semana anterior"><ChevronLeft size={14} /></button>
            <button type="button" className="btn btn-ghost" onClick={() => setAnchor(weekStart(now))} disabled={isThisWeek}>Esta semana</button>
            <button type="button" className="btn btn-ghost" onClick={() => setAnchor((a) => addDays(a, 7))} aria-label="Próxima semana"><ChevronRight size={14} /></button>
          </div>
        </div>

        <div className="pg-main" aria-hidden="true"><span style={{ width: `${week.pct}%`, background: lvColor(week.pct) }} /></div>
        <p className="pg-main-label">Progresso da semana: <strong>{week.pct}%</strong> <span className="muted">({week.done} de {week.total} marcações até hoje)</span></p>

        <div className="pg-bars" role="list" aria-label="Percentual por dia">
          {week.days.map((d) => (
            <div key={d.iso} role="listitem" className={`pg-bar ${d.iso === today ? "is-today" : ""} ${d.future ? "is-future" : ""}`}>
              <span className="pg-bar-pct">{d.future ? "–" : `${d.pct}%`}</span>
              <div className="pg-bar-track" aria-hidden="true"><i style={{ height: `${d.pct}%`, background: lvColor(d.pct, d.future) }} /></div>
              <span className="pg-bar-day">{WEEKDAYS[fromIso(d.iso).getDay()]}</span>
            </div>
          ))}
        </div>
        <LevelLegend />

        {goals.length === 0 ? (
          <p className="empty-inline">Nenhuma meta cadastrada. Adicione suas metas em “Minhas metas” logo abaixo.</p>
        ) : (
          <>
            <div className="pg-scroll">
              <table className="pg-table">
                <caption className="sr-only">Metas cumpridas em cada dia da semana</caption>
                <thead>
                  <tr>
                    <th scope="col">Meta</th>
                    {days.map((iso) => (
                      <th key={iso} scope="col" className={iso === today ? "is-today" : ""}><span>{WEEKDAYS[fromIso(iso).getDay()]}</span><small>{fromIso(iso).getDate()}</small></th>
                    ))}
                    <th scope="col">Semana</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g, gi) => (
                    <tr key={g.id}>
                      <th scope="row"><i className="pg-dot" style={{ background: goalColor(gi) }} aria-hidden="true" />{g.text}</th>
                      {days.map((iso) => {
                        const checked = (done[iso] ?? []).includes(g.id);
                        return (
                          <td key={iso} className={iso === today ? "is-today" : ""}>
                            <input type="checkbox" checked={checked} disabled={iso > today} style={{ accentColor: goalColor(gi) }} onChange={() => setDone((d) => toggleDone(d, iso, g.id, today))} aria-label={`${g.text}, ${longDay(iso)}`} />
                          </td>
                        );
                      })}
                      <td className="pg-goal-pct" style={perGoal[gi].total ? { color: lvColor(perGoal[gi].pct) } : undefined}>{perGoal[gi].total ? `${perGoal[gi].pct}%` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Marcar o dia todo</th>
                    {days.map((iso) => {
                      const st = week.days.find((d) => d.iso === iso)!;
                      const all = st.total > 0 && st.done === st.total;
                      return (
                        <td key={iso} className={iso === today ? "is-today" : ""}>
                          <button type="button" className="pg-all" disabled={iso > today} aria-pressed={all} onClick={() => setDone((d) => setAllForDay(goals, d, iso, !all, today))} aria-label={`${iso > today ? "–" : `${st.pct}%`} ${all ? "desmarcar" : "marcar"} todas as metas, ${longDay(iso)}`}>
                            {iso > today ? "–" : `${st.pct}%`}
                          </button>
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <h3 className="pg-sub">Desempenho por meta nesta semana</h3>
            <div className="pg-goalbars" role="list" aria-label="Percentual por meta">
              {perGoal.map((p, i) => (
                <div key={p.goal.id} role="listitem" className="pg-goalbar">
                  <span className="pg-goalbar-name">{p.goal.text}</span>
                  <div className="pg-wd-track" aria-hidden="true"><i style={{ width: `${p.pct}%`, background: goalColor(i) }} /></div>
                  <span className="pg-wd-pct">{p.total ? `${p.pct}%` : "–"}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="row pg-foot">
          <button type="button" className="btn btn-ghost" onClick={() => { setDone((d) => clearDays(d, days)); toast("Marcações da semana limpas."); }}><RotateCcw size={14} /> Limpar a semana</button>
        </div>
      </section>

      <section className="panel" aria-labelledby="pg-month-t">
        <div className="pg-bar-head">
          <h2 id="pg-month-t" className="panel-title">{MONTHS[month.m]} {month.y}</h2>
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => shiftMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={14} /></button>
            <button type="button" className="btn btn-ghost" onClick={() => shiftMonth(1)} aria-label="Próximo mês"><ChevronRight size={14} /></button>
          </div>
        </div>
        <p className="muted pg-note">Cada quadrado é um dia, colorido pelo desempenho. Clique num dia para abrir a semana dele.{best && <> Seu melhor dia da semana neste mês: <strong>{WEEKDAYS[best.weekday]}</strong> ({best.pct}%).</>}</p>
        <div className="pg-heat" role="group" aria-label={`Dias de ${MONTHS[month.m]}`}>
          {WEEKDAYS.map((w) => <span key={w} className="pg-heat-h" aria-hidden="true">{w}</span>)}
          {Array.from({ length: fromIso(isoMonth[0]).getDay() }, (_, i) => <span key={`b${i}`} aria-hidden="true" />)}
          {monthStat.days.map((d) => (
            <button key={d.iso} type="button" className={`pg-cell ${d.iso === today ? "is-today" : ""}`} style={{ background: lvColor(d.pct, d.future), color: d.future ? "#cbd5e1" : "#0b1220" }} aria-current={d.iso === today ? "date" : undefined} aria-label={`${longDay(d.iso)}: ${d.future ? "ainda não chegou" : `${d.pct}% das metas`}`} onClick={() => setAnchor(weekStart(fromIso(d.iso)))}>
              {fromIso(d.iso).getDate()}
            </button>
          ))}
        </div>
        <LevelLegend />

        <h3 className="pg-sub">Evolução dia a dia</h3>
        <div className="pg-trend" role="img" aria-label={`Percentual de metas por dia em ${MONTHS[month.m]}`}>
          {monthStat.days.map((d) => (
            <div key={d.iso} className="pg-trend-col">
              <div className="pg-trend-track"><i style={{ height: `${d.future ? 0 : Math.max(d.pct, 3)}%`, background: lvColor(d.pct, d.future) }} title={`${longDay(d.iso)}: ${d.future ? "ainda não chegou" : `${d.pct}%`}`} /></div>
              <span>{fromIso(d.iso).getDate()}</span>
            </div>
          ))}
        </div>

        <h3 className="pg-sub">Média por dia da semana</h3>
        <div className="pg-wd" role="list" aria-label="Média por dia da semana">
          {perWeekday.map((w) => (
            <div key={w.weekday} role="listitem" className="pg-wd-item">
              <span className="pg-wd-name">{WEEKDAYS[w.weekday]}</span>
              <div className="pg-wd-track" aria-hidden="true"><i style={{ width: `${w.pct}%`, background: lvColor(w.pct, w.days === 0) }} /></div>
              <span className="pg-wd-pct">{w.days ? `${w.pct}%` : "–"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="pg-goals-t">
        <h2 id="pg-goals-t" className="panel-title">Minhas metas</h2>
        <p className="muted pg-note">Edite o nome, mude a ordem ou exclua. Excluir uma meta apaga só as marcações dela. Até {MAX_GOALS} metas.</p>
        <ul className="pg-goals">
          {goals.map((g, i) => (
            <GoalRow key={g.id} goal={g} index={i} total={goals.length} onRename={(t) => setGoals((p) => renameGoal(p, g.id, t))} onMove={(dir) => setGoals((p) => moveGoal(p, g.id, dir))} onRemove={() => { const r = removeGoal(goals, done, g.id); setGoals(r.goals); setDone(r.done); }} />
          ))}
        </ul>
        <form className="pg-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <input value={draft} maxLength={MAX_GOAL_LEN} onChange={(e) => setDraft(e.target.value)} placeholder="Nova meta, por exemplo: Postar 3 Reels" aria-label="Nova meta" disabled={goals.length >= MAX_GOALS} />
          <button type="submit" className="btn btn-primary" disabled={!draft.trim() || goals.length >= MAX_GOALS}><Plus size={14} /> Adicionar</button>
        </form>
      </section>

      <div className="pg-actions">
        <button type="button" className="btn btn-ghost" onClick={() => goTo("planilha")}><FileSpreadsheet size={14} /> Importar/Exportar Planilha</button>
        <button type="button" className="btn btn-primary" onClick={() => goTo("relatorio")}><FileText size={14} /> Gerar Relatório</button>
      </div>

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title="Importar metas"
        footer={<><button type="button" className="btn btn-ghost" onClick={() => setPending(null)}>Cancelar</button><button type="button" className="btn btn-primary" onClick={confirmImport}>Importar</button></>}
      >
        {pending && plan && (
          <div className="stack">
            <p>Arquivo: <strong>{pending.name}</strong></p>
            <ul className="pg-plan">
              <li><strong>{pending.parsed.rows.length}</strong> {pending.parsed.rows.length === 1 ? "meta" : "metas"} na planilha, <strong>{plan.goalsAdded}</strong> {plan.goalsAdded === 1 ? "nova" : "novas"}</li>
              <li><strong>{plan.days}</strong> {plan.days === 1 ? "dia" : "dias"} com <strong>{plan.marked}</strong> {plan.marked === 1 ? "marcação" : "marcações"}</li>
              {plan.futureIgnored > 0 && <li>{plan.futureIgnored} {plan.futureIgnored === 1 ? "dia futuro será ignorado" : "dias futuros serão ignorados"}</li>}
              {plan.goalsSkipped > 0 && <li>{plan.goalsSkipped} {plan.goalsSkipped === 1 ? "meta ficará de fora" : "metas ficarão de fora"} (limite de {MAX_GOALS})</li>}
            </ul>
            <p className="muted">Para as metas e os dias que estão na planilha, as marcações atuais serão substituídas. O que não está no arquivo continua como está.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
