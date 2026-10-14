import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

/** Célula: valor simples ou valor com cor de fundo (hex RRGGBB) e/ou negrito. */
export type Cell = string | number | null | { v: string | number | null; fill?: string; bold?: boolean };

/** Uma aba da planilha: linhas de células (texto ou número; null = vazia). */
export interface SheetData {
  name: string;
  rows: Cell[][];
  /** Larguras das colunas, em caracteres (opcional). */
  widths?: number[];
  /** Deixa a primeira linha em negrito. */
  boldHeader?: boolean;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// remove caracteres que o XML não aceita
const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

export function colLetter(i: number): string {
  let n = i + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function colIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

const safeSheetName = (n: string, i: number) => clean(n).replace(/[\\/?*[\]:]/g, " ").slice(0, 31).trim() || `Aba${i + 1}`;

/** Estilos usados no arquivo (negrito e cores de fundo), compartilhados entre as abas. */
function makeStyles() {
  const fills: string[] = [];
  const xfs: { fill: number; bold: boolean }[] = [{ fill: 0, bold: false }];
  return {
    idFor(fill?: string, bold?: boolean): number {
      if (!fill && !bold) return 0;
      let fi = 0;
      if (fill) {
        const hex = fill.replace(/^#/, "").toUpperCase();
        let k = fills.indexOf(hex);
        if (k < 0) k = fills.push(hex) - 1;
        fi = k + 2;
      }
      let id = xfs.findIndex((x) => x.fill === fi && x.bold === !!bold);
      if (id < 0) id = xfs.push({ fill: fi, bold: !!bold }) - 1;
      return id;
    },
    xml(): string {
      const fillXml = fills.map((h) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${h}"/><bgColor indexed="64"/></patternFill></fill>`).join("");
      const xfXml = xfs
        .map((x) => `<xf numFmtId="0" fontId="${x.bold ? 1 : 0}" fillId="${x.fill}" borderId="0" xfId="0"${x.bold ? ' applyFont="1"' : ""}${x.fill ? ' applyFill="1"' : ""}/>`)
        .join("");
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="${fills.length + 2}"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${fillXml}</fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfXml}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/></styleSheet>`;
    },
  };
}

function sheetXml(s: SheetData, st: ReturnType<typeof makeStyles>): string {
  const cols = s.widths?.length ? `<cols>${s.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>` : "";
  const rows = s.rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => {
          const obj = cell !== null && typeof cell === "object" ? cell : { v: cell };
          const v = obj.v;
          const sid = st.idFor(obj.fill, ("bold" in obj && obj.bold) || (s.boldHeader && r === 0));
          if (v === null || v === "") return sid ? `<c r="${colLetter(c)}${r + 1}" s="${sid}"/>` : "";
          const ref = `${colLetter(c)}${r + 1}`;
          const style = sid ? ` s="${sid}"` : "";
          if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref}"${style}><v>${v}</v></c>`;
          return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(clean(String(v)))}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rows}</sheetData></worksheet>`;
}

/** Gera um arquivo .xlsx (várias abas, texto e números) sem depender de servidor. */
export function writeXlsx(sheets: SheetData[]): Uint8Array {
  const names = sheets.map((s, i) => safeSheetName(s.name, i));
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
        .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
        .join("")}</Types>`,
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names
        .map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join("")}</sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
        .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
        .join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ),
  };
  const st = makeStyles();
  sheets.forEach((s, i) => (files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s, st))));
  files["xl/styles.xml"] = strToU8(st.xml());
  return zipSync(files);
}

const unesc = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");

const textOf = (xml: string): string => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unesc(m[1])).join("");

function sharedStrings(files: Record<string, Uint8Array>): string[] {
  const f = files["xl/sharedStrings.xml"];
  if (!f) return [];
  return [...strFromU8(f).matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));
}

function sheetTargets(files: Record<string, Uint8Array>): { name: string; path: string }[] {
  const wb = files["xl/workbook.xml"];
  if (!wb) return [];
  const rels = files["xl/_rels/workbook.xml.rels"] ? strFromU8(files["xl/_rels/workbook.xml.rels"]) : "";
  const target = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const id = /\bId="([^"]*)"/.exec(m[1])?.[1];
    const t = /\bTarget="([^"]*)"/.exec(m[1])?.[1];
    if (id && t) target.set(id, t.startsWith("/") ? t.slice(1) : `xl/${t}`);
  }
  return [...strFromU8(wb).matchAll(/<sheet\b([^>]*)\/?>/g)].flatMap((m, i) => {
    const name = unesc(/\bname="([^"]*)"/.exec(m[1])?.[1] ?? `Aba${i + 1}`);
    const rid = /\br:id="([^"]*)"/.exec(m[1])?.[1];
    const path = (rid && target.get(rid)) || `xl/worksheets/sheet${i + 1}.xml`;
    return [{ name, path }];
  });
}

function parseSheet(xml: string, shared: string[]): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [];
  for (const rm of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rIdx = Number(/\br="(\d+)"/.exec(rm[1])?.[1] ?? rows.length + 1) - 1;
    const row: (string | number | null)[] = [];
    let auto = 0;
    for (const cm of (rm[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /\br="([A-Z]+)\d+"/.exec(cm[1])?.[1];
      const idx = ref ? colIndex(ref) : auto;
      auto = idx + 1;
      const type = /\bt="([^"]*)"/.exec(cm[1])?.[1];
      const body = cm[2] ?? "";
      const v = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let val: string | number | null = null;
      if (type === "inlineStr") val = textOf(body);
      else if (type === "s") val = v !== undefined ? (shared[Number(v)] ?? "") : null;
      else if (type === "str") val = v !== undefined ? unesc(v) : null;
      else if (type === "b") val = v === "1" ? "TRUE" : "FALSE";
      else if (v !== undefined && v !== "") val = Number.isFinite(Number(v)) ? Number(v) : unesc(v);
      row[idx] = val;
    }
    rows[rIdx] = Array.from(row, (x) => x ?? null);
  }
  return Array.from(rows, (r) => r ?? []);
}

/** Lê um .xlsx (feito aqui, no Excel ou no LibreOffice) e devolve as linhas de cada aba. */
export function readXlsx(bytes: Uint8Array): { name: string; rows: (string | number | null)[][] }[] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error("Esse arquivo não é uma planilha .xlsx válida.");
  }
  const targets = sheetTargets(files);
  if (!targets.length) throw new Error("Esse arquivo não é uma planilha .xlsx válida.");
  const shared = sharedStrings(files);
  return targets.map((t) => ({ name: t.name, rows: files[t.path] ? parseSheet(strFromU8(files[t.path]), shared) : [] }));
}
