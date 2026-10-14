import { describe, expect, it } from "vitest";
import { SEED_PRODUCTS } from "../trendly/data/products";
import { buildSlots, claimedKeys, libraryNames } from "./mediaSlots";

describe("mapa de mídia", () => {
  const slots = buildSlots(SEED_PRODUCTS);

  it("cada card tem um nome de arquivo único dentro da sua categoria", () => {
    const keys = slots.map((s) => `${s.category}/${s.names[0]}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("só usa caracteres seguros em nomes de arquivo", () => {
    for (const s of slots) for (const n of s.names) expect(n).toMatch(/^[a-z0-9][a-z0-9-]*$/);
  });
  it("cobre todos os lugares que mostram mídia", () => {
    const groups = new Set(slots.map((s) => s.group));
    for (const g of ["Reels Studio: capas dos estilos", "Galeria de Prompts", "Avatares", "Produtos", "Hacks Virais: exemplos", "Prompts dos Vídeos do TikTok", "Prompts Prontas", "Movimentos Especiais"]) {
      expect(groups.has(g)).toBe(true);
    }
    expect(slots.length).toBeGreaterThan(150);
  });
  it("exemplos de nomes esperados", () => {
    const keys = new Set(claimedKeys(slots));
    for (const k of ["styles/ugc", "styles/pov", "styles/provador", "gallery/giro-360", "avatars/carolina", "avatars/base-carolina", "hacks/frutas-ex1", "products/calca-feminina", "interactions/espelho", "poses/cintura", "hands/sem-maos", "library/roupas-infantis", "library/video-1"]) {
      expect(keys.has(k)).toBe(true);
    }
  });
  it("cards das bibliotecas aceitam o título e o id", () => {
    expect(libraryNames({ id: "video-0", title: "Eletrodomésticos" })).toEqual(["eletrodomesticos", "video-0"]);
    expect(libraryNames({ id: "ana", title: "Ana" })).toEqual(["ana"]);
  });
});
