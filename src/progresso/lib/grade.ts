import type { TableRows } from "./csv";
import { STATUS_COLORS } from "./cores";
import { norm, parseDateTime, fmtDate, fmtDateTime } from "./valores";
import { writeXlsx, type Cell, type SheetData } from "./xlsx";

export const STATUSES = ["Concluído", "Editando", "Não começou"] as const;
export type Status = (typeof STATUSES)[number];
export const MAX_ROWS = 1000;
export const MAX_COLS = 40;

export type GridCell = string | number | null;
/** Planilha editável: primeira linha = cabeçalho. */
export interface Grade {
  name: string;
  rows: GridCell[][];
}
export const EMPTY_GRADE: Grade = { name: "", rows: [] };

export function currentWeekLabel(date = new Date()): string {
  const localDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = localDay.getUTCDay() || 7;
  localDay.setUTCDate(localDay.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(localDay.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((localDay.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `Semana ${week}`;
}

export function fillWeekDefaults(grade: Grade, date = new Date()): Grade {
  const weekColumns = grade.rows[0]?.map((header, index) => norm(header) === "semana" ? index : -1).filter((index) => index >= 0) ?? [];
  let changed = false;
  const rows = grade.rows.map((row, index) => {
    if (!index) return row;
    const empty = weekColumns.filter((column) => row[column] == null || String(row[column]).trim() === "");
    if (!empty.length) return row;
    changed = true;
    return row.map((value, column) => empty.includes(column) ? currentWeekLabel(date) : value);
  });
  return changed ? { ...grade, rows } : grade;
}

const WORDS: Record<string, Status> = {
  concluido: "Concluído", concluida: "Concluído", feito: "Concluído", pronto: "Concluído", postado: "Concluído", publicado: "Concluído", ok: "Concluído", sim: "Concluído",
  editando: "Editando", "em edicao": "Editando", "em andamento": "Editando", andamento: "Editando", produzindo: "Editando", "em producao": "Editando",
  "nao comecou": "Não começou", "nao concluiu": "Não começou", "nao concluido": "Não começou", pendente: "Não começou", "a fazer": "Não começou",
};

/** Status conhecido de um texto de célula (null se não for um status). */
export const statusOfText = (v: GridCell | undefined): Status | null => (v === null || v === undefined ? null : (WORDS[norm(v)] ?? null));
export const nextStatus = (s: Status | null): Status => (s === null ? "Concluído" : STATUSES[(STATUSES.indexOf(s) + 1) % STATUSES.length]);

const PLATFORMS = ["facebook", "tiktok", "pinterest", "instagram", "shopee video", "shopee videos", "youtube short", "youtube shorts", "kwai", "reels", "stories", "status"];

/** Colunas tratadas como status: cabeçalho de plataforma, ou coluna em que a maioria das células preenchidas é um status. */
export function detectStatusColumns(rows: GridCell[][]): number[] {
  if (rows.length < 2) return [];
  const out: number[] = [];
  const width = Math.max(...rows.map((r) => r.length));
  for (let c = 0; c < width; c++) {
    const head = norm(rows[0][c]);
    const body = rows.slice(1).map((r) => r[c]).filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
    const known = body.filter((v) => statusOfText(v) !== null).length;
    const byHeader = PLATFORMS.includes(head) && body.every((v) => typeof v !== "number");
    if ((byHeader && known >= Math.ceil(body.length / 2)) || (body.length >= 1 && known / body.length >= 0.6 && known >= 1)) out.push(c);
    else if (byHeader && body.length === 0) out.push(c);
  }
  return out;
}

/** Monta a grade a partir das linhas lidas: retangular, sem linhas/colunas vazias no fim, datas do Excel viram texto. */
export function gradeFromRows(name: string, rows: TableRows): Grade {
  let r = rows.map((x) => [...x]);
  while (r.length && r[r.length - 1].every((v) => v === null || v === undefined || String(v).trim() === "")) r.pop();
  if (!r.length) throw new Error("A planilha está vazia.");
  r = r.slice(0, MAX_ROWS + 1);
  let width = Math.max(...r.map((x) => x.length));
  while (width > 1 && r.every((x) => x[width - 1] === null || x[width - 1] === undefined || String(x[width - 1]).trim() === "")) width--;
  width = Math.min(width, MAX_COLS);
  const header = r[0];
  const dateCols = header.map((h, i) => (/^(data|horario)/.test(norm(h)) ? i : -1)).filter((i) => i >= 0);
  return fillWeekDefaults({
    name,
    rows: r.map((row, ri) =>
      Array.from({ length: width }, (_, c) => {
        const v = row[c] ?? null;
        if (ri > 0 && typeof v === "number" && dateCols.includes(c)) {
          const d = parseDateTime(v);
          if (d) return d.getHours() || d.getMinutes() ? fmtDateTime(d) : fmtDate(d);
        }
        return v;
      }),
    ),
  });
}

export function setCell(g: Grade, r: number, c: number, value: GridCell): Grade {
  if (r < 0 || r >= g.rows.length) return g;
  return { ...g, rows: g.rows.map((row, i) => (i === r ? row.map((v, j) => (j === c ? value : v)) : row)) };
}
export function addRow(g: Grade, date = new Date()): Grade {
  if (!g.rows.length || g.rows.length > MAX_ROWS) return g;
  return { ...g, rows: [...g.rows, g.rows[0].map((header) => norm(header) === "semana" ? currentWeekLabel(date) : null)] };
}
export function removeRow(g: Grade, r: number): Grade {
  return r <= 0 || r >= g.rows.length ? g : { ...g, rows: g.rows.filter((_, i) => i !== r) };
}
export function addColumn(g: Grade, title: string): Grade {
  const t = title.replace(/\s+/g, " ").trim();
  if (!t || !g.rows.length || g.rows[0].length >= MAX_COLS || g.rows[0].some((h) => norm(h) === norm(t))) return g;
  return { ...g, rows: g.rows.map((row, i) => [...row, i === 0 ? t : norm(t) === "semana" ? currentWeekLabel() : null]) };
}
export function removeColumn(g: Grade, c: number): Grade {
  if (g.rows.length === 0 || g.rows[0].length <= 1) return g;
  return { ...g, rows: g.rows.map((row) => row.filter((_, j) => j !== c)) };
}

export interface StatusStat {
  col: number;
  title: string;
  counts: Record<Status, number>;
  empty: number;
  total: number;
  pct: number;
}
export interface GradeStats {
  columns: StatusStat[];
  counts: Record<Status, number>;
  total: number;
  /** % de Concluído entre todas as células de status preenchidas. */
  pct: number;
}

export function gradeStats(g: Grade): GradeStats {
  const cols = detectStatusColumns(g.rows);
  const all: Record<Status, number> = { "Concluído": 0, Editando: 0, "Não começou": 0 };
  const columns = cols.map((col) => {
    const counts: Record<Status, number> = { "Concluído": 0, Editando: 0, "Não começou": 0 };
    let empty = 0;
    for (const row of g.rows.slice(1)) {
      const s = statusOfText(row[col]);
      if (s) counts[s]++;
      else empty++;
    }
    for (const s of STATUSES) all[s] += counts[s];
    const filled = STATUSES.reduce((n, s) => n + counts[s], 0);
    return { col, title: String(g.rows[0][col] ?? `Coluna ${col + 1}`), counts, empty, total: filled, pct: filled ? Math.round((counts["Concluído"] / filled) * 100) : 0 };
  });
  const total = STATUSES.reduce((n, s) => n + all[s], 0);
  return { columns, counts: all, total, pct: total ? Math.round((all["Concluído"] / total) * 100) : 0 };
}

/** Abas para o Excel: a planilha com as células de status coloridas + resumo por coluna de status. */
export function gradeSheets(g: Grade): SheetData[] {
  const cols = new Set(detectStatusColumns(g.rows));
  const rows: Cell[][] = g.rows.map((row, ri) =>
    row.map((v, c) => {
      if (ri === 0) return { v: v === null ? null : String(v), bold: true };
      const s = cols.has(c) ? statusOfText(v) : null;
      return s ? { v: s, fill: STATUS_COLORS[s] } : v;
    }),
  );
  const width = g.rows[0]?.length ?? 1;
  const sheets: SheetData[] = [{ name: "Planilha", rows, widths: Array.from({ length: width }, (_, i) => (i === 0 ? 34 : 16)) }];
  const st = gradeStats(g);
  if (st.columns.length) {
    const sum: Cell[][] = [["Coluna", ...STATUSES, "% concluído"]];
    for (const c of st.columns) sum.push([c.title, ...STATUSES.map((s) => c.counts[s]), c.pct]);
    sum.push([{ v: "Total", bold: true }, ...STATUSES.map((s) => ({ v: st.counts[s], bold: true })), { v: st.pct, bold: true }]);
    sheets.push({ name: "Resumo", rows: sum, widths: [24, 14, 12, 14, 14], boldHeader: true });
  }
  return sheets;
}

export const exportGrade = (g: Grade): Uint8Array => writeXlsx(gradeSheets(g));

/** Modelo de planilha de produção de conteúdo. */
export function modeloGrade(): Grade {
  const cols = ["Facebook", "TikTok", "Pinterest", "Instagram", "Shopee Video", "YouTube Short"];
  return {
    name: "modelo",
    rows: [
      ["Semana", "Produto", "Data", ...cols],
      [currentWeekLabel(), "Produto exemplo 1", fmtDate(new Date()), "Concluído", "Editando", "Não começou", "Concluído", "Editando", "Não começou"],
      [currentWeekLabel(), "Produto exemplo 2", null, "Não começou", "Não começou", "Não começou", "Não começou", "Não começou", "Não começou"],
    ],
  };
}
