/** Cores dos gráficos. O texto sobre as cores é sempre escuro (#0b1220) para manter o contraste. */
export type Level = "none" | "red" | "amber" | "lime" | "green";

export const LEVEL_COLORS: Record<Level, string> = {
  none: "#334155",
  red: "#ef4444",
  amber: "#f59e0b",
  lime: "#84cc16",
  green: "#22c55e",
};

export const LEVEL_LABELS: Record<Exclude<Level, "none">, string> = {
  red: "Abaixo de 30%",
  amber: "30% a 59%",
  lime: "60% a 89%",
  green: "90% a 100%",
};

/** Faixa de desempenho de um percentual. Dia que ainda não chegou não tem cor de desempenho. */
export function levelOf(pct: number, future = false): Level {
  if (future) return "none";
  if (pct >= 90) return "green";
  if (pct >= 60) return "lime";
  if (pct >= 30) return "amber";
  return "red";
}

/** Uma cor para cada meta (repete depois de 8). */
export const GOAL_COLORS = ["#60a5fa", "#c084fc", "#f472b6", "#fb923c", "#2dd4bf", "#facc15", "#a3e635", "#f87171"];
export const goalColor = (index: number): string => GOAL_COLORS[((index % GOAL_COLORS.length) + GOAL_COLORS.length) % GOAL_COLORS.length];

export const STATUS_COLORS = {
  "Concluído": "#22c55e",
  Editando: "#facc15",
  "Não começou": "#f87171",
} as const;
