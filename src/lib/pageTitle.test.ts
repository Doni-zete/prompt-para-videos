import { describe, expect, it } from "vitest";
import { CATALOG, GENERATORS } from "../data/catalog";
import { APP_NAME, titleFor } from "./pageTitle";

describe("título da aba", () => {
  it("o painel mantém o título original e as demais telas levam o nome da tela", () => {
    expect(titleFor("/")).toBe("Prompt para Vídeo | TikTok Shop Creator");
    expect(titleFor("/divulgador")).toBe(`Divulgador | ${APP_NAME}`);
    expect(titleFor("/galeria")).toBe(`Galeria de Prompts | ${APP_NAME}`);
    expect(titleFor("/progresso")).toBe(`Progresso Semanal | ${APP_NAME}`);
    expect(titleFor("/geradores")).toBe(`Geradores de Prompt | ${APP_NAME}`);
    expect(titleFor("/trendly")).toBe(`Tendências | ${APP_NAME}`);
    expect(titleFor("/manequins")).toBe(`Manequins | ${APP_NAME}`);
    expect(titleFor("/2k-seguidores")).toBe(`2K DE SEGUIDORES | ${APP_NAME}`);
    expect(titleFor("/humano")).toBe(`Humanizar IA | ${APP_NAME}`);
    expect(titleFor("/configuracoes")).toBe(`Configurações | ${APP_NAME}`);
    expect(titleFor("/trendly/midia")).toBe(`Mapa de mídia | ${APP_NAME}`);
  });
  it("as ferramentas do painel usam o título do próprio card", () => {
    for (const c of [...CATALOG, ...GENERATORS].filter((x) => x.to.startsWith("/ferramenta/"))) expect(titleFor(c.to), c.to).toBe(`${c.title} | ${APP_NAME}`);
  });
  it("todos os 9 geradores têm título próprio (não caem em \"Página não encontrada\")", () => {
    expect(GENERATORS).toHaveLength(9);
    for (const g of GENERATORS) expect(titleFor(g.to), g.to).toBe(`${g.title} | ${APP_NAME}`);
  });
  it("assistentes e hacks de Tendências mostram o estilo", () => {
    expect(titleFor("/trendly/reels")).toBe(`Reels Studio | ${APP_NAME}`);
    expect(titleFor("/trendly/reels/ugc")).toBe(`Reels Studio: UGC | ${APP_NAME}`);
    expect(titleFor("/trendly/reels/provador")).toBe(`Reels Studio: Provador | ${APP_NAME}`);
    expect(titleFor("/trendly/hacks/frutas")).toBe(`Hacks Virais: Frutas Falantes | ${APP_NAME}`);
  });
  it("telas 'Em breve' usam o título delas; endereço desconhecido vira 'Página não encontrada'", () => {
    expect(titleFor("/em-breve/radar")).toBe(`Radar de Produto em Alta | ${APP_NAME}`);
    expect(titleFor("/nada")).toBe(`Página não encontrada | ${APP_NAME}`);
    expect(titleFor("/trendly/reels/xyz")).toBe(`Página não encontrada | ${APP_NAME}`);
  });
  it("barra final não atrapalha", () => {
    expect(titleFor("/galeria/")).toBe(titleFor("/galeria"));
  });
});
