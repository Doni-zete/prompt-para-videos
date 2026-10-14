/** Leitura tolerante de números e datas vindos de planilhas e CSV (formato brasileiro ou internacional). */

export function parseNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  let s = v.replace(/R\$|\s|%/g, "");
  if (!s || !/^[-+]?[\d.,]+$/.test(s)) return null;
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  if (hasDot && hasComma) {
    // o último separador é o decimal
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (hasComma) {
    s = /^[-+]?\d{1,3}(,\d{3}){2,}$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (hasDot && /^[-+]?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const mk = (y: number, mo: number, d: number, h = 0, mi = 0): Date | null => {
  const dt = new Date(y, mo - 1, d, h, mi);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null;
};

/** Data e hora de uma célula: número de série do Excel, "dd/mm/aaaa hh:mm" ou "aaaa-mm-dd hh:mm". */
export function parseDateTime(v: unknown): Date | null {
  if (typeof v === "number") {
    if (v < 36526 || v > 80000) return null;
    const ms = Math.round((v - Math.floor(v)) * 86400000);
    const base = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000 + ms);
    return new Date(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), base.getUTCHours(), base.getUTCMinutes());
  }
  if (typeof v !== "string") return null;
  const s = v.trim();
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[T\s]+(\d{1,2}):(\d{2})(?::\d{2})?)?$/.exec(s);
  if (m) return mk(Number(m[3]), Number(m[2]), Number(m[1]), Number(m[4] ?? 0), Number(m[5] ?? 0));
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::\d{2})?)?/.exec(s);
  if (m) return mk(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0));
  return null;
}

const p2 = (n: number) => String(n).padStart(2, "0");
export const fmtDate = (d: Date) => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
export const fmtDateTime = (d: Date) => `${fmtDate(d)} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
export const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtNum = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
