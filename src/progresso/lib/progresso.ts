import { QUOTES, type Quote } from "../data/quotes";

export interface Goal {
  id: string;
  text: string;
}
/** Dia (AAAA-MM-DD) → ids das metas cumpridas naquele dia. */
export type DoneMap = Record<string, string[]>;

export const DEFAULT_GOALS: Goal[] = [
  { id: "g-stories", text: "Postar Stories" },
  { id: "g-reels", text: "Postar Reels" },
  { id: "g-producao", text: "Produzir Reels do dia seguinte" },
  { id: "g-metricas", text: "Analisar métricas da Shopee" },
];

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
export const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"] as const;
export const MAX_GOALS = 12;
export const MAX_GOAL_LEN = 80;

const p2 = (n: number) => String(n).padStart(2, "0");
export const toIso = (d: Date): string => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const fromIso = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
export const addDays = (d: Date, n: number): Date => {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
  return r;
};

/** Domingo da semana que contém o dia (a semana vai de Dom a Sáb, como no dashboard original). */
export const weekStart = (d: Date): Date => addDays(d, -d.getDay());
export const weekDays = (start: Date): string[] => Array.from({ length: 7 }, (_, i) => toIso(addDays(start, i)));
export const monthDays = (year: number, month: number): string[] => {
  const n = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: n }, (_, i) => `${year}-${p2(month + 1)}-${p2(i + 1)}`);
};

export const pct = (done: number, total: number): number => (total > 0 ? Math.round((done / total) * 100) : 0);

export interface DayStat {
  iso: string;
  done: number;
  total: number;
  pct: number;
  /** Dia que ainda não chegou: não conta no percentual. */
  future: boolean;
}

const validIds = (goals: Goal[], done: DoneMap, iso: string): number => {
  const ids = new Set(goals.map((g) => g.id));
  return (done[iso] ?? []).filter((id) => ids.has(id)).length;
};

export function dayStat(goals: Goal[], done: DoneMap, iso: string, today: string): DayStat {
  const future = iso > today;
  const d = future ? 0 : validIds(goals, done, iso);
  return { iso, done: d, total: goals.length, pct: pct(d, goals.length), future };
}

export interface RangeStat {
  days: DayStat[];
  done: number;
  total: number;
  pct: number;
}

/** Percentual de um período: só conta os dias até hoje (dias futuros não puxam a média para baixo). */
export function rangeStat(goals: Goal[], done: DoneMap, isos: string[], today: string): RangeStat {
  const days = isos.map((iso) => dayStat(goals, done, iso, today));
  const counted = days.filter((d) => !d.future);
  const dn = counted.reduce((s, d) => s + d.done, 0);
  const tt = counted.length * goals.length;
  return { days, done: dn, total: tt, pct: pct(dn, tt) };
}

/** Quanto cada meta foi cumprida no período. */
export function goalStats(goals: Goal[], done: DoneMap, isos: string[], today: string): { goal: Goal; done: number; total: number; pct: number }[] {
  const counted = isos.filter((i) => i <= today);
  return goals.map((goal) => {
    const n = counted.filter((i) => (done[i] ?? []).includes(goal.id)).length;
    return { goal, done: n, total: counted.length, pct: pct(n, counted.length) };
  });
}

/** Desempenho médio por dia da semana dentro do período (Dom..Sáb), como as barras do dashboard original. */
export function weekdayStats(goals: Goal[], done: DoneMap, isos: string[], today: string): { weekday: number; pct: number; days: number }[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const mine = isos.filter((i) => i <= today && fromIso(i).getDay() === weekday);
    const dn = mine.reduce((s, i) => s + validIds(goals, done, i), 0);
    return { weekday, pct: pct(dn, mine.length * goals.length), days: mine.length };
  });
}

/** Dias seguidos (até hoje) com todas as metas cumpridas. Hoje ainda aberto não quebra a sequência. */
export function streak(goals: Goal[], done: DoneMap, today: string): number {
  if (goals.length === 0) return 0;
  let n = 0;
  let cur = fromIso(today);
  const full = (iso: string) => validIds(goals, done, iso) === goals.length;
  if (!full(toIso(cur))) cur = addDays(cur, -1);
  while (full(toIso(cur)) && n < 3660) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

export function toggleDone(done: DoneMap, iso: string, goalId: string, today: string): DoneMap {
  if (iso > today) return done;
  const cur = done[iso] ?? [];
  const next = cur.includes(goalId) ? cur.filter((x) => x !== goalId) : [...cur, goalId];
  const copy = { ...done };
  if (next.length) copy[iso] = next;
  else delete copy[iso];
  return copy;
}

export function setAllForDay(goals: Goal[], done: DoneMap, iso: string, value: boolean, today: string): DoneMap {
  if (iso > today) return done;
  const copy = { ...done };
  if (value && goals.length) copy[iso] = goals.map((g) => g.id);
  else delete copy[iso];
  return copy;
}

export function clearDays(done: DoneMap, isos: string[]): DoneMap {
  const copy = { ...done };
  isos.forEach((i) => delete copy[i]);
  return copy;
}

export const cleanText = (s: string): string => s.replace(/\s+/g, " ").trim().slice(0, MAX_GOAL_LEN);

export function addGoal(goals: Goal[], text: string): Goal[] {
  const t = cleanText(text);
  if (!t || goals.length >= MAX_GOALS) return goals;
  let n = goals.length + 1;
  while (goals.some((g) => g.id === `g-${n}`)) n++;
  const base = `g-${Date.now().toString(36)}-${n}`;
  return [...goals, { id: base, text: t }];
}

export function renameGoal(goals: Goal[], id: string, text: string): Goal[] {
  const t = cleanText(text);
  if (!t) return goals;
  return goals.map((g) => (g.id === id ? { ...g, text: t } : g));
}

export function moveGoal(goals: Goal[], id: string, dir: -1 | 1): Goal[] {
  const i = goals.findIndex((g) => g.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= goals.length) return goals;
  const copy = [...goals];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

/** Remove a meta e limpa as marcações dela (o histórico das outras não muda). */
export function removeGoal(goals: Goal[], done: DoneMap, id: string): { goals: Goal[]; done: DoneMap } {
  const nextDone: DoneMap = {};
  for (const [iso, ids] of Object.entries(done)) {
    const rest = ids.filter((x) => x !== id);
    if (rest.length) nextDone[iso] = rest;
  }
  return { goals: goals.filter((g) => g.id !== id), done: nextDone };
}

/** Frase do dia: muda a cada dia e repete só depois de percorrer a lista toda. */
export function quoteOfDay(d: Date, quotes: Quote[] = QUOTES): Quote {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86400000);
  return quotes[(((day - 1) % quotes.length) + quotes.length) % quotes.length];
}

export const rangeLabel = (isos: string[]): string => {
  const a = fromIso(isos[0]);
  const b = fromIso(isos[isos.length - 1]);
  const m = (d: Date) => MONTHS[d.getMonth()].slice(0, 3).toLowerCase();
  return a.getMonth() === b.getMonth() ? `${a.getDate()} a ${b.getDate()} de ${m(b)}` : `${a.getDate()} ${m(a)} a ${b.getDate()} ${m(b)}`;
};

/** Recado curto conforme o desempenho da semana. */
export function weekMessage(p: number, counted: number): string {
  if (counted === 0) return "Essa semana ainda não começou.";
  if (p >= 100) return "Semana perfeita! Todas as metas cumpridas.";
  if (p >= 80) return "Quase lá, ritmo excelente.";
  if (p >= 50) return "Bom ritmo. Dá para fechar a semana forte.";
  if (p > 0) return "Já começou. Marque as metas de hoje para subir o percentual.";
  return "Nenhuma meta marcada ainda. Comece pela mais fácil.";
}
