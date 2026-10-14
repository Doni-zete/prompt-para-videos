import { MAX_GOALS, cleanText, goalStats, rangeStat, toIso, type DoneMap, type Goal } from "./progresso";
import { readXlsx, writeXlsx, type SheetData } from "./xlsx";

export const MARKS_SHEET = "Marcações";
export const SUMMARY_SHEET = "Resumo";
export const TOTAL_LABEL = "Total do dia (%)";
const MARK = "x";

const br = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Abas do arquivo exportado: "Marcações" (metas × dias, com "x") e "Resumo" (percentual por meta). */
export function buildSheets(goals: Goal[], done: DoneMap, isos: string[], today: string): SheetData[] {
  const stat = rangeStat(goals, done, isos, today);
  const marks: SheetData["rows"] = [["Meta", ...isos.map(br)]];
  for (const g of goals) marks.push([g.text, ...isos.map((i) => ((done[i] ?? []).includes(g.id) ? MARK : null))]);
  marks.push([TOTAL_LABEL, ...stat.days.map((d) => (d.future ? null : d.pct))]);
  const per = goalStats(goals, done, isos, today);
  const summary: SheetData["rows"] = [["Meta", "Dias cumpridos", "Dias contados", "Percentual (%)"]];
  for (const p of per) summary.push([p.goal.text, p.done, p.total, p.pct]);
  summary.push([], ["Período", `${br(isos[0])} a ${br(isos[isos.length - 1])}`], ["Percentual geral (%)", stat.pct], ["Marcações", `${stat.done} de ${stat.total}`]);
  return [
    { name: MARKS_SHEET, rows: marks, widths: [34, ...isos.map(() => 11)], boldHeader: true },
    { name: SUMMARY_SHEET, rows: summary, widths: [34, 16, 15, 16], boldHeader: true },
  ];
}

export const exportFileName = (year: number, month: number) => `progresso-semanal-${year}-${String(month + 1).padStart(2, "0")}.xlsx`;

export function exportXlsx(goals: Goal[], done: DoneMap, isos: string[], today: string): Uint8Array {
  return writeXlsx(buildSheets(goals, done, isos, today));
}

const TRUE_WORDS = new Set(["x", "✓", "✔", "1", "sim", "s", "true", "verdadeiro", "ok", "feito", "v"]);
export const isMarked = (v: string | number | null | undefined): boolean => v !== null && v !== undefined && TRUE_WORDS.has(norm(String(v)));

/** Cabeçalho de dia: "10/10/2026", "2026-10-10" ou data do Excel (número de série). */
export function parseDateCell(v: string | number | null | undefined): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") {
    if (v < 36526 || v > 80000) return null; // 2000 a ~2118
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  const s = v.trim();
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  let y: number, mo: number, d: number;
  if (m) [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s))) [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else return null;
  const dt = new Date(y, mo - 1, d, 12);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return toIso(dt);
}

export interface ParsedMarks {
  dates: string[];
  rows: { name: string; marks: Record<string, boolean> }[];
}

/** Lê a aba de marcações. Erro com mensagem clara se não achar o cabeçalho "Meta" com datas. */
export function parseMarks(rows: (string | number | null)[][]): ParsedMarks {
  const hi = rows.findIndex((r) => r && r[0] !== null && r[0] !== undefined && norm(String(r[0])) === "meta" && r.slice(1).some((c) => parseDateCell(c)));
  if (hi < 0) throw new Error("Não achei o cabeçalho: a primeira coluna deve se chamar “Meta” e as colunas seguintes devem ser datas (por exemplo 10/10/2026).");
  const header = rows[hi];
  const cols: { idx: number; iso: string }[] = [];
  header.forEach((c, idx) => {
    const iso = idx === 0 ? null : parseDateCell(c);
    if (iso && !cols.some((x) => x.iso === iso)) cols.push({ idx, iso });
  });
  const out: ParsedMarks["rows"] = [];
  for (const r of rows.slice(hi + 1)) {
    if (!r || r[0] === null || r[0] === undefined) continue;
    const name = cleanText(String(r[0]));
    if (!name || norm(name) === norm(TOTAL_LABEL)) continue;
    const marks: Record<string, boolean> = {};
    for (const c of cols) marks[c.iso] = isMarked(r[c.idx]);
    out.push({ name, marks });
  }
  if (!out.length) throw new Error("A planilha não tem nenhuma meta abaixo do cabeçalho.");
  return { dates: cols.map((c) => c.iso).sort(), rows: out };
}

/** Escolhe a aba "Marcações" (ou a primeira que tenha o cabeçalho certo). */
export function parseXlsxFile(bytes: Uint8Array): ParsedMarks {
  const sheets = readXlsx(bytes);
  const ordered = [...sheets.filter((s) => norm(s.name) === norm(MARKS_SHEET)), ...sheets.filter((s) => norm(s.name) !== norm(MARKS_SHEET))];
  let lastErr: Error | null = null;
  for (const s of ordered) {
    try {
      return parseMarks(s.rows);
    } catch (e) {
      lastErr ??= e as Error;
    }
  }
  throw lastErr ?? new Error("Planilha vazia.");
}

export interface ImportSummary {
  goalsAdded: number;
  goalsSkipped: number;
  days: number;
  marked: number;
  futureIgnored: number;
}

/** Resumo do que a importação vai fazer (mostrado antes de confirmar). */
export function planImport(goals: Goal[], parsed: ParsedMarks, today: string): ImportSummary {
  const known = new Set(goals.map((g) => norm(g.text)));
  let room = MAX_GOALS - goals.length;
  let added = 0;
  let skipped = 0;
  const kept = new Set<string>();
  for (const r of parsed.rows) {
    const k = norm(r.name);
    if (known.has(k) || kept.has(k)) continue;
    if (room > 0) {
      room--;
      added++;
      kept.add(k);
    } else skipped++;
  }
  const dates = parsed.dates.filter((d) => d <= today);
  const marked = parsed.rows.reduce((s, r) => s + dates.filter((d) => r.marks[d]).length, 0);
  return { goalsAdded: added, goalsSkipped: skipped, days: dates.length, marked, futureIgnored: parsed.dates.length - dates.length };
}

/** Aplica a planilha: metas novas entram no fim; para as metas e dias que estão no arquivo as marcações são substituídas; o resto fica igual. */
export function applyImport(goals: Goal[], done: DoneMap, parsed: ParsedMarks, today: string): { goals: Goal[]; done: DoneMap; summary: ImportSummary } {
  const summary = planImport(goals, parsed, today);
  const nextGoals = [...goals];
  const idOf = new Map<string, string>(nextGoals.map((g) => [norm(g.text), g.id]));
  let seq = 0;
  for (const r of parsed.rows) {
    const k = norm(r.name);
    if (idOf.has(k) || nextGoals.length >= MAX_GOALS) continue;
    let id = `g-imp-${Date.now().toString(36)}-${seq++}`;
    while (nextGoals.some((g) => g.id === id)) id = `${id}x`;
    nextGoals.push({ id, text: r.name });
    idOf.set(k, id);
  }
  const nextDone: DoneMap = Object.fromEntries(Object.entries(done).map(([k, v]) => [k, [...v]]));
  const dates = parsed.dates.filter((d) => d <= today);
  for (const r of parsed.rows) {
    const id = idOf.get(norm(r.name));
    if (!id) continue;
    for (const d of dates) {
      const cur = new Set(nextDone[d] ?? []);
      if (r.marks[d]) cur.add(id);
      else cur.delete(id);
      if (cur.size) nextDone[d] = [...cur];
      else delete nextDone[d];
    }
  }
  return { goals: nextGoals, done: nextDone, summary };
}
