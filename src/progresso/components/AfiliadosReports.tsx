import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileSpreadsheet, Trash2, Trophy, Upload } from "lucide-react";
import { INDICADORES, STATUS_PEDIDO_LABEL, combinarIndicadores, lerLinhas, parseIndicadores, resumirItens, statusPedido, type Cliques, type Indicadores, type LinhaGuardada, type StatusPedido } from "../lib/afiliados";
import type { TableRows } from "../lib/csv";
import { CHART_COLORS } from "../lib/graficos";
import { fmtBRL, fmtDate, fmtDateTime, fmtNum } from "../lib/valores";
import { BarChart, HBarChart, PieChart, type Datum } from "./Charts";

export const PEDIDO_COLORS: Record<StatusPedido, string> = { pendente: "#facc15", concluido: "#22c55e", "nao pago": "#94a3b8", cancelado: "#f87171", outro: "#c084fc" };

function Kpi({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="pg-kpi" style={{ borderTopColor: color }}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function Picker({ id, title, hint, buttons, onFile, onClear, canClear }: { id: string; title: string; hint: string; buttons: string[]; onFile: (f: File) => void; onClear?: () => void; canClear?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  return (
    <>
      <h2 id={id} className="panel-title">{title}</h2>
      <p className="muted pg-note">{hint}</p>
      <div className="row pg-tools pg-noprint">
        {buttons.map((b, i) => (
          <span key={b}>
            <button type="button" className="btn btn-primary" onClick={() => refs.current[i]?.click()}><Upload size={14} /> {b}</button>
            <input ref={(el) => { refs.current[i] = el; }} type="file" accept=".xlsx,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden aria-label={b} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
          </span>
        ))}
        {canClear && onClear && <button type="button" className="btn btn-ghost" onClick={onClear}><Trash2 size={14} /> Limpar</button>}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Indicadores

export interface Guardado<T> { name: string; data: T }
export interface IndProps {
  cliques: Guardado<Cliques> | null;
  itens: Guardado<LinhaGuardada[]> | null;
  legado: Guardado<TableRows> | null;
  onFile: (f: File) => void;
  onClear: () => void;
}

export function IndicadoresReport({ cliques, itens, legado, onFile, onClear }: IndProps) {
  const result = useMemo((): { ind: Indicadores; fonte: string } | null => {
    try {
      if (cliques || itens) return { ind: combinarIndicadores(cliques?.data ?? null, itens ? lerLinhas(itens.data) : null), fonte: [cliques?.name, itens?.name].filter(Boolean).join(" + ") };
      if (legado) return { ind: parseIndicadores(legado.data), fonte: legado.name };
    } catch {
      return null;
    }
    return null;
  }, [cliques, itens, legado]);
  const ind = result?.ind;
  const data = result ? { name: result.fonte } : null;
  return (
    <section className="panel" aria-labelledby="pg-ind-t" id="pg-ind">
      <Picker
        id="pg-ind-t"
        title="Indicadores: Cliques, Pedidos, Comissão, Itens vendidos, Valor do pedido e Novos compradores"
        hint="O programa junta por dia o relatório de cliques (WebsiteClickReport), que dá os Cliques, com o de comissão (AffiliateCommissionReport, importado na seção logo abaixo), que dá Pedidos, Comissão, Itens vendidos, Valor do pedido e Novos compradores. Aceita .xlsx ou .csv e fica guardado neste navegador."
        buttons={["Importar Excel de Cliques (WebsiteClickReport)"]}
        onFile={onFile}
        onClear={onClear}
        canClear={!!(cliques || legado)}
      />
      {!ind && (cliques || itens || legado) && <p className="muted">Não consegui montar os indicadores com esses arquivos.</p>}
      {ind && !ind.found.includes("pedidos") && <p className="muted">Falta importar o AffiliateCommissionReport (seção abaixo) para mostrar Pedidos, Comissão, Itens vendidos, Valor do pedido e Novos compradores.</p>}
      {ind && !ind.found.includes("cliques") && <p className="muted">Falta o relatório de cliques para mostrar Cliques e a conversão.</p>}
      {ind && ind.found.includes("pedidos") && !ind.found.includes("novos") && <p className="muted">O relatório de comissão deste arquivo não traz a coluna de tipo de comprador, então “Novos compradores” não aparece.</p>}
      {ind && data && (
        <div className="stack" data-testid="ind-result">
          <p className="muted">Arquivo{data.name.includes(" + ") ? "s" : ""}: <strong>{data.name}</strong> · {ind.dias.length} {ind.dias.length === 1 ? "dia" : "dias"} ({ind.dias[0]?.label} a {ind.dias[ind.dias.length - 1]?.label})</p>
          <div className="pg-kpis">
            {INDICADORES.filter((d) => ind.found.includes(d.key)).map((d, i) => (
              <Kpi key={d.key} label={d.label} value={d.money ? fmtBRL(ind.totals[d.key]) : fmtNum(ind.totals[d.key])} color={CHART_COLORS[i]} />
            ))}
            {ind.found.includes("cliques") && ind.found.includes("pedidos") && <Kpi label="Conversão" value={`${fmtNum(ind.conversao)}%`} color="#a855f7" sub="pedidos ÷ cliques" />}
            {ind.found.includes("pedidos") && ind.found.includes("valor") && <Kpi label="Ticket médio" value={fmtBRL(ind.ticketMedio)} color="#14b8a6" sub="valor ÷ pedidos" />}
            {ind.found.includes("pedidos") && ind.found.includes("comissao") && <Kpi label="Comissão por pedido" value={fmtBRL(ind.comissaoPorPedido)} color="#f97316" />}
            {ind.melhorDia && <Kpi label="Melhor dia" value={ind.melhorDia.label} color="#eab308" sub={`${fmtBRL(ind.melhorDia.comissao)} de comissão`} />}
          </div>
          <div className="pg-grid2">
            {INDICADORES.filter((d) => ind.found.includes(d.key)).map((d, i) => (
              <BarChart
                key={d.key}
                title={`${d.label} por dia`}
                format={d.money ? fmtBRL : fmtNum}
                data={ind.dias.map((x): Datum => ({ name: x.label, value: x.values[d.key], color: CHART_COLORS[i] }))}
              />
            ))}
          </div>
          <div className="pg-scroll" tabIndex={0} role="group" aria-label="Tabela de indicadores por dia">
            <table className="pg-table pg-rep-table">
              <caption className="sr-only">Indicadores por dia</caption>
              <thead>
                <tr><th scope="col">Data</th>{INDICADORES.filter((d) => ind.found.includes(d.key)).map((d) => <th key={d.key} scope="col">{d.label}</th>)}</tr>
              </thead>
              <tbody>
                {ind.dias.map((x) => (
                  <tr key={x.label}>
                    <th scope="row">{x.label}</th>
                    {INDICADORES.filter((d) => ind.found.includes(d.key)).map((d) => <td key={d.key}>{d.money ? fmtBRL(x.values[d.key]) : fmtNum(x.values[d.key])}</td>)}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><th scope="row">Total</th>{INDICADORES.filter((d) => ind.found.includes(d.key)).map((d) => <td key={d.key}><strong>{d.money ? fmtBRL(ind.totals[d.key]) : fmtNum(ind.totals[d.key])}</strong></td>)}</tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ Itens

const ROWS_PAGE = 25;

function Badge({ s, text }: { s: StatusPedido; text?: string }) {
  return <span className="pg-badge" style={{ background: PEDIDO_COLORS[s] }}>{text ?? STATUS_PEDIDO_LABEL[s]}</span>;
}

function statusData(rows: { name: string; value: number }[]): Datum[] {
  return rows.map((r) => ({ ...r, color: PEDIDO_COLORS[statusPedido(r.name)] }));
}
const colorize = (rows: { name: string; value: number }[]): Datum[] => rows.map((r, i) => ({ ...r, color: CHART_COLORS[i % CHART_COLORS.length] }));

export function ItensReport({ itens, onFile, onClear }: { itens: Guardado<LinhaGuardada[]> | null; onFile: (f: File) => void; onClear: () => void }) {
  const [page, setPage] = useState(0);
  const it = useMemo(() => (itens ? resumirItens(lerLinhas(itens.data)) : null), [itens]);
  const data = itens ? { name: itens.name } : null;
  const pages = it ? Math.max(1, Math.ceil(it.linhas.length / ROWS_PAGE)) : 1;
  const cur = Math.min(page, pages - 1);
  const money = fmtBRL;

  return (
    <section className="panel" aria-labelledby="pg-it-t" id="pg-it">
      <Picker id="pg-it-t" title="Importar Itens do Excel (AffiliateCommissionReport)" hint="Relatório de comissão por item do painel de afiliados (.xlsx ou .csv), um pedido por linha: Status do Pedido, Horário, Loja, Nome do Item, Preço, Qtd, Valor de Compra, Reembolso, Canal e Comissão líquida. Fica guardado neste navegador." buttons={["Importar Itens do Excel"]} onFile={onFile} onClear={onClear} canClear={!!itens} />
      {it && data && (
        <div className="stack" data-testid="it-result">
          <p className="muted">Arquivo: <strong>{data.name}</strong> · {it.pedidosTodos} {it.pedidosTodos === 1 ? "pedido" : "pedidos"}{it.menorData && it.maiorData ? ` (${fmtDate(it.menorData)} a ${fmtDate(it.maiorData)})` : ""}</p>

          <h3 className="pg-sub"><FileSpreadsheet size={15} aria-hidden="true" /> Soma dos campos</h3>
          <div className="pg-kpis">
            <Kpi label="Pedidos válidos" value={fmtNum(it.pedidosValidos)} color="#3b82f6" sub="pendentes + concluídos" />
            <Kpi label="Comissão pendente" value={money(it.comissaoPendente)} color="#facc15" />
            <Kpi label="Comissão concluída" value={money(it.comissaoConcluida)} color="#22c55e" />
            <Kpi label="Valor de compra" value={money(it.somaCompra)} color="#a855f7" />
            <Kpi label="Preço (soma)" value={money(it.somaPreco)} color="#14b8a6" />
            <Kpi label="Reembolso" value={money(it.somaReembolso)} color="#f87171" />
            <Kpi label="Cancelamentos" value={`${fmtNum(it.taxaCancelamento)}%`} color="#ef4444" />
            <Kpi label="Ticket médio" value={money(it.ticketMedio)} color="#f97316" />
          </div>

          <div className="pg-grid2">
            <div>
              <h3 className="pg-sub">Top 10 itens (por quantidade)</h3>
              <ol className="pg-rank">
                {it.top10Itens.map((p, i) => (
                  <li key={p.name}>
                    <i style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
                    <span className="pg-rank-name">{p.name}</span>
                    <strong>{fmtNum(p.value)} un.</strong>
                    <span className="pg-badges">
                      {(Object.keys(p.status) as StatusPedido[]).filter((s) => p.status[s] > 0).map((s) => <Badge key={s} s={s} text={`${p.status[s]} ${STATUS_PEDIDO_LABEL[s].toLowerCase()}`} />)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="stack">
              <div>
                <h3 className="pg-sub">Top 5 lojas (pedidos)</h3>
                <ol className="pg-rank">{it.top5Lojas.map((p, i) => <li key={p.name}><i style={{ background: CHART_COLORS[i] }} aria-hidden="true" /><span className="pg-rank-name">{p.name}</span><strong>{fmtNum(p.value)}</strong></li>)}</ol>
              </div>
              <div>
                <h3 className="pg-sub">Top 5 itens por valor de compra</h3>
                <ol className="pg-rank">{it.top5Compra.map((p, i) => <li key={p.name}><i style={{ background: CHART_COLORS[i + 4 > 9 ? i : i + 4] }} aria-hidden="true" /><span className="pg-rank-name">{p.name}</span><strong>{money(p.value)}</strong></li>)}</ol>
              </div>
            </div>
          </div>

          <div className="pg-highlights">
            {it.horarioTop && (
              <div className="pg-hl" style={{ borderLeftColor: "#3b82f6" }}>
                <strong>Horário com mais vendas</strong>
                <span>{fmtDateTime(it.horarioTop.quando)}: {fmtNum(it.horarioTop.unidades)} {it.horarioTop.unidades === 1 ? "unidade" : "unidades"}, {money(it.horarioTop.comissao)} de comissão</span>
                <small>{it.horarioTop.item}</small>
              </div>
            )}
            {it.maiorComissao && (
              <div className="pg-hl" style={{ borderLeftColor: "#eab308" }}>
                <strong><Trophy size={14} aria-hidden="true" /> Maior comissão</strong>
                <span>{money(it.maiorComissao.valor)}</span>
                <small>{it.maiorComissao.item}</small>
              </div>
            )}
          </div>

          <div className="pg-grid2">
            <PieChart title="Pedidos por status" data={statusData(it.grafStatus)} />
            <PieChart title="Pedidos por canal" data={colorize(it.grafCanal)} />
            <HBarChart title="Pedidos por loja" data={colorize([...it.grafLoja].sort((a, b) => b.value - a.value).slice(0, 10))} />
            <HBarChart title="Comissão por item (top 10, R$)" format={money} data={colorize([...it.grafComissao].sort((a, b) => b.value - a.value).slice(0, 10))} />
            <HBarChart title="Quantidade por item (top 10)" data={colorize([...it.grafQtd].sort((a, b) => b.value - a.value).slice(0, 10))} />
            <HBarChart title="Preço por item (top 10, R$)" format={money} data={colorize([...it.grafPreco].sort((a, b) => b.value - a.value).slice(0, 10))} />
            <HBarChart title="Valor de compra por item (top 10, R$)" format={money} data={colorize([...it.grafCompra].sort((a, b) => b.value - a.value).slice(0, 10))} />
            <HBarChart title="Reembolso por item (R$)" format={money} data={colorize([...it.grafReembolso].filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 10))} />
          </div>
          <BarChart title="Unidades por horário do pedido" data={colorize(it.grafHorario.slice(0, 40))} />

          <h3 className="pg-sub">Pedidos ({it.linhas.length})</h3>
          <div className="pg-scroll" tabIndex={0} role="group" aria-label="Tabela de pedidos">
            <table className="pg-table pg-rep-table pg-orders">
              <caption className="sr-only">Pedidos importados</caption>
              <thead>
                <tr><th scope="col">Status</th><th scope="col">Horário</th><th scope="col">Loja</th><th scope="col">Item</th><th scope="col">Preço</th><th scope="col">Qtd</th><th scope="col">Compra</th><th scope="col">Reembolso</th><th scope="col">Canal</th><th scope="col">Comissão</th></tr>
              </thead>
              <tbody>
                {it.linhas.slice(cur * ROWS_PAGE, (cur + 1) * ROWS_PAGE).map((r, i) => {
                  const top = it.maiorComissao && r.comissao === it.maiorComissao.valor && r.item === it.maiorComissao.item;
                  return (
                    <tr key={cur * ROWS_PAGE + i} className={`pg-ord pg-ord-${r.status.replace(" ", "-")} ${top ? "is-top" : ""}`}>
                      <td><Badge s={r.status} text={r.statusTexto} /></td>
                      <td>{r.horario ? fmtDateTime(r.horario) : "–"}</td>
                      <td>{r.loja}</td>
                      <th scope="row">{r.item}</th>
                      <td>{money(r.preco)}</td>
                      <td>{fmtNum(r.qtd)}</td>
                      <td>{money(r.compra)}</td>
                      <td>{money(r.reembolso)}</td>
                      <td>{r.canal}</td>
                      <td>{money(r.comissao)}{top && <span className="pg-badge pg-badge-top"> maior</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="row pg-pager">
              <button type="button" className="btn btn-ghost" onClick={() => setPage(cur - 1)} disabled={cur === 0} aria-label="Página anterior dos pedidos"><ChevronLeft size={14} /></button>
              <span>Página {cur + 1} de {pages}</span>
              <button type="button" className="btn btn-ghost" onClick={() => setPage(cur + 1)} disabled={cur >= pages - 1} aria-label="Próxima página dos pedidos"><ChevronRight size={14} /></button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
