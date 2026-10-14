import { readXlsx } from "./xlsx";

/** Lê CSV com aspas, vírgula, ponto e vírgula ou tabulação, com ou sem BOM. */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, "");
  const first = t.split(/\r?\n/, 1)[0] ?? "";
  const count = (c: string) => first.split(c).length - 1;
  const ranked = [";", "\t", ","].map((c) => [c, count(c)] as const).sort((a, b) => b[1] - a[1]);
  const delim = ranked[0][1] > 0 ? ranked[0][0] : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

export type TableRows = (string | number | null)[][];

/** Serializa uma tabela retangular em CSV separado por ponto e vírgula, compatível com planilhas brasileiras. */
export function serializeCsv(rows: TableRows, delimiter = ";"): string {
  const width = rows.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  const escape = (value: string | number | null) => {
    const text = value === null ? "" : String(value);
    return text.includes(delimiter) || /["\r\n]/.test(text)
      ? `"${text.replaceAll('"', '""')}"`
      : text;
  };
  const content = rows
    .map((row) => Array.from({ length: width }, (_, column) => escape(row[column] ?? null)).join(delimiter))
    .join("\r\n");
  return `\uFEFF${content}\r\n`;
}

export interface TableFile {
  sheets: { name: string; rows: TableRows }[];
}

function decode(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/** Abre .xlsx ou .csv e devolve as abas (o CSV vira uma aba só). */
export function readTableFile(fileName: string, bytes: Uint8Array): TableFile {
  if (/\.(csv|txt)$/i.test(fileName)) {
    const rows = parseCsv(decode(bytes)).map((r) => r.map((c) => (c === "" ? null : c)));
    if (!rows.length) throw new Error("O arquivo está vazio.");
    return { sheets: [{ name: "CSV", rows }] };
  }
  const sheets = readXlsx(bytes);
  if (!sheets.some((s) => s.rows.length)) throw new Error("O arquivo está vazio.");
  return { sheets };
}
