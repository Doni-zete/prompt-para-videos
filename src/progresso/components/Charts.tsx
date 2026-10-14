import { CHART_COLORS, chartColor, niceMax, pieSlices, shorten, slicePath, ticks } from "../lib/graficos";
import { LEVEL_COLORS, LEVEL_LABELS, STATUS_COLORS, levelOf } from "../lib/cores";
import { STATUSES, type Status } from "../lib/grade";

export interface Datum {
  name: string;
  value: number;
  color?: string;
}
const defaultFmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Tabela escondida com os mesmos números do gráfico, para leitor de tela. */
function DataTable({ title, data, format }: { title: string; data: Datum[]; format: (n: number) => string }) {
  return (
    <table className="sr-only">
      <caption>{title}</caption>
      <tbody>{data.map((d) => <tr key={d.name}><th scope="row">{d.name}</th><td>{format(d.value)}</td></tr>)}</tbody>
    </table>
  );
}

const summary = (title: string, data: Datum[], format: (n: number) => string) =>
  `${title}: ${data.length ? data.slice(0, 5).map((d) => `${d.name} ${format(d.value)}`).join(", ") + (data.length > 5 ? ` e mais ${data.length - 5}` : "") : "sem dados"}`;

/** Barras verticais coloridas, uma cor por barra. */
export function BarChart({ title, data, format = defaultFmt, height = 280 }: { title: string; data: Datum[]; format?: (n: number) => string; height?: number }) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const L = Math.max(58, Math.max(...ticks(max).map((t) => format(t).length)) * 8 + 14), T = 26, B = 78, slot = 62;
  const natural = Math.max(320, L + data.length * slot + 12);
  const W = Math.max(natural, 900);
  const H = height;
  const plotH = H - T - B;
  return (
    <figure className="pg-chart">
      <figcaption>{title}</figcaption>
      {data.length === 0 ? (
        <p className="muted pg-chart-empty">Sem dados para este gráfico.</p>
      ) : (
        <div className="pg-chart-scroll" tabIndex={0} role="group" aria-label={`Gráfico rolável: ${title}`}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: natural, height: "auto" }} role="img" aria-label={summary(title, data, format)}>
            {ticks(max).map((t) => {
              const y = T + plotH - (t / max) * plotH;
              return (
                <g key={t}>
                  <line x1={L} x2={W - 6} y1={y} y2={y} className="pg-grid" />
                  <text x={L - 6} y={y + 4} textAnchor="end" className="pg-axis">{format(t)}</text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const h = (d.value / max) * plotH;
              const x = L + i * slot + 7;
              const color = d.color ?? chartColor(i);
              return (
                <g key={d.name + i}>
                  <rect x={x} y={T + plotH - h} width={slot - 14} height={Math.max(h, d.value > 0 ? 2 : 0)} rx={4} fill={color}><title>{`${d.name}: ${format(d.value)}`}</title></rect>
                  <text x={x + (slot - 14) / 2} y={T + plotH - h - 5} textAnchor="middle" className="pg-val">{format(d.value)}</text>
                  <text transform={`translate(${x + (slot - 14) / 2 + 4} ${T + plotH + 14}) rotate(35)`} className="pg-axis">{shorten(d.name, 16)}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
      <DataTable title={title} data={data} format={format} />
    </figure>
  );
}

/** Barras horizontais coloridas, boas para nomes longos (itens, lojas). */
export function HBarChart({ title, data, format = defaultFmt }: { title: string; data: Datum[]; format?: (n: number) => string }) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const rowH = 36, L = 270, R = 90, T = 6;
  const W = 760;
  const H = T + data.length * rowH + 6;
  return (
    <figure className="pg-chart">
      <figcaption>{title}</figcaption>
      {data.length === 0 ? (
        <p className="muted pg-chart-empty">Sem dados para este gráfico.</p>
      ) : (
        <div className="pg-chart-scroll" tabIndex={0} role="group" aria-label={`Gráfico rolável: ${title}`}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 560, maxWidth: W, height: "auto" }} role="img" aria-label={summary(title, data, format)}>
            {data.map((d, i) => {
              const w = (d.value / max) * (W - L - R);
              const y = T + i * rowH;
              return (
                <g key={d.name + i}>
                  <text x={L - 8} y={y + 22} textAnchor="end" className="pg-axis">{shorten(d.name, 34)}<title>{d.name}</title></text>
                  <rect x={L} y={y + 6} width={Math.max(w, d.value > 0 ? 2 : 0)} height={22} rx={4} fill={d.color ?? chartColor(i)}><title>{`${d.name}: ${format(d.value)}`}</title></rect>
                  <text x={L + w + 6} y={y + 22} className="pg-val">{format(d.value)}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
      <DataTable title={title} data={data} format={format} />
    </figure>
  );
}

/** Pizza colorida com legenda (valor e percentual de cada fatia). */
export function PieChart({ title, data, format = defaultFmt }: { title: string; data: Datum[]; format?: (n: number) => string }) {
  const slices = pieSlices(data);
  const colorOf = (name: string) => data.find((d) => d.name === name)?.color ?? chartColor(data.findIndex((d) => d.name === name));
  return (
    <figure className="pg-chart pg-pie">
      <figcaption>{title}</figcaption>
      {slices.length === 0 ? (
        <p className="muted pg-chart-empty">Sem dados para este gráfico.</p>
      ) : (
        <div className="pg-pie-body">
          <svg width="200" height="200" viewBox="0 0 180 180" role="img" aria-label={summary(title, data.filter((d) => d.value > 0), format)}>
            {slices.map((s) => (
              <path key={s.name} d={slicePath(90, 90, 84, s.start, s.end)} fill={colorOf(s.name)} stroke="var(--panel-solid)" strokeWidth="2"><title>{`${s.name}: ${format(s.value)} (${s.pct}%)`}</title></path>
            ))}
          </svg>
          <ul className="pg-legend pg-legend-col">
            {slices.map((s) => (
              <li key={s.name}><i style={{ background: colorOf(s.name) }} aria-hidden="true" /><span>{s.name}</span><strong>{format(s.value)}</strong><small>{s.pct}%</small></li>
            ))}
          </ul>
        </div>
      )}
      <DataTable title={title} data={data} format={format} />
    </figure>
  );
}

/** Anel de percentual, colorido pela faixa de desempenho. */
export function Donut({ pct, label, size = 96, color }: { pct: number; label: string; size?: number; color?: string }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const col = color ?? LEVEL_COLORS[levelOf(pct)];
  return (
    <div className="pg-donut" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${pct}%`}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(c * Math.min(100, pct)) / 100} ${c}`} transform="rotate(-90 50 50)" />
      </svg>
      <span aria-hidden="true">{pct}%</span>
    </div>
  );
}

export function LevelLegend() {
  return (
    <ul className="pg-legend" aria-label="Legenda das cores">
      {(Object.keys(LEVEL_LABELS) as (keyof typeof LEVEL_LABELS)[]).map((k) => (
        <li key={k}><i style={{ background: LEVEL_COLORS[k] }} aria-hidden="true" />{LEVEL_LABELS[k]}</li>
      ))}
      <li><i style={{ background: LEVEL_COLORS.none }} aria-hidden="true" />Dia que ainda não chegou</li>
    </ul>
  );
}

/** Barra empilhada com os três status (verde, amarelo, vermelho). */
export function StatusBar({ counts, label }: { counts: Record<Status, number>; label: string }) {
  const total = STATUSES.reduce((n, s) => n + counts[s], 0);
  return (
    <div className="pg-stack" role="img" aria-label={`${label}: ${STATUSES.map((s) => `${counts[s]} ${s.toLowerCase()}`).join(", ")}`}>
      {total === 0 ? <span className="pg-stack-empty" /> : STATUSES.map((s) => (counts[s] ? <span key={s} style={{ flex: counts[s], background: STATUS_COLORS[s] }} /> : null))}
    </div>
  );
}

export function StatusLegend() {
  return (
    <ul className="pg-legend" aria-label="Legenda dos status">
      {STATUSES.map((s) => <li key={s}><i style={{ background: STATUS_COLORS[s] }} aria-hidden="true" />{s}</li>)}
    </ul>
  );
}

export { CHART_COLORS };
