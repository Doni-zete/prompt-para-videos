/** Contas dos gráficos (sem depender de biblioteca): escala "redonda", rótulos curtos e fatias de pizza. */

export const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6", "#ec4899", "#f97316", "#84cc16", "#06b6d4"];
export const chartColor = (i: number): string => CHART_COLORS[((i % CHART_COLORS.length) + CHART_COLORS.length) % CHART_COLORS.length];

/** Maior valor "redondo" (1, 2, 5 ou 10 vezes uma potência de 10) que cobre v. */
export function niceMax(v: number): number {
  if (!(v > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

export function ticks(max: number, n = 4): number[] {
  return Array.from({ length: n + 1 }, (_, i) => (max / n) * i);
}

export function shorten(s: string, n: number): string {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, Math.max(1, n - 1)).trimEnd()}…`;
}

export interface Slice {
  name: string;
  value: number;
  pct: number;
  /** Ângulos em radianos, a partir do topo, no sentido horário. */
  start: number;
  end: number;
}

export function pieSlices(data: { name: string; value: number }[]): Slice[] {
  const items = data.filter((d) => d.value > 0);
  const total = items.reduce((s, d) => s + d.value, 0);
  let a = 0;
  return items.map((d) => {
    const span = total > 0 ? (d.value / total) * Math.PI * 2 : 0;
    const s = { name: d.name, value: d.value, pct: total > 0 ? Math.round((d.value / total) * 1000) / 10 : 0, start: a, end: a + span };
    a += span;
    return s;
  });
}

/** Caminho SVG de uma fatia (centro cx,cy; raio r). Fatia de 100% vira círculo. */
export function slicePath(cx: number, cy: number, r: number, start: number, end: number): string {
  if (end - start >= Math.PI * 2 - 1e-6) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
  const pt = (a: number) => `${(cx + r * Math.sin(a)).toFixed(2)} ${(cy - r * Math.cos(a)).toFixed(2)}`;
  return `M ${cx} ${cy} L ${pt(start)} A ${r} ${r} 0 ${end - start > Math.PI ? 1 : 0} 1 ${pt(end)} Z`;
}
