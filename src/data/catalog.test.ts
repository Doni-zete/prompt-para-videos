import { describe, expect, it } from "vitest";
import { CATALOG, GENERATORS } from "./catalog";
import { AI_TOOLS } from "../tools/definitions";

describe("painel", () => {
  it("os geradores ficam num card só e não aparecem soltos", () => {
    expect(CATALOG.filter((c) => c.id === "geradores")).toHaveLength(1);
    expect(CATALOG.some((c) => c.to.startsWith("/ferramenta/"))).toBe(false);
    expect(CATALOG.find((c) => c.id === "geradores")?.title).toBe("Geradores de Prompt");
  });
  it("o que já está no menu lateral (Geradores, Galeria, Progresso) não vira card do painel", () => {
    expect(CATALOG.filter((c) => c.inMenu).map((c) => c.id).sort()).toEqual(["galeria", "geradores", "progresso"]);
    expect(CATALOG.filter((c) => !c.inMenu).map((c) => c.id)).toEqual(["trendly", "humano", "manequins", "2k-seguidores", "mais-vendidos", "radar"]);
  });
  it("cada gerador abre uma ferramenta que existe, sem repetir", () => {
    const ids = GENERATORS.map((g) => g.to.replace("/ferramenta/", ""));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(AI_TOOLS.some((t) => t.id === id), id).toBe(true);
    expect(ids.length).toBe(AI_TOOLS.length);
  });
  it("Trendly agora se chama Tendências, mas o endereço antigo continua", () => {
    const t = CATALOG.find((c) => c.id === "trendly")!;
    expect(t.title).toBe("Tendências");
    expect(t.to).toBe("/trendly");
  });
});
