import type { GradeStats } from "./grade";
import { WEEKDAYS, fromIso, goalStats, rangeLabel, rangeStat, streak, weekdayStats, type DoneMap, type Goal } from "./progresso";

export interface Report {
  title: string;
  period: string;
  pct: number;
  done: number;
  total: number;
  countedDays: number;
  perfectDays: number;
  streak: number;
  goals: { text: string; done: number; total: number; pct: number }[];
  weekdays: { name: string; pct: number; days: number }[];
  bestGoal?: string;
  weakestGoal?: string;
  bestWeekday?: string;
  weakestWeekday?: string;
  days: { iso: string; label: string; done: number; total: number; pct: number }[];
  verdict: string;
}

const dm = (iso: string) => {
  const d = fromIso(iso);
  return `${WEEKDAYS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function verdict(p: number, counted: number, perfect: number): string {
  if (counted === 0) return "O período ainda não começou, então não há o que avaliar.";
  if (p >= 90) return `Desempenho excelente: ${perfect} ${perfect === 1 ? "dia" : "dias"} com todas as metas cumpridas.`;
  if (p >= 70) return "Bom desempenho. Poucos ajustes para chegar ao topo.";
  if (p >= 40) return "Desempenho mediano. Vale focar nas metas mais fracas abaixo.";
  return "Desempenho baixo neste período. Comece reduzindo para as metas essenciais e ganhe ritmo.";
}

/** Relatório do período (semana ou mês): percentuais, ranking de metas, melhores dias e dia a dia. */
export function buildReport(goals: Goal[], done: DoneMap, isos: string[], today: string, title: string): Report {
  const st = rangeStat(goals, done, isos, today);
  const counted = st.days.filter((d) => !d.future);
  const perfect = counted.filter((d) => d.total > 0 && d.done === d.total).length;
  const goalRows = goalStats(goals, done, isos, today).map((g) => ({ text: g.goal.text, done: g.done, total: g.total, pct: g.pct }));
  const wd = weekdayStats(goals, done, isos, today).filter((w) => w.days > 0).map((w) => ({ name: WEEKDAYS[w.weekday], pct: w.pct, days: w.days }));
  const byPct = [...goalRows].filter((g) => g.total > 0).sort((a, b) => b.pct - a.pct);
  const wdSorted = [...wd].sort((a, b) => b.pct - a.pct);
  return {
    title,
    period: rangeLabel(isos),
    pct: st.pct,
    done: st.done,
    total: st.total,
    countedDays: counted.length,
    perfectDays: perfect,
    streak: streak(goals, done, today),
    goals: goalRows,
    weekdays: wd,
    bestGoal: byPct.length > 1 && byPct[0].pct > byPct[byPct.length - 1].pct ? `${byPct[0].text} (${byPct[0].pct}%)` : byPct.length === 1 ? `${byPct[0].text} (${byPct[0].pct}%)` : undefined,
    weakestGoal: byPct.length > 1 && byPct[0].pct > byPct[byPct.length - 1].pct ? `${byPct[byPct.length - 1].text} (${byPct[byPct.length - 1].pct}%)` : undefined,
    bestWeekday: wdSorted.length && wdSorted[0].pct > 0 ? `${wdSorted[0].name} (${wdSorted[0].pct}%)` : undefined,
    weakestWeekday: wdSorted.length > 1 && wdSorted[0].pct > wdSorted[wdSorted.length - 1].pct ? `${wdSorted[wdSorted.length - 1].name} (${wdSorted[wdSorted.length - 1].pct}%)` : undefined,
    days: counted.map((d) => ({ iso: d.iso, label: dm(d.iso), done: d.done, total: d.total, pct: d.pct })),
    verdict: verdict(st.pct, counted.length, perfect),
  };
}

export function reportToText(r: Report, prod?: GradeStats): string {
  const L: string[] = [];
  L.push(`RELATÓRIO DE PROGRESSO: ${r.title}`, `Período: ${r.period}`, "");
  L.push(`Percentual geral: ${r.pct}% (${r.done} de ${r.total} marcações em ${r.countedDays} ${r.countedDays === 1 ? "dia" : "dias"})`);
  L.push(`Dias com todas as metas: ${r.perfectDays}`, `Sequência atual: ${r.streak} ${r.streak === 1 ? "dia" : "dias"}`, "", r.verdict, "");
  L.push("METAS");
  for (const g of r.goals) L.push(`- ${g.text}: ${g.pct}% (${g.done} de ${g.total} dias)`);
  if (r.bestGoal) L.push("", `Meta mais cumprida: ${r.bestGoal}`);
  if (r.weakestGoal) L.push(`Meta que mais precisa de atenção: ${r.weakestGoal}`);
  if (r.weekdays.length) {
    L.push("", "DIAS DA SEMANA");
    L.push(r.weekdays.map((w) => `${w.name} ${w.pct}%`).join(" | "));
    if (r.bestWeekday) L.push(`Melhor dia: ${r.bestWeekday}`);
    if (r.weakestWeekday) L.push(`Pior dia: ${r.weakestWeekday}`);
  }
  if (r.days.length) {
    L.push("", "DIA A DIA");
    for (const d of r.days) L.push(`${d.label}: ${d.done} de ${d.total} (${d.pct}%)`);
  }
  if (prod && prod.total > 0) {
    L.push("", "PLANILHA DE PRODUÇÃO");
    L.push(`Concluído: ${prod.pct}% (${prod.counts["Concluído"]} de ${prod.total}) | Editando: ${prod.counts.Editando} | Não começou: ${prod.counts["Não começou"]}`);
    for (const c of prod.columns) L.push(`- ${c.title}: ${c.pct}% concluído (${c.counts["Concluído"]} concluídos, ${c.counts.Editando} editando, ${c.counts["Não começou"]} não começou)`);
  }
  return L.join("\n") + "\n";
}
