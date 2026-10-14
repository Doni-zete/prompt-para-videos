import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { applyImport, buildSheets, exportXlsx, exportFileName, isMarked, parseDateCell, parseMarks, parseXlsxFile, planImport, TOTAL_LABEL } from "./planilha";
import { buildReport, reportToText } from "./relatorio";
import { monthDays, MAX_GOALS, type DoneMap, type Goal } from "./progresso";
import { readXlsx, writeXlsx } from "./xlsx";

const G: Goal[] = [{ id: "a", text: "Postar Reels" }, { id: "b", text: "Analisar métricas" }];
const TODAY = "2026-10-10";
const OCT = monthDays(2026, 9);

describe("xlsx (gravar e ler)", () => {
  it("vai e volta com acentos, símbolos XML, números e células vazias", () => {
    const rows = [["Meta", "10/10/2026"], ["R&D <ok> \"aspas\" ação", "x"], ["Vazia", null], ["Número", 42.5]];
    const back = readXlsx(writeXlsx([{ name: "Marcações", rows }, { name: "B", rows: [["só"]] }]));
    expect(back.map((s) => s.name)).toEqual(["Marcações", "B"]);
    expect(back[0].rows[1]).toEqual(["R&D <ok> \"aspas\" ação", "x"]);
    expect(back[0].rows[2]).toEqual(["Vazia"]);
    expect(back[0].rows[3]).toEqual(["Número", 42.5]);
  });
  it("lê arquivo no estilo Excel (textos compartilhados, data como número, célula pulada)", () => {
    const sheet = `<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" s="2"><v>46305</v></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="C2" t="s"><v>2</v></c></row></sheetData></worksheet>`;
    const zip = zipSync({
      "xl/workbook.xml": strToU8(`<workbook xmlns:r="x"><sheets><sheet name="Planilha1" sheetId="1" r:id="rId9"/></sheets></workbook>`),
      "xl/_rels/workbook.xml.rels": strToU8(`<Relationships><Relationship Id="rId9" Type="t" Target="worksheets/sheet1.xml"/></Relationships>`),
      "xl/sharedStrings.xml": strToU8(`<sst><si><t>Meta</t></si><si><t>Treinar</t></si><si><r><t>X</t></r></si></sst>`),
      "xl/worksheets/sheet1.xml": strToU8(sheet),
    });
    const [s] = readXlsx(zip);
    expect(s.rows[0]).toEqual(["Meta", null, 46305]);
    expect(s.rows[1]).toEqual(["Treinar", null, "X"]);
    expect(parseDateCell(46305)).toBe("2026-10-10");
  });
  it("arquivo que não é xlsx dá erro claro", () => {
    expect(() => readXlsx(new Uint8Array([1, 2, 3]))).toThrow(/xlsx/);
    expect(() => readXlsx(zipSync({ "a.txt": strToU8("oi") }))).toThrow(/xlsx/);
  });
});

describe("planilha de marcações", () => {
  const done: DoneMap = { "2026-10-01": ["a", "b"], "2026-10-02": ["a"] };
  it("exporta uma linha por meta, 'x' nos dias cumpridos, total do dia e aba de resumo", () => {
    const [marks, summary] = buildSheets(G, done, OCT, TODAY);
    expect(marks.rows[0].slice(0, 3)).toEqual(["Meta", "01/10/2026", "02/10/2026"]);
    expect(marks.rows[1].slice(0, 3)).toEqual(["Postar Reels", "x", "x"]);
    expect(marks.rows[2].slice(0, 3)).toEqual(["Analisar métricas", "x", null]);
    expect(marks.rows[3].slice(0, 3)).toEqual([TOTAL_LABEL, 100, 50]);
    expect(marks.rows[3][11]).toBeNull(); // dia futuro sem percentual
    expect(summary.rows[1]).toEqual(["Postar Reels", 2, 10, 20]);
  });
  it("exportar e importar de volta não muda nada", () => {
    const parsed = parseXlsxFile(exportXlsx(G, done, OCT, TODAY));
    expect(parsed.dates).toHaveLength(31);
    const r = applyImport(G, done, parsed, TODAY);
    expect(r.goals).toEqual(G);
    expect(r.done).toEqual(done);
    expect(r.summary).toMatchObject({ goalsAdded: 0, days: 10, marked: 3, futureIgnored: 21 });
  });
  it("importação cria meta nova, substitui só os dias do arquivo e ignora o futuro", () => {
    const parsed = parseMarks([["Meta", "03/10/2026", "2026-10-04", "20/10/2026"], ["postar reels", "sim", "", "x"], ["Meta Nova", "X", "1", "x"], [TOTAL_LABEL, 50, 50, 50]]);
    const before: DoneMap = { "2026-10-01": ["a"], "2026-10-04": ["a", "b"] };
    const r = applyImport(G, before, parsed, TODAY);
    expect(r.goals.map((g) => g.text)).toEqual(["Postar Reels", "Analisar métricas", "Meta Nova"]);
    const novo = r.goals[2].id;
    expect(r.done["2026-10-01"]).toEqual(["a"]); // dia fora do arquivo: intacto
    expect(r.done["2026-10-03"].sort()).toEqual(["a", novo].sort());
    expect(r.done["2026-10-04"].sort()).toEqual(["b", novo].sort()); // "a" foi desmarcada pelo arquivo; "b" não estava no arquivo
    expect(r.done["2026-10-20"]).toBeUndefined();
    expect(r.summary.futureIgnored).toBe(1);
    expect(r.summary.goalsAdded).toBe(1);
  });
  it("respeita o limite de metas ao importar", () => {
    const many: Goal[] = Array.from({ length: MAX_GOALS - 1 }, (_, i) => ({ id: `m${i}`, text: `M${i}` }));
    const parsed = parseMarks([["Meta", "10/10/2026"], ["N1", "x"], ["N2", "x"]]);
    const r = applyImport(many, {}, parsed, TODAY);
    expect(r.goals).toHaveLength(MAX_GOALS);
    expect(planImport(many, parsed, TODAY)).toMatchObject({ goalsAdded: 1, goalsSkipped: 1 });
  });
  it("erros claros: sem cabeçalho, sem metas", () => {
    expect(() => parseMarks([["Nome", "10/10/2026"]])).toThrow(/Meta/);
    expect(() => parseMarks([["Meta", "10/10/2026"]])).toThrow(/nenhuma meta/);
    expect(() => parseMarks([])).toThrow();
  });
  it("datas e marcas em vários formatos", () => {
    expect(parseDateCell("5/3/2026")).toBe("2026-03-05");
    expect(parseDateCell("31/02/2026")).toBeNull();
    expect(parseDateCell("abc")).toBeNull();
    expect(parseDateCell(12)).toBeNull();
    for (const v of ["x", "X", "✓", 1, "Sim", "TRUE"]) expect(isMarked(v), String(v)).toBe(true);
    for (const v of ["", null, 0, "não", "-"]) expect(isMarked(v), String(v)).toBe(false);
  });
  it("nome do arquivo", () => expect(exportFileName(2026, 9)).toBe("progresso-semanal-2026-10.xlsx"));
});

describe("relatório", () => {
  const done: DoneMap = { "2026-10-04": ["a", "b"], "2026-10-05": ["a", "b"], "2026-10-06": ["a"] };
  const week = ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"];
  it("calcula percentual, dias perfeitos, ranking e dias da semana", () => {
    const r = buildReport(G, done, week, TODAY, "Semana");
    expect(r).toMatchObject({ pct: 36, done: 5, total: 14, perfectDays: 2, countedDays: 7 });
    expect(r.bestGoal).toBe("Postar Reels (43%)");
    expect(r.weakestGoal).toBe("Analisar métricas (29%)");
    expect(r.bestWeekday).toMatch(/^Dom/);
    expect(r.days).toHaveLength(7);
  });
  it("só conta dias até hoje e não quebra sem metas", () => {
    expect(buildReport(G, done, week, "2026-10-05", "Semana").countedDays).toBe(2);
    const vazio = buildReport([], {}, week, TODAY, "Semana");
    expect(vazio.pct).toBe(0);
    expect(vazio.goals).toEqual([]);
    expect(buildReport(G, {}, week, "2026-09-01", "Semana").verdict).toMatch(/não começou/);
  });
  it("texto do relatório traz título, metas e dia a dia", () => {
    const t = reportToText(buildReport(G, done, week, TODAY, "Semana atual"));
    expect(t).toContain("RELATÓRIO DE PROGRESSO: Semana atual");
    expect(t).toContain("- Postar Reels: 43% (3 de 7 dias)");
    expect(t).toContain("Dom 04/10: 2 de 2 (100%)");
  });
});
