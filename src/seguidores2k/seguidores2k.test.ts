import { describe, expect, it } from "vitest";
import { BASE_OBRIGATORIA, CENAS, NEGATIVE_PROMPT, PERFIS } from "./data/kit";
import { FRASE_CHAVE, VAZIO, filtrarCenas, montarPerfil, montarVideo, temProfissao, textoCena } from "./lib/prompts";

describe("kit 2K de seguidores", () => {
  it("tem 13 perfis e 50 cenas numerados e sem ruído de rodapé", () => {
    expect(PERFIS).toHaveLength(13);
    expect(CENAS.map((c) => c.id)).toEqual(Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, "0")));
    for (const t of [...PERFIS, ...CENAS].map((x) => x.text).concat(BASE_OBRIGATORIA, NEGATIVE_PROMPT)) {
      expect(t).not.toMatch(/Siga-me|Página \d|\[fill in\]/);
    }
  });
  it("monta o perfil só com os campos preenchidos", () => {
    const t = montarPerfil(PERFIS[0], { ...VAZIO, hair: " long  brown " }, true);
    expect(t).toContain("Hair: long brown");
    expect(t).not.toContain("Skin:");
    expect(t.endsWith(FRASE_CHAVE)).toBe(true);
    expect(montarPerfil(PERFIS[0], VAZIO, false)).toBe(PERFIS[0].text);
  });
  it("troca [PROFESSION] só nas cenas 19 e 26", () => {
    expect(CENAS.filter(temProfissao).map((c) => c.id)).toEqual(["19", "26"]);
    expect(textoCena(CENAS[18], "enfermeira")).toContain("eu sou a enfermeira que");
    expect(textoCena(CENAS[18], "")).toContain("[PROFESSION]");
  });
  it("cena completa = base + cena", () => {
    expect(montarVideo(CENAS[0], "").startsWith(BASE_OBRIGATORIA)).toBe(true);
    expect(montarVideo(CENAS[0], "").endsWith(CENAS[0].text)).toBe(true);
  });
  it("filtra por número, título e texto sem acento", () => {
    expect(filtrarCenas("7").map((c) => c.id)).toContain("07");
    expect(filtrarCenas("cafe").length).toBeGreaterThanOrEqual(2);
    expect(filtrarCenas("")).toHaveLength(50);
  });
});
