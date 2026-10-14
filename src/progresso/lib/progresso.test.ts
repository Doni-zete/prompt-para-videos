import { describe, expect, it } from "vitest";
import {
  addGoal, clearDays, fromIso, goalStats, monthDays, moveGoal, quoteOfDay, rangeLabel, rangeStat, removeGoal, renameGoal,
  setAllForDay, streak, toIso, toggleDone, weekDays, weekMessage, weekStart, weekdayStats, MAX_GOALS, type DoneMap, type Goal,
} from "./progresso";
import { QUOTES } from "../data/quotes";

const G: Goal[] = [{ id: "a", text: "A" }, { id: "b", text: "B" }];
// 2026-10-10 é um sábado
const TODAY = "2026-10-10";

describe("datas", () => {
  it("a semana vai de domingo a sábado", () => {
    const s = weekStart(fromIso(TODAY));
    expect(toIso(s)).toBe("2026-10-04");
    expect(weekDays(s)).toEqual(["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"]);
  });
  it("domingo abre a própria semana e virada de mês funciona", () => {
    expect(toIso(weekStart(fromIso("2026-11-01")))).toBe("2026-11-01");
    expect(weekDays(weekStart(fromIso("2026-10-31")))[0]).toBe("2026-10-25");
    expect(rangeLabel(weekDays(weekStart(fromIso("2026-10-31"))))).toBe("25 a 31 de out");
  });
  it("conta os dias do mês, inclusive fevereiro bissexto", () => {
    expect(monthDays(2028, 1)).toHaveLength(29);
    expect(monthDays(2026, 1)).toHaveLength(28);
    expect(monthDays(2026, 9)[0]).toBe("2026-10-01");
  });
  it("rótulo entre meses mostra os dois", () => {
    expect(rangeLabel(weekDays(weekStart(fromIso("2026-11-01"))))).toBe("1 a 7 de nov");
    expect(rangeLabel(weekDays(weekStart(fromIso("2026-10-28"))))).toBe("25 a 31 de out");
    expect(rangeLabel(weekDays(weekStart(fromIso("2026-09-30"))))).toBe("27 set a 3 out");
  });
});

describe("marcações", () => {
  it("marca, desmarca e não grava dia futuro", () => {
    let d: DoneMap = toggleDone({}, "2026-10-09", "a", TODAY);
    expect(d).toEqual({ "2026-10-09": ["a"] });
    d = toggleDone(d, "2026-10-09", "a", TODAY);
    expect(d).toEqual({});
    expect(toggleDone({}, "2026-10-11", "a", TODAY)).toEqual({});
  });
  it("marcar o dia todo e limpar", () => {
    const d = setAllForDay(G, {}, TODAY, true, TODAY);
    expect(d[TODAY]).toEqual(["a", "b"]);
    expect(setAllForDay(G, d, TODAY, false, TODAY)).toEqual({});
    expect(clearDays(d, [TODAY])).toEqual({});
  });
});

describe("percentuais", () => {
  const done: DoneMap = { "2026-10-04": ["a", "b"], "2026-10-05": ["a"], "2026-10-10": ["b", "fantasma"] };
  it("semana: só dias até hoje contam; ids de metas apagadas são ignorados", () => {
    const r = rangeStat(G, done, weekDays(weekStart(fromIso(TODAY))), TODAY);
    expect(r.total).toBe(14);
    expect(r.done).toBe(4);
    expect(r.pct).toBe(29);
  });
  it("dias futuros não puxam a média para baixo", () => {
    const r = rangeStat(G, { "2026-10-04": ["a", "b"] }, weekDays(weekStart(fromIso(TODAY))), "2026-10-04");
    expect(r.pct).toBe(100);
    expect(r.days.filter((d) => d.future)).toHaveLength(6);
  });
  it("sem metas o percentual é 0, sem dividir por zero", () => {
    expect(rangeStat([], {}, [TODAY], TODAY).pct).toBe(0);
  });
  it("percentual por meta e por dia da semana", () => {
    const days = weekDays(weekStart(fromIso(TODAY)));
    expect(goalStats(G, done, days, TODAY).map((g) => g.pct)).toEqual([29, 29]);
    const wd = weekdayStats(G, done, monthDays(2026, 9), TODAY);
    expect(wd[0].pct).toBe(100); // domingos até 10/10: só o dia 4 (2 de 2)
    expect(wd[6].pct).toBe(25); // sábados até 10/10: dias 3 e 10, 1 de 4
  });
});

describe("sequência", () => {
  it("conta dias seguidos completos e hoje aberto não quebra", () => {
    const full = (iso: string): [string, string[]] => [iso, ["a", "b"]];
    const d: DoneMap = Object.fromEntries([full("2026-10-07"), full("2026-10-08"), full("2026-10-09")]);
    expect(streak(G, d, TODAY)).toBe(3);
    expect(streak(G, { ...d, ...Object.fromEntries([full(TODAY)]) }, TODAY)).toBe(4);
    expect(streak(G, { ...d, "2026-10-08": ["a"] }, TODAY)).toBe(1);
    expect(streak([], d, TODAY)).toBe(0);
    expect(streak(G, {}, TODAY)).toBe(0);
  });
});

describe("metas", () => {
  it("adiciona com texto limpo, recusa vazio e respeita o limite", () => {
    const g = addGoal(G, "  Postar   3  Reels ");
    expect(g).toHaveLength(3);
    expect(g[2].text).toBe("Postar 3 Reels");
    expect(addGoal(G, "   ")).toBe(G);
    let many = G;
    for (let i = 0; i < 20; i++) many = addGoal(many, `m${i}`);
    expect(many).toHaveLength(MAX_GOALS);
    expect(new Set(many.map((m) => m.id)).size).toBe(many.length);
  });
  it("renomeia, reordena e remove limpando só as marcações dela", () => {
    expect(renameGoal(G, "a", " Novo ")[0].text).toBe("Novo");
    expect(renameGoal(G, "a", "  ")).toBe(G);
    expect(moveGoal(G, "a", 1).map((g) => g.id)).toEqual(["b", "a"]);
    expect(moveGoal(G, "a", -1)).toBe(G);
    const r = removeGoal(G, { x: ["a"], y: ["a", "b"] }, "a");
    expect(r.goals.map((g) => g.id)).toEqual(["b"]);
    expect(r.done).toEqual({ y: ["b"] });
  });
});

describe("frase do dia e recado", () => {
  it("muda a cada dia, é estável no dia e percorre todas as frases", () => {
    expect(QUOTES.length).toBeGreaterThanOrEqual(50);
    expect(quoteOfDay(new Date(2026, 9, 10, 8))).toEqual(quoteOfDay(new Date(2026, 9, 10, 22)));
    expect(quoteOfDay(new Date(2026, 9, 10))).not.toEqual(quoteOfDay(new Date(2026, 9, 11)));
    const seen = new Set(Array.from({ length: QUOTES.length }, (_, i) => quoteOfDay(new Date(2026, 0, 1 + i)).quote));
    expect(seen.size).toBe(QUOTES.length);
  });
  it("recado conforme o percentual", () => {
    expect(weekMessage(0, 0)).toMatch(/não começou/);
    expect(weekMessage(100, 3)).toMatch(/perfeita/);
    expect(weekMessage(0, 3)).toMatch(/Nenhuma/);
  });
});
