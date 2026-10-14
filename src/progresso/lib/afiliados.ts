import type { TableRows } from "./csv";
import { fmtDate, fmtDateTime, norm, parseDateTime, parseNumber } from "./valores";

const cellOf = (r: TableRows[number] | undefined, i: number) => (r && i >= 0 ? r[i] : null);

/** Índice da coluna: nome igual, senão começando com, senão contendo. */
function findCol(header: TableRows[number], ...names: string[]): number {
  const h = header.map((c) => norm(c));
  for (const n of names.map(norm)) {
    let i = h.indexOf(n);
    if (i < 0) i = h.findIndex((x) => x && x.startsWith(n));
    if (i < 0) i = h.findIndex((x) => x && x.includes(n));
    if (i >= 0) return i;
  }
  return -1;
}

// ---------------------------------------------------------------- Indicadores (AffiliateDashboardReport)

export const INDICADORES = [
  { key: "cliques", label: "Cliques", names: ["cliques", "clique"], money: false },
  { key: "pedidos", label: "Pedidos", names: ["pedidos"], money: false },
  { key: "comissao", label: "Comissão est. (R$)", names: ["comissao"], money: true },
  { key: "itens", label: "Itens vendidos", names: ["itens vendidos", "itens"], money: false },
  { key: "valor", label: "Valor do pedido (R$)", names: ["valor do pedido", "valor"], money: true },
  { key: "novos", label: "Novos compradores", names: ["novos compradores", "novos"], money: false },
] as const;
export type IndicadorKey = (typeof INDICADORES)[number]["key"];

export interface DiaIndicador {
  data: Date;
  label: string;
  values: Record<IndicadorKey, number>;
}
export interface Indicadores {
  dias: DiaIndicador[];
  found: IndicadorKey[];
  totals: Record<IndicadorKey, number>;
  /** Pedidos ÷ cliques, em %. */
  conversao: number;
  /** Valor do pedido ÷ pedidos. */
  ticketMedio: number;
  /** Comissão ÷ pedidos. */
  comissaoPorPedido: number;
  melhorDia?: { label: string; comissao: number };
}

const zeroInd = (): Record<IndicadorKey, number> => ({ cliques: 0, pedidos: 0, comissao: 0, itens: 0, valor: 0, novos: 0 });

/** Relatório diário do painel de afiliados: uma linha por dia, com cliques, pedidos, comissão, itens, valor e novos compradores. */
export function parseIndicadores(rows: TableRows): Indicadores {
  const hi = rows.slice(0, 20).findIndex((r) => r && r.some((c) => norm(c) === "data" || norm(c).startsWith("data")) && findCol(r, "cliques", "pedidos") >= 0);
  if (hi < 0) throw new Error("Não achei as colunas do relatório de indicadores. A planilha precisa ter “Data” e colunas como Cliques, Pedidos, Comissão, Itens vendidos, Valor do pedido e Novos compradores.");
  const header = rows[hi];
  const dateCol = header.findIndex((c) => norm(c) === "data" || norm(c).startsWith("data"));
  const cols = INDICADORES.map((d) => ({ d, idx: findCol(header, ...d.names) }));
  const found = cols.filter((c) => c.idx >= 0).map((c) => c.d.key);
  const dias: DiaIndicador[] = [];
  for (const r of rows.slice(hi + 1)) {
    const data = parseDateTime(cellOf(r, dateCol));
    if (!data) continue;
    const values = zeroInd();
    for (const c of cols) values[c.d.key] = c.idx >= 0 ? (parseNumber(cellOf(r, c.idx)) ?? 0) : 0;
    dias.push({ data, label: fmtDate(data), values });
  }
  if (!dias.length) throw new Error("Nenhuma linha com data foi encontrada abaixo do cabeçalho.");
  dias.sort((a, b) => a.data.getTime() - b.data.getTime());
  return finishIndicadores(dias, found);
}

/** Soma, taxas e melhor dia a partir da lista de dias. */
function finishIndicadores(dias: DiaIndicador[], found: IndicadorKey[]): Indicadores {
  const totals = zeroInd();
  for (const d of dias) for (const k of found) totals[k] += d.values[k];
  const best = [...dias].sort((a, b) => b.values.comissao - a.values.comissao)[0];
  return {
    dias,
    found,
    totals,
    conversao: totals.cliques > 0 ? Math.round((totals.pedidos / totals.cliques) * 10000) / 100 : 0,
    ticketMedio: totals.pedidos > 0 ? totals.valor / totals.pedidos : 0,
    comissaoPorPedido: totals.pedidos > 0 ? totals.comissao / totals.pedidos : 0,
    melhorDia: found.includes("comissao") && best && best.values.comissao > 0 ? { label: best.label, comissao: best.values.comissao } : undefined,
  };
}

// ---------------------------------------------------------------- Itens (AffiliateCommissionReport)

export type StatusPedido = "pendente" | "concluido" | "nao pago" | "cancelado" | "outro";
export const STATUS_PEDIDO_LABEL: Record<StatusPedido, string> = { pendente: "Pendente", concluido: "Concluído", "nao pago": "Não pago", cancelado: "Cancelado", outro: "Outro" };

export function statusPedido(v: unknown): StatusPedido {
  const s = norm(v);
  if (s.includes("cancel")) return "cancelado";
  if (s.includes("pendente")) return "pendente";
  if (s.includes("conclu")) return "concluido";
  if (s.includes("nao pago") || s.includes("não pago")) return "nao pago";
  return "outro";
}

export interface ItemPedido {
  status: StatusPedido;
  statusTexto: string;
  horario: Date | null;
  loja: string;
  item: string;
  preco: number;
  qtd: number;
  compra: number;
  reembolso: number;
  canal: string;
  comissao: number;
  /** Número do pedido (um pedido pode ter vários itens). Vazio se a planilha não traz. */
  id: string;
  /** true/false se a planilha diz se o comprador é novo; null se não traz essa coluna. */
  novo: boolean | null;
}
export interface Par {
  name: string;
  value: number;
}
export interface Itens {
  linhas: ItemPedido[];
  menorData?: Date;
  maiorData?: Date;
  somaPreco: number;
  somaCompra: number;
  somaReembolso: number;
  /** Pedidos pendentes + concluídos. */
  pedidosValidos: number;
  pedidosTodos: number;
  comissaoPendente: number;
  comissaoConcluida: number;
  taxaCancelamento: number;
  ticketMedio: number;
  top10Itens: (Par & { status: Record<StatusPedido, number> })[];
  top5Lojas: Par[];
  top5Compra: Par[];
  horarioTop?: { quando: Date; unidades: number; item: string; precoUnit: number; total: number; comissao: number };
  maiorComissao?: { valor: number; item: string };
  grafStatus: Par[];
  grafLoja: Par[];
  grafPreco: Par[];
  grafQtd: Par[];
  grafCompra: Par[];
  grafReembolso: Par[];
  grafComissao: Par[];
  grafHorario: Par[];
  grafCanal: Par[];
}

const sumBy = (rows: ItemPedido[], key: (r: ItemPedido) => string, val: (r: ItemPedido) => number): Par[] => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return [...m].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
};
const top = (p: Par[], n: number) => [...p].sort((a, b) => b.value - a.value).slice(0, n);

/** Relatório de comissão por item (um pedido por linha), na ordem de colunas do painel de afiliados. */
export function parseItens(rows: TableRows): Itens {
  const hi = rows.slice(0, 20).findIndex((r) => r && findCol(r, "nome do item") >= 0 && (findCol(r, "status do pedido") >= 0 || findCol(r, "comissao liquida") >= 0 || findCol(r, "qtd") >= 0));
  if (hi < 0) throw new Error("Não achei as colunas do relatório de itens. A planilha precisa ter “Nome do Item” e colunas como Status do Pedido, Qtd, Preço(R$) e Comissão líquida do afiliado(R$).");
  const h = rows[hi];
  const c = {
    status: findCol(h, "status do pedido", "status"),
    horario: findCol(h, "horario do pedido", "horario"),
    loja: findCol(h, "nome da loja", "loja"),
    item: findCol(h, "nome do item"),
    preco: findCol(h, "preco(r$)", "preco"),
    qtd: findCol(h, "qtd", "quantidade"),
    compra: findCol(h, "valor de compra"),
    reembolso: findCol(h, "valor do reembolso", "reembolso"),
    canal: findCol(h, "canal"),
    comissao: findCol(h, "comissao liquida do afiliado", "comissao liquida", "comissao"),
    id: findCol(h, "id do pedido", "id pedido", "numero do pedido"),
    comprador: findCol(h, "tipo de comprador", "novo comprador", "tipo do comprador", "comprador novo", "comprador"),
  };
  const linhas: ItemPedido[] = [];
  for (const r of rows.slice(hi + 1)) {
    const item = String(cellOf(r, c.item) ?? "").trim();
    if (!item) continue;
    linhas.push({
      status: statusPedido(cellOf(r, c.status)),
      statusTexto: String(cellOf(r, c.status) ?? "Vazio").trim() || "Vazio",
      horario: parseDateTime(cellOf(r, c.horario)),
      loja: String(cellOf(r, c.loja) ?? "Vazio").trim() || "Vazio",
      item,
      preco: parseNumber(cellOf(r, c.preco)) ?? 0,
      qtd: parseNumber(cellOf(r, c.qtd)) ?? 0,
      compra: parseNumber(cellOf(r, c.compra)) ?? 0,
      reembolso: parseNumber(cellOf(r, c.reembolso)) ?? 0,
      canal: String(cellOf(r, c.canal) ?? "Vazio").trim() || "Vazio",
      comissao: parseNumber(cellOf(r, c.comissao)) ?? 0,
      id: String(cellOf(r, c.id) ?? "").trim(),
      novo: c.comprador < 0 ? null : /^(novo|nova|new|sim|yes|true|1)/.test(norm(cellOf(r, c.comprador))),
    });
  }
  if (!linhas.length) throw new Error("Nenhum pedido foi encontrado abaixo do cabeçalho.");
  return resumirItens(linhas);
}

/** Totais, rankings e dados dos gráficos a partir das linhas de pedidos. */
export function resumirItens(entrada: ItemPedido[]): Itens {
  const linhas = [...entrada].sort((a, b) => (a.horario?.getTime() ?? Infinity) - (b.horario?.getTime() ?? Infinity));

  const sum = (f: (r: ItemPedido) => number, only?: (r: ItemPedido) => boolean) => linhas.reduce((s, r) => s + (only && !only(r) ? 0 : f(r)), 0);
  const count = (s: StatusPedido) => linhas.filter((r) => r.status === s).length;
  const datas = linhas.map((r) => r.horario).filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime());

  const grafQtd = sumBy(linhas, (r) => r.item, (r) => r.qtd);
  const statusPorItem = new Map<string, Record<StatusPedido, number>>();
  for (const r of linhas) {
    const cur = statusPorItem.get(r.item) ?? { pendente: 0, concluido: 0, "nao pago": 0, cancelado: 0, outro: 0 };
    cur[r.status]++;
    statusPorItem.set(r.item, cur);
  }

  // horário com mais unidades vendidas
  const porHorario = new Map<number, ItemPedido[]>();
  for (const r of linhas) if (r.horario) porHorario.set(r.horario.getTime(), [...(porHorario.get(r.horario.getTime()) ?? []), r]);
  let horarioTop: Itens["horarioTop"];
  for (const [t, rs] of porHorario) {
    const un = rs.reduce((s, r) => s + r.qtd, 0);
    if (!horarioTop || un > horarioTop.unidades) {
      const big = [...rs].sort((a, b) => b.qtd - a.qtd)[0];
      horarioTop = { quando: new Date(t), unidades: un, item: big.item, precoUnit: big.preco, total: big.preco * big.qtd, comissao: rs.reduce((s, r) => s + r.comissao, 0) };
    }
  }
  const maior = [...linhas].sort((a, b) => b.comissao - a.comissao)[0];
  const validos = count("pendente") + count("concluido");
  const somaCompra = sum((r) => r.compra);

  return {
    linhas,
    menorData: datas[0],
    maiorData: datas[datas.length - 1],
    somaPreco: sum((r) => r.preco),
    somaCompra,
    somaReembolso: sum((r) => r.reembolso),
    pedidosValidos: validos,
    pedidosTodos: linhas.length,
    comissaoPendente: sum((r) => r.comissao, (r) => r.status === "pendente"),
    comissaoConcluida: sum((r) => r.comissao, (r) => r.status === "concluido"),
    taxaCancelamento: Math.round((count("cancelado") / linhas.length) * 1000) / 10,
    ticketMedio: validos > 0 ? sum((r) => r.compra, (r) => r.status === "pendente" || r.status === "concluido") / validos : 0,
    top10Itens: top(grafQtd, 10).map((p) => ({ ...p, status: statusPorItem.get(p.name)! })),
    top5Lojas: top(sumBy(linhas, (r) => r.loja, () => 1), 5),
    top5Compra: top(sumBy(linhas, (r) => r.item, (r) => r.compra), 5),
    horarioTop,
    maiorComissao: maior && maior.comissao > 0 ? { valor: maior.comissao, item: maior.item } : undefined,
    grafStatus: sumBy(linhas, (r) => r.statusTexto, () => 1),
    grafLoja: sumBy(linhas, (r) => r.loja, () => 1),
    grafPreco: sumBy(linhas, (r) => r.item, (r) => r.preco),
    grafQtd,
    grafCompra: sumBy(linhas, (r) => r.item, (r) => r.compra),
    grafReembolso: sumBy(linhas, (r) => r.item, (r) => r.reembolso),
    grafComissao: sumBy(linhas, (r) => r.item, (r) => r.comissao),
    grafHorario: sumBy(linhas.filter((r) => r.horario), (r) => fmtDateTime(r.horario!), (r) => r.qtd),
    grafCanal: sumBy(linhas, (r) => r.canal, () => 1),
  };
}

// ---------------------------------------------------------------- Cliques (AffiliateClickReport)

export interface Cliques {
  /** Cliques por dia (chave AAAA-MM-DD). */
  porDia: Record<string, number>;
  total: number;
}

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromYmd = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};

/** Relatório de cliques do painel de afiliados: uma linha por clique (ID, tempo, região, sub_id, referenciador). */
export function parseCliques(rows: TableRows): Cliques {
  const hi = rows.slice(0, 20).findIndex((r) => r && findCol(r, "tempo dos cliques", "tempo do clique") >= 0);
  if (hi < 0) throw new Error("Não achei a coluna “Tempo dos Cliques”.");
  const col = findCol(rows[hi], "tempo dos cliques", "tempo do clique");
  const porDia: Record<string, number> = {};
  let total = 0;
  for (const r of rows.slice(hi + 1)) {
    const d = parseDateTime(cellOf(r, col));
    if (!d) continue;
    const k = ymd(d);
    porDia[k] = (porDia[k] ?? 0) + 1;
    total++;
  }
  if (!total) throw new Error("Nenhum clique com data foi encontrado.");
  return { porDia, total };
}

/**
 * Junta os dois relatórios por dia: cliques (do relatório de cliques) e pedidos, comissão, itens, valor e novos
 * compradores (do relatório de comissão). Pedidos cancelados e não pagos ficam de fora das somas.
 */
export function combinarIndicadores(cliques: Cliques | null, linhas: ItemPedido[] | null): Indicadores {
  const dias = new Map<string, Record<IndicadorKey, number>>();
  const get = (k: string) => {
    let v = dias.get(k);
    if (!v) dias.set(k, (v = zeroInd()));
    return v;
  };
  if (cliques) for (const [k, n] of Object.entries(cliques.porDia)) get(k).cliques = n;
  const found: IndicadorKey[] = [];
  if (cliques) found.push("cliques");
  if (linhas) {
    const validas = linhas.filter((r) => r.horario && (r.status === "pendente" || r.status === "concluido"));
    const temId = validas.some((r) => r.id !== "");
    const temNovo = linhas.some((r) => r.novo !== null);
    const pedidosVistos = new Map<string, Set<string>>();
    const novosVistos = new Map<string, Set<string>>();
    validas.forEach((r, i) => {
      const k = ymd(r.horario!);
      const v = get(k);
      const chave = temId && r.id ? r.id : `linha${i}`;
      const vistos = pedidosVistos.get(k) ?? new Set<string>();
      if (!vistos.has(chave)) {
        vistos.add(chave);
        v.pedidos++;
      }
      pedidosVistos.set(k, vistos);
      if (r.novo) {
        const nv = novosVistos.get(k) ?? new Set<string>();
        if (!nv.has(chave)) {
          nv.add(chave);
          v.novos++;
        }
        novosVistos.set(k, nv);
      }
      v.itens += r.qtd;
      v.valor += r.compra;
      v.comissao += r.comissao;
    });
    found.push("pedidos", "comissao", "itens", "valor");
    if (temNovo) found.push("novos");
    for (const v of dias.values()) {
      v.comissao = Math.round(v.comissao * 100) / 100;
      v.valor = Math.round(v.valor * 100) / 100;
    }
  }
  if (!dias.size) throw new Error("Não há dias para mostrar. Importe o relatório de cliques ou o de comissão.");
  const lista: DiaIndicador[] = [...dias.keys()].sort().map((k) => {
    const data = fromYmd(k);
    return { data, label: fmtDate(data), values: dias.get(k)! };
  });
  return finishIndicadores(lista, found);
}

// ---------------------------------------------------------------- Guardar no navegador (F5 não perde)

export interface LinhaGuardada {
  s: StatusPedido; st: string; h: number | null; l: string; i: string; p: number; q: number; c: number; r: number; ch: string; co: number; id: string; n: boolean | null;
}
export const guardarLinhas = (ls: ItemPedido[]): LinhaGuardada[] =>
  ls.map((x) => ({ s: x.status, st: x.statusTexto, h: x.horario ? x.horario.getTime() : null, l: x.loja, i: x.item, p: x.preco, q: x.qtd, c: x.compra, r: x.reembolso, ch: x.canal, co: x.comissao, id: x.id, n: x.novo }));
export const lerLinhas = (gs: LinhaGuardada[]): ItemPedido[] =>
  gs.map((x) => ({ status: x.s, statusTexto: x.st, horario: x.h === null ? null : new Date(x.h), loja: x.l, item: x.i, preco: x.p, qtd: x.q, compra: x.c, reembolso: x.r, canal: x.ch, comissao: x.co, id: x.id, novo: x.n }));

export type RelatorioLido =
  | { kind: "cliques"; cliques: Cliques }
  | { kind: "itens"; itens: Itens }
  | { kind: "indicadores"; rows: TableRows; ind: Indicadores };

/** Descobre qual relatório é (cliques, comissão ou indicadores prontos por dia) olhando as colunas de cada aba. */
export function reconhecerRelatorio(sheets: { name: string; rows: TableRows }[]): RelatorioLido {
  for (const s of sheets) {
    // o relatório de comissão também tem uma coluna "Tempo dos Cliques", então ele precisa ser testado antes do de cliques
    try { return { kind: "itens", itens: parseItens(s.rows) }; } catch { /* tenta o próximo tipo */ }
    try { return { kind: "cliques", cliques: parseCliques(s.rows) }; } catch { /* idem */ }
    try { return { kind: "indicadores", rows: s.rows, ind: parseIndicadores(s.rows) }; } catch { /* idem */ }
  }
  throw new Error("Não reconheci essa planilha. Use o relatório de cliques (colunas “ID dos Cliques” e “Tempo dos Cliques”), o de comissão (“Nome do Item”, “Status do Pedido”…) ou uma planilha por dia com Data, Cliques, Pedidos e Comissão.");
}
