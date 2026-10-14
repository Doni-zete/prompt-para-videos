import { describe, expect, it } from "vitest";
import { createMediaResolver } from "./mediaResolver";
import { slug, uniqueSlug } from "./slug";

const manifest = {
  items: {
    "gallery/giro-360": { video: "gallery/Giro-360.mp4?v=aaaa1111", image: "gallery/giro-360.jpg?v=bbbb2222" },
    "avatars/carolina": { image: "avatars/carolina.png?v=cccc3333" },
    "avatars/f-bia": { image: "avatars/f-bia.jpg?v=dddd4444" },
    "styles/ugc": { video: "styles/ugc.mp4?v=eeee5555" },
  },
  ignored: [],
  warnings: [],
  totalBytes: 0,
};

describe("createMediaResolver", () => {
  const r = createMediaResolver(manifest, "./");
  it("liga o card ao arquivo pelo nome, sem diferenciar maiúsculas", () => {
    expect(r.resolve("gallery", ["Giro-360"])?.url).toBe("./media/gallery/Giro-360.mp4?v=aaaa1111");
  });
  it("vídeo com imagem do mesmo nome usa a imagem como capa", () => {
    const m = r.resolve("gallery", ["giro-360"]);
    expect(m?.kind).toBe("video");
    expect(m?.poster).toBe("./media/gallery/giro-360.jpg?v=bbbb2222");
  });
  it("tenta os nomes na ordem e devolve o primeiro que existir", () => {
    expect(r.resolve("avatars", ["nao-existe", "carolina"])?.kind).toBe("image");
    expect(r.resolve("avatars", ["nao-existe"])).toBeNull();
  });
  it("filtra por tipo", () => {
    expect(r.resolve("gallery", ["giro-360"], { kind: "image" })?.kind).toBe("image");
    expect(r.resolve("avatars", ["carolina"], { kind: "video" })).toBeNull();
  });
  it("não mistura categorias", () => {
    expect(r.has("styles", ["giro-360"])).toBe(false);
    expect(r.has("styles", ["ugc"])).toBe(true);
  });
  it("lista os nomes de uma categoria", () => {
    expect(r.idsIn("avatars").sort()).toEqual(["carolina", "f-bia"]);
  });
  it("monta a URL com a base do site", () => {
    expect(createMediaResolver(manifest, "/repo").resolve("styles", ["ugc"])?.url).toBe("/repo/media/styles/ugc.mp4?v=eeee5555");
  });
});

describe("slug", () => {
  it("remove acentos e símbolos", () => {
    expect(slug("Calça Feminina (Cintura Alta)!")).toBe("calca-feminina-cintura-alta");
    expect(slug("  ")).toBe("");
  });
  it("evita nomes repetidos", () => {
    expect(uniqueSlug("Garrafa", ["garrafa", "garrafa-2"])).toBe("garrafa-3");
    expect(uniqueSlug("", [], "produto")).toBe("produto");
  });
});
