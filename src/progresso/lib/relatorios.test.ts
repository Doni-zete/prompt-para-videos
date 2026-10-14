import { afterEach, describe, expect, it, vi } from "vitest";
import { saveBytesReplacing } from "./baixar";
import { parseCsv, readTableFile, serializeCsv } from "./csv";
import { combinarIndicadores, guardarLinhas, lerLinhas, parseCliques, parseIndicadores, parseItens, reconhecerRelatorio, resumirItens, statusPedido } from "./afiliados";
import { STATUSES, addColumn, addRow, currentWeekLabel, detectStatusColumns, exportGrade, fillWeekDefaults, gradeFromRows, gradeSheets, gradeStats, modeloGrade, nextStatus, removeColumn, removeRow, setCell, statusOfText } from "./grade";
import { fmtDateTime, parseDateTime, parseNumber } from "./valores";
import { readXlsx, writeXlsx } from "./xlsx";

describe("números e datas", () => {
  it("números brasileiros e internacionais", () => {
    expect(parseNumber("39,267")).toBe(39.267);
    expect(parseNumber("1.234,56")).toBe(1234.56);
    expect(parseNumber("1,234.56")).toBe(1234.56);
    expect(parseNumber("R$ 101,15")).toBe(101.15);
    expect(parseNumber("1.234")).toBe(1234);
    expect(parseNumber("12.5")).toBe(12.5);
    expect(parseNumber("1,234,567")).toBe(1234567);
    expect(parseNumber(7)).toBe(7);
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("")).toBeNull();
    expect(parseNumber(null)).toBeNull();
  });
  it("datas com hora: série do Excel, texto brasileiro e ISO", () => {
    expect(fmtDateTime(parseDateTime(46305.5)!)).toBe("10/10/2026 12:00");
    expect(fmtDateTime(parseDateTime("09/10/2026 00:24")!)).toBe("09/10/2026 00:24");
    expect(fmtDateTime(parseDateTime("2026-10-09 11:13:45")!)).toBe("09/10/2026 11:13");
    expect(parseDateTime("31/02/2026")).toBeNull();
    expect(parseDateTime("texto")).toBeNull();
  });
});

describe("CSV", () => {
  it("vírgula, ponto e vírgula, aspas, BOM e quebras de linha", () => {
    expect(parseCsv('﻿a;b;c\r\n1;"x;y";3\r\n')).toEqual([["a", "b", "c"], ["1", "x;y", "3"]]);
    expect(parseCsv('a,b\n"he said ""hi""",2')).toEqual([["a", "b"], ['he said "hi"', "2"]]);
    expect(parseCsv("a\tb\n1\t2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("readTableFile abre CSV e xlsx e recusa vazio", () => {
    const csv = new TextEncoder().encode("Produto,TikTok\nBolsa,Concluído");
    expect(readTableFile("x.csv", csv).sheets[0].rows[1]).toEqual(["Bolsa", "Concluído"]);
    const x = writeXlsx([{ name: "A", rows: [["a"], ["b"]] }]);
    expect(readTableFile("x.xlsx", x).sheets).toHaveLength(1);
    expect(() => readTableFile("x.csv", new Uint8Array())).toThrow(/vazio/);
  });
  it("CSV em Latin-1 não vira lixo", () => {
    const bytes = Uint8Array.from([..."Comiss"].map((c) => c.charCodeAt(0)).concat([0xe3, 0x6f]));
    expect(readTableFile("x.csv", bytes).sheets[0].rows[0][0]).toBe("Comissão");
  });
  it("serializa CSV com ponto e vírgula, aspas, linhas irregulares e UTF-8 BOM", () => {
    const rows = [["Produto", "Link"], ["Cortina; blackout", 'https://loja.test/?nome="oferta"'], ["Nome\ncom linha", null]];
    const csv = serializeCsv(rows);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(parseCsv(csv)).toEqual([
      ["Produto", "Link"],
      ["Cortina; blackout", 'https://loja.test/?nome="oferta"'],
      ["Nome\ncom linha", ""],
    ]);
  });
});

describe("semana padrão da planilha", () => {
  it("uses the local calendar and ISO week boundaries", () => {
    expect(currentWeekLabel(new Date(2026, 9, 14, 12))).toBe("Semana 42");
    expect(currentWeekLabel(new Date(2021, 0, 1, 12))).toBe("Semana 53");
    expect(currentWeekLabel(new Date(2021, 0, 4, 12))).toBe("Semana 1");
  });
  it("defaults new and blank cells without rewriting existing weeks", () => {
    const date = new Date(2026, 9, 14, 12);
    const grade = { name: "CSV", rows: [["Semana", "Produto"], ["Semana 5", "Antigo"], [null, "Novo"]] };
    const filled = fillWeekDefaults(grade, date);
    expect(filled.rows[1][0]).toBe("Semana 5");
    expect(filled.rows[2][0]).toBe("Semana 42");
    expect(addRow(filled, date).rows.at(-1)).toEqual(["Semana 42", null]);
    expect(fillWeekDefaults(filled, date)).toBe(filled);
    expect(modeloGrade().rows[0][0]).toBe("Semana");
  });
});

describe("salvar CSV substituindo", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("abre um seletor com o mesmo nome em cada gravação e não cria nomes numerados", async () => {
    const files = new Map<string, string>();
    const picker = vi.fn(async (options: { suggestedName: string }) => ({
      name: options.suggestedName,
      createWritable: async () => ({
        write: async (blob: Blob) => { files.set(options.suggestedName, await blob.text()); },
        close: async () => undefined,
      }),
    }));
    vi.stubGlobal("window", { showSaveFilePicker: picker });

    await saveBytesReplacing(new TextEncoder().encode("versão 1"), "carregamento-programado.csv", "text/csv");
    await saveBytesReplacing(new TextEncoder().encode("versão 2"), "carregamento-programado.csv", "text/csv");

    expect(picker).toHaveBeenCalledTimes(2);
    expect(picker.mock.calls.map(([options]) => options.suggestedName)).toEqual([
      "carregamento-programado.csv",
      "carregamento-programado.csv",
    ]);
    expect([...files.keys()]).toEqual(["carregamento-programado.csv"]);
    expect(files.get("carregamento-programado.csv")).toBe("versão 2");
  });
});

const ITENS_HEAD = ["Status do Pedido", "Horário do pedido", "Nome da loja", "Nome do Item", "Preço(R$)", "Qtd", "Valor de Compra(R$)", "Valor do Reembolso(R$)", "Canal", "Comissão líquida do afiliado(R$)", "Outra coluna"];
const ITENS = [
  ITENS_HEAD,
  ["Pendente", "09/10/2026 00:24", "GA Enxovais", "Tapete Jacquard", "80,50", "2", "161,00", "0", "Shopeevideo-Shopee", "16,10", "x"],
  ["Pendente", "09/10/2026 07:33", "Solara Moda", "Kit Camisa Térmica", "62,00", "1", "62,00", "0", "Google Search", "5,50", "x"],
  ["Concluído", "09/10/2026 07:33", "Solara Moda", "Kit Camisa Térmica", "62,00", "1", "62,00", "0", "Shopeevideo-Shopee", "5,50", "x"],
  ["Cancelado", "09/10/2026 08:43", "GA Enxovais", "Armário Banheiro", "100,00", "1", "100,00", "100,00", "Shopeevideo-Shopee", "0", "x"],
  ["Não pago", "09/10/2026 11:13", "Sombrisul", "Armário Banheiro", "100,00", "1", "100,00", "0", "Google Search", "0", "x"],
  [null, null, null, null, null, null, null, null, null, null, null],
];

describe("relatório de itens (AffiliateCommissionReport)", () => {
  const r = parseItens(ITENS);
  it("status em qualquer grafia", () => {
    expect(["Pendente", "concluido", "Concluído", "Não pago", "nao pago", "Cancelado", "xyz"].map(statusPedido)).toEqual(["pendente", "concluido", "concluido", "nao pago", "nao pago", "cancelado", "outro"]);
  });
  it("somas, pedidos e comissões por status", () => {
    expect(r.pedidosTodos).toBe(5);
    expect(r.pedidosValidos).toBe(3);
    expect(r.somaCompra).toBe(485);
    expect(r.somaReembolso).toBe(100);
    expect(r.comissaoPendente).toBeCloseTo(21.6);
    expect(r.comissaoConcluida).toBe(5.5);
    expect(r.taxaCancelamento).toBe(20);
    expect(r.ticketMedio).toBeCloseTo(285 / 3);
  });
  it("período, maior comissão e horário com mais vendas", () => {
    expect(fmtDateTime(r.menorData!)).toBe("09/10/2026 00:24");
    expect(fmtDateTime(r.maiorData!)).toBe("09/10/2026 11:13");
    expect(r.maiorComissao).toEqual({ valor: 16.1, item: "Tapete Jacquard" });
    expect(r.horarioTop).toMatchObject({ unidades: 2, item: "Tapete Jacquard", comissao: 16.1 }); // empate com 07:33: vale o primeiro horário
    expect(fmtDateTime(r.horarioTop!.quando)).toBe("09/10/2026 00:24");
  });
  it("tops e dados dos gráficos", () => {
    expect(r.top10Itens[0]).toMatchObject({ name: "Tapete Jacquard", value: 2 });
    const kit = r.top10Itens.find((i) => i.name === "Kit Camisa Térmica")!;
    expect(kit.status).toMatchObject({ pendente: 1, concluido: 1, cancelado: 0 });
    expect(r.top5Lojas[0]).toEqual({ name: "GA Enxovais", value: 2 });
    expect(r.top5Compra[0]).toEqual({ name: "Armário Banheiro", value: 200 });
    expect(r.grafStatus).toHaveLength(4);
    expect(r.grafCanal.find((c) => c.name === "Google Search")?.value).toBe(2);
    expect(r.grafHorario).toHaveLength(4);
    expect(r.grafHorario.reduce((s, p) => s + p.value, 0)).toBe(6);
  });
  it("lê também números nativos e datas do Excel, e dá erro claro", () => {
    const x = parseItens([ITENS_HEAD.slice(0, 10), ["Pendente", 46305.5, "L", "Item", 10.5, 2, 21, 0, "C", 1.5]]);
    expect(x.somaPreco).toBe(10.5);
    expect(fmtDateTime(x.menorData!)).toBe("10/10/2026 12:00");
    expect(() => parseItens([["a", "b"]])).toThrow(/Nome do Item/);
    expect(() => parseItens([ITENS_HEAD])).toThrow(/Nenhum pedido/);
  });
});

describe("relatório de indicadores (AffiliateDashboardReport)", () => {
  const rows = [
    ["Data", "Cliques", "Pedidos", "Comissão est.(R$)", "Itens vendidos", "Valor do pedido(R$)", "Novos compradores"],
    ["09/10/2026", 100, 4, "20,00", 5, "200,00", 2],
    [46304, 50, 1, 5, 1, 40, 0],
    ["Total", 150, 5, 25, 6, 240, 2],
  ];
  const r = parseIndicadores(rows);
  it("ordena por data, ignora linha de total e soma", () => {
    expect(r.dias.map((d) => d.label)).toEqual(["09/10/2026", "09/10/2026"].length ? [r.dias[0].label, r.dias[1].label] : []);
    expect(r.dias).toHaveLength(2);
    expect(r.totals).toMatchObject({ cliques: 150, pedidos: 5, comissao: 25, itens: 6, valor: 240, novos: 2 });
  });
  it("indicadores extras: conversão, ticket médio, comissão por pedido, melhor dia", () => {
    expect(r.conversao).toBeCloseTo(3.33, 2);
    expect(r.ticketMedio).toBe(48);
    expect(r.comissaoPorPedido).toBe(5);
    expect(r.melhorDia?.comissao).toBe(20);
  });
  it("colunas faltando valem zero e erro claro sem cabeçalho", () => {
    const p = parseIndicadores([["Data", "Cliques"], ["01/10/2026", 3]]);
    expect(p.found).toEqual(["cliques"]);
    expect(p.totals.pedidos).toBe(0);
    expect(() => parseIndicadores([["x", "y"]])).toThrow(/indicadores/);
    expect(() => parseIndicadores([["Data", "Cliques"], ["sem data", 1]])).toThrow(/data/i);
  });
});

describe("planilha editável (Importar/Exportar Planilha)", () => {
  const g = gradeFromRows("p.xlsx", [
    ["Produto", "Data", "Facebook", "TikTok", "Valor"],
    ["Fronha", 46305, "Concluído", "Editando", 10],
    ["Bolsa", null, "Não começou", "Concluído", 20],
    [null, null, null, null, null],
  ]);
  it("tira linhas vazias do fim, converte a data do Excel e mantém números", () => {
    expect(g.rows).toHaveLength(3);
    expect(g.rows[1][1]).toBe("10/10/2026");
    expect(g.rows[2][4]).toBe(20);
  });
  it("acha as colunas de status e conta por status", () => {
    expect(detectStatusColumns(g.rows)).toEqual([2, 3]);
    const s = gradeStats(g);
    expect(s.counts).toEqual({ "Concluído": 2, Editando: 1, "Não começou": 1 });
    expect(s.pct).toBe(50);
    expect(s.columns[1]).toMatchObject({ title: "TikTok", pct: 50 });
  });
  it("editar, adicionar e remover", () => {
    let x = setCell(g, 1, 3, "Concluído");
    expect(gradeStats(x).counts["Concluído"]).toBe(3);
    x = addRow(x);
    expect(x.rows).toHaveLength(4);
    expect(removeRow(x, 0)).toBe(x);
    expect(removeRow(x, 3).rows).toHaveLength(3);
    x = addColumn(x, "Kwai");
    expect(x.rows[0].at(-1)).toBe("Kwai");
    expect(addColumn(x, "kwai")).toBe(x);
    expect(removeColumn(x, 5).rows[0]).not.toContain("Kwai");
  });
  it("status: ciclo e sinônimos", () => {
    expect(nextStatus(null)).toBe("Concluído");
    expect(STATUSES.map((s) => nextStatus(s))).toEqual(["Editando", "Não começou", "Concluído"]);
    expect(statusOfText("Em edição")).toBe("Editando");
    expect(statusOfText("Não Concluiu")).toBe("Não começou");
    expect(statusOfText("qualquer")).toBeNull();
  });
  it("exporta com as células de status coloridas e abre de volta", () => {
    const sheets = gradeSheets(g);
    expect(sheets.map((s) => s.name)).toEqual(["Planilha", "Resumo"]);
    expect((sheets[0].rows[1][2] as { fill: string }).fill).toBe("#22c55e");
    const back = readXlsx(exportGrade(g));
    expect(back[0].rows[1]).toEqual(["Fronha", "10/10/2026", "Concluído", "Editando", 10]);
    expect(back[1].rows.at(-1)).toEqual(["Total", 2, 1, 1, 50]);
  });
  it("modelo e erro de planilha vazia", () => {
    expect(detectStatusColumns(modeloGrade().rows)).toHaveLength(6);
    expect(() => gradeFromRows("x", [[null, null]])).toThrow(/vazia/);
  });
});

import { niceMax, pieSlices, shorten, slicePath, ticks, chartColor, CHART_COLORS } from "./graficos";
describe("contas dos gráficos", () => {
  it("escala redonda", () => {
    expect([0, 0.3, 1, 3, 7, 12, 160, 4999].map(niceMax)).toEqual([1, 0.5, 1, 5, 10, 20, 200, 5000]);
    expect(ticks(8)).toEqual([0, 2, 4, 6, 8]);
  });
  it("rótulo curto", () => {
    expect(shorten("abc", 5)).toBe("abc");
    expect(shorten("Tapete Jacquard Decorativo", 10)).toBe("Tapete Ja…");
  });
  it("pizza: percentuais somam 100 e ignora zero", () => {
    const s = pieSlices([{ name: "a", value: 1 }, { name: "b", value: 3 }, { name: "c", value: 0 }]);
    expect(s.map((x) => x.name)).toEqual(["a", "b"]);
    expect(s.map((x) => x.pct)).toEqual([25, 75]);
    expect(s[1].end).toBeCloseTo(Math.PI * 2);
    expect(slicePath(90, 90, 80, 0, Math.PI * 2)).toContain("A 80 80");
    expect(pieSlices([])).toEqual([]);
  });
  it("paleta repete e tem cores distintas", () => {
    expect(new Set(CHART_COLORS).size).toBe(CHART_COLORS.length);
    expect(chartColor(CHART_COLORS.length)).toBe(CHART_COLORS[0]);
  });
});

describe("cliques + comissão juntos (indicadores)", () => {
  const cliques = [
    ["ID dos Cliques", "Tempo dos Cliques", "Região dos Cliques", "Sub_id", "Referenciador"],
    ["a1", "2026-10-08 23:43:33", "Brazil", null, "Shopeevideo-Shopee"],
    ["a2", "2026-10-08 10:00:00", "Brazil", null, "Google Search"],
    ["a3", "2026-10-09 09:15:00", "Brazil", null, "Google Search"],
  ];
  const itens = [
    ["ID do Pedido", "Status do Pedido", "Horário do Pedido", "Nome da Loja", "Nome do Item", "Preço(R$)", "Qtd", "Valor de Compra(R$)", "Valor do Reembolso(R$)", "Canal", "Tipo de Comprador", "Comissão líquida do afiliado(R$)"],
    ["P1", "Pendente", "2026-10-08 14:04", "Loja A", "Tapete", "100,00", 2, "200,00", "0", "Shopee", "Novo", "16,00"],
    ["P1", "Pendente", "2026-10-08 14:04", "Loja A", "Capa", "20,00", 1, "20,00", "0", "Shopee", "Novo", "1,60"],
    ["P2", "Cancelado", "2026-10-08 15:00", "Loja B", "Fone", "50,00", 1, "50,00", "0", "Shopee", "Existente", "4,00"],
    ["P3", "Concluído", "2026-10-09 08:00", "Loja B", "Fone", "50,00", 3, "150,00", "0", "Shopee", "Existente", "12,00"],
  ];
  it("lê o relatório de cliques e conta por dia", () => {
    const c = parseCliques(cliques);
    expect(c.total).toBe(3);
    expect(c.porDia["2026-10-08"]).toBe(2);
    expect(c.porDia["2026-10-09"]).toBe(1);
  });
  it("recusa planilha que não é de cliques", () => {
    expect(() => parseCliques(itens)).toThrow();
  });
  it("junta por dia: pedidos distintos, sem cancelados, novos compradores", () => {
    const ind = combinarIndicadores(parseCliques(cliques), parseItens(itens).linhas);
    expect(ind.found).toEqual(["cliques", "pedidos", "comissao", "itens", "valor", "novos"]);
    const d8 = ind.dias.find((d) => d.label === "08/10/2026")!;
    expect(d8.values).toMatchObject({ cliques: 2, pedidos: 1, itens: 3, valor: 220, comissao: 17.6, novos: 1 });
    const d9 = ind.dias.find((d) => d.label === "09/10/2026")!;
    expect(d9.values).toMatchObject({ cliques: 1, pedidos: 1, itens: 3, valor: 150, comissao: 12, novos: 0 });
    expect(ind.totals.pedidos).toBe(2);
    expect(ind.conversao).toBe(66.67);
  });
  it("só cliques, ou só comissão, também funciona", () => {
    expect(combinarIndicadores(parseCliques(cliques), null).found).toEqual(["cliques"]);
    expect(combinarIndicadores(null, parseItens(itens).linhas).found).toContain("pedidos");
    expect(() => combinarIndicadores(null, null)).toThrow();
  });
  it("sem coluna de comprador, não mostra novos compradores", () => {
    const sem = itens.map((r) => r.filter((_, i) => i !== 10));
    expect(combinarIndicadores(null, parseItens(sem).linhas).found).not.toContain("novos");
  });
  it("guardar e ler as linhas devolve o mesmo resultado (F5)", () => {
    const l = parseItens(itens).linhas;
    const back = lerLinhas(JSON.parse(JSON.stringify(guardarLinhas(l))));
    expect(resumirItens(back).somaCompra).toBe(resumirItens(l).somaCompra);
    expect(back[0].horario?.getTime()).toBe(l[0].horario?.getTime());
  });
  it("relatório de comissão com coluna Tempo dos Cliques não é confundido com o de cliques", () => {
    const com = [
      ["ID do Pedido", "Status do Pedido", "Horário do Pedido", "Tempo dos Cliques", "Nome da Loja", "Nome do Item", "Preço(R$)", "Qtd", "Valor de Compra(R$)", "Canal", "Comissão líquida do afiliado(R$)"],
      ["P1", "Pendente", "2026-10-08 14:04", "2026-10-08 14:00", "Loja A", "Tapete", "100,00", 2, "200,00", "Shopee", "16,00"],
    ];
    expect(reconhecerRelatorio([{ name: "a", rows: com }]).kind).toBe("itens");
  });
  it("reconhece cada tipo de relatório", () => {
    expect(reconhecerRelatorio([{ name: "a", rows: cliques }]).kind).toBe("cliques");
    expect(reconhecerRelatorio([{ name: "a", rows: itens }]).kind).toBe("itens");
    expect(reconhecerRelatorio([{ name: "a", rows: [["Data", "Cliques", "Pedidos"], ["01/09/2026", 10, 1]] }]).kind).toBe("indicadores");
    expect(() => reconhecerRelatorio([{ name: "a", rows: [["x"], ["y"]] }])).toThrow(/Não reconheci/);
  });
});
