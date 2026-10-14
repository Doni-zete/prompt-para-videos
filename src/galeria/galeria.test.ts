import { describe, expect, it } from "vitest";
import { MOVIMENTOS } from "../data/movimentos";
import { PRONTAS, PRONTAS_CATEGORIES } from "../data/promptsProntas";
import { VIDEO_PROMPTS } from "../data/videoPrompts";
import { GALLERY } from "../trendly/data/gallery";
import {
  CATEGORIES, COLLECTIONS, EMPTY_FILTERS, HOW_TO, MEDIA_CATEGORY, READY_CATEGORY, activeFilters, applyEdits, buildItems, categoryLabel, facetCounts, withoutFilter, categoryOf, countItems, displayTitle, filterItems, humanize, inferKind, isCollection, libraryViews, subtitleOf,
} from "./lib/galeria";

const items = () => applyEdits(buildItems([], () => "video"), {});
const hasMedia = () => false;
const noFav = () => false;

describe("categorias", () => {
  it("cada um dos prompts da galeria está em exatamente uma categoria que existe", () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const g of GALLERY) expect(ids.has(categoryOf(g.id)), g.id).toBe(true);
    const all = items();
    expect(all).toHaveLength(GALLERY.length);
    expect(new Set(all.map((i) => i.category)).size).toBe(CATEGORIES.length);
  });
  it("nenhuma categoria fica vazia e a soma bate com o total", () => {
    const c = countItems(items(), noFav, hasMedia);
    for (const cat of CATEGORIES) expect(c.byCategory[cat.id], cat.id).toBeGreaterThan(0);
    expect(Object.values(c.byCategory).reduce((a, b) => a + b, 0)).toBe(GALLERY.length);
  });
  it("rótulos em português", () => {
    expect(categoryLabel("pov")).toBe("POV");
    expect(categoryLabel(MEDIA_CATEGORY.id)).toBe("Minha mídia");
    expect(categoryLabel("x")).toBe("");
  });
});

describe("vídeos novos pela pasta de mídia", () => {
  const withMedia = buildItems(["giro-360", "meu-video-novo", "foto_nova", "meu-video-novo", "zeta"], (n) => (n === "foto_nova" ? "image" : "video"));
  it("só nomes sem card próprio viram cards, sem repetir, em ordem alfabética e antes dos demais", () => {
    expect(withMedia).toHaveLength(GALLERY.length + 3);
    expect(withMedia.slice(0, 3).map((i) => i.id)).toEqual(["media:foto_nova", "media:meu-video-novo", "media:zeta"]);
    expect(withMedia.filter((i) => i.fromMedia)).toHaveLength(3);
    expect(withMedia.find((i) => i.id === "giro-360")?.fromMedia).toBe(false);
  });
  it("o card automático tem título legível, tipo certo, categoria 'Minha mídia' e prompt vazio", () => {
    const v = withMedia.find((i) => i.id === "media:meu-video-novo")!;
    expect(v).toMatchObject({ title: "Meu video novo", kind: "video", category: "midia", prompt: "", mediaNames: ["meu-video-novo"] });
    expect(withMedia.find((i) => i.id === "media:foto_nova")).toMatchObject({ title: "Foto nova", kind: "image" });
  });
  it("humanize", () => {
    expect(humanize("giro-lateral_novo")).toBe("Giro lateral novo");
    expect(humanize("  a--b ")).toBe("A b");
  });
  it("o título sem o '(Vídeo)'/'(Imagem)', que o selo do card já mostra", () => {
    expect(displayTitle("Segurando pacote de TikTok Shop (Vídeo)")).toBe("Segurando pacote de TikTok Shop");
    expect(displayTitle("POV - Sapatos (Imagem)")).toBe("POV - Sapatos");
    expect(displayTitle("Dancinha")).toBe("Dancinha");
  });
});

describe("edição do prompt", () => {
  it("sem edição, nada vem marcado como editado", () => {
    expect(items().every((i) => !i.edited)).toBe(true);
  });
  it("editar o prompt marca como editado e guarda o original", () => {
    const [a] = applyEdits(buildItems([], () => "video"), { "giro-360": { prompt: "meu prompt novo" } });
    const e = applyEdits(buildItems([], () => "video"), { "giro-360": { prompt: "meu prompt novo" } }).find((i) => i.id === "giro-360")!;
    expect(a).toBeTruthy();
    expect(e.prompt).toBe("meu prompt novo");
    expect(e.edited).toBe(true);
    expect(e.originalPrompt).toBe(GALLERY.find((g) => g.id === "giro-360")!.prompt);
    expect(e.title).toBe(GALLERY.find((g) => g.id === "giro-360")!.title);
  });
  it("editar para o mesmo texto do original não conta como editado", () => {
    const orig = GALLERY.find((g) => g.id === "giro-360")!;
    const e = applyEdits(buildItems([], () => "video"), { "giro-360": { prompt: orig.prompt, title: orig.title } }).find((i) => i.id === "giro-360")!;
    expect(e.edited).toBe(false);
  });
  it("o card da mídia começa sem prompt e passa a ter o que o usuário escreveu", () => {
    const base = buildItems(["novo"], () => "video");
    expect(applyEdits(base, {})[0].prompt).toBe("");
    const e = applyEdits(base, { "media:novo": { title: "Meu giro", prompt: "escrevi" } })[0];
    expect(e).toMatchObject({ title: "Meu giro", prompt: "escrevi", edited: true });
  });
  it("um prompt apagado de propósito ('') vale mais do que o original", () => {
    const e = applyEdits(buildItems([], () => "video"), { "giro-360": { prompt: "" } }).find((i) => i.id === "giro-360")!;
    expect(e.prompt).toBe("");
    expect(e.edited).toBe(true);
  });
});

describe("filtros e contagens", () => {
  const all = applyEdits(buildItems(["novo-a"], () => "video"), { "giro-360": { prompt: "x" } });
  const media = (it: { fromMedia: boolean; id: string }) => it.fromMedia || it.id === "giro-360";
  it("por formato", () => {
    const v = filterItems(all, { ...EMPTY_FILTERS, kind: "video" }, noFav, media);
    const im = filterItems(all, { ...EMPTY_FILTERS, kind: "image" }, noFav, media);
    expect(v.length + im.length).toBe(all.length);
    expect(v.every((i) => i.kind === "video")).toBe(true);
  });
  it("por categoria, por estilo do Reels Studio e por 'novos', 'editados' e 'com mídia'", () => {
    expect(filterItems(all, { ...EMPTY_FILTERS, category: "pov" }, noFav, media)).toHaveLength(5);
    expect(filterItems(all, { ...EMPTY_FILTERS, style: "pov" }, noFav, media).every((i) => i.styles.includes("pov"))).toBe(true);
    expect(filterItems(all, { ...EMPTY_FILTERS, view: "new" }, noFav, media).map((i) => i.id)).toEqual(["media:novo-a"]);
    expect(filterItems(all, { ...EMPTY_FILTERS, view: "edited" }, noFav, media).map((i) => i.id)).toEqual(["giro-360"]);
    expect(filterItems(all, { ...EMPTY_FILTERS, view: "media" }, noFav, media).map((i) => i.id).sort()).toEqual(["giro-360", "media:novo-a"]);
  });
  it("favoritos", () => {
    expect(filterItems(all, { ...EMPTY_FILTERS, view: "fav" }, (i) => ["dancinha", "pov-cabide"].includes(i.id), media).map((i) => i.id).sort()).toEqual(["dancinha", "pov-cabide"]);
  });
  it("a busca ignora acento e maiúscula e olha título, descrição e o texto do prompt", () => {
    expect(filterItems(all, { ...EMPTY_FILTERS, q: "ROTAÇÃO 360" }, noFav, media).map((i) => i.id)).toContain("giro-360");
    expect(filterItems(all, { ...EMPTY_FILTERS, q: "no watermark whatever-xyz" }, noFav, media)).toHaveLength(0);
    expect(filterItems(all, { ...EMPTY_FILTERS, q: "watermarks" }, noFav, media).length).toBeGreaterThan(10);
  });
  it("filtros se combinam", () => {
    const r = filterItems(all, { ...EMPTY_FILTERS, kind: "video", category: "espelho" }, noFav, media);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((i) => i.kind === "video" && i.category === "espelho")).toBe(true);
  });
  it("contagens", () => {
    const c = countItems(all, (i) => i.id === "dancinha", media);
    expect(c).toMatchObject({ all: GALLERY.length + 1, new: 1, edited: 1, fav: 1, media: 2 });
    expect(c.video + c.image).toBe(c.all);
    expect(c.byCategory.midia).toBe(1);
    expect(c.byStyle.ugc).toBeGreaterThan(c.byStyle.pov);
  });
});

describe("como usar", () => {
  it("vídeo manda subir a foto em Frames to Video; imagem manda anexar a referência", () => {
    expect(HOW_TO.video).toContain("“Frames to Video”");
    expect(HOW_TO.video).toContain("primeiro quadro");
    expect(HOW_TO.image).toContain("9:16");
  });
});

/* ----------------------- Prompts prontos dentro da Galeria ----------------------- */

const overrides = { "pronta-g1": { prompt: "meu texto" } };
const prontasUser = { id: "user-meu", title: "Meu prompt de relógio", prompt: "Crie um vídeo de um relógio.", obs: "", category: "Relógios", source: "user" as const };
const ready = () => [
  ...libraryViews("videos", VIDEO_PROMPTS, VIDEO_PROMPTS, {}),
  ...libraryViews("prontas", [prontasUser, ...PRONTAS.map((p) => ({ ...p, ...(overrides[p.id as keyof typeof overrides] ?? {}) }))], PRONTAS, overrides),
  ...libraryViews("movimentos", MOVIMENTOS, MOVIMENTOS, {}),
];

describe("os três prompts prontos agora moram na Galeria", () => {
  it("48 vídeos + 24 prontas (+1 do usuário) + 7 movimentos, todos em 'Prompts prontos'", () => {
    const r = ready();
    expect(r).toHaveLength(48 + 25 + 7);
    expect(r.every((i) => i.category === READY_CATEGORY.id && i.origin === "lib" && i.id.startsWith("lib:"))).toBe(true);
    expect(COLLECTIONS.map((c) => c.id)).toEqual(["videos", "prontas", "movimentos"]);
    expect(READY_CATEGORY.label).toBe("Prompts prontos");
    expect(categoryLabel("prontos")).toBe("Prompts prontos");
  });
  it("os ids não colidem com os da galeria nem entre as coleções", () => {
    const ids = [...ready(), ...items()].map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("cada coleção e cada pasta tem a contagem certa", () => {
    const c = countItems([...items(), ...ready()], noFav, hasMedia);
    expect(c.byCollection).toEqual({ videos: 48, prontas: 25, movimentos: 7 });
    expect(c.byFolder["Ganchos Especiais"]).toBe(8);
    expect(c.byFolder["Relógios"]).toBe(3);
    expect(Object.keys(c.byFolder).sort()).toEqual([...PRONTAS_CATEGORIES].sort());
    expect(c.byCategory.prontos).toBe(80);
    expect(c.all).toBe(GALLERY.length + 80);
  });
  it("vídeo ou imagem: vídeos e movimentos são vídeo; as prontas, conforme o texto", () => {
    const r = ready();
    expect(r.filter((i) => i.collection === "videos").every((i) => i.kind === "video")).toBe(true);
    expect(r.filter((i) => i.collection === "movimentos").every((i) => i.kind === "video")).toBe(true);
    const pr = r.filter((i) => i.collection === "prontas");
    // 7 originais falam em vídeo; o g1 foi trocado por "meu texto" (imagem) e o prompt do usuário fala em vídeo: 6 + 1
    expect(pr.filter((i) => i.kind === "video")).toHaveLength(7);
    expect(inferKind("Crie um vídeo vertical")).toBe("video");
    expect(inferKind("Create a hyper-realistic Video")).toBe("video");
    expect(inferKind("Foto de um relógio")).toBe("image");
  });
  it("os vídeos no formato novo abrem a área de montagem (têm spec) e mostram 'O que acontece' como descrição", () => {
    const v = ready().filter((i) => i.collection === "videos");
    expect(v.every((i) => i.hasSpec && !!i.lib?.spec)).toBe(true);
    expect(v[2].description).toContain("O animal está ao lado do produto");
    expect(ready().filter((i) => i.collection !== "videos").some((i) => i.hasSpec)).toBe(false);
  });
  it("os nomes de arquivo de mídia são os mesmos de antes (public/media/library)", () => {
    const v = ready().find((i) => i.id === "lib:videos:video-0")!;
    expect(v.mediaCategory).toBe("library");
    expect(v.mediaNames).toEqual(["eletrodomesticos", "video-0"]);
  });
  it("edições antigas continuam valendo e só contam como 'editado' se o texto mudou", () => {
    const g1 = ready().find((i) => i.id === "lib:prontas:pronta-g1")!;
    expect(g1.prompt).toBe("meu texto");
    expect(g1.edited).toBe(true);
    expect(g1.originalPrompt).toBe(PRONTAS[0].prompt);
    const same = libraryViews("prontas", PRONTAS, PRONTAS, { "pronta-g1": { prompt: PRONTAS[0].prompt } }).find((i) => i.id === "lib:prontas:pronta-g1")!;
    expect(same.edited).toBe(false);
  });
  it("renomear um prompt que já vem no app não mexe no original e dá para restaurar", () => {
    const orig = PRONTAS[0];
    const v = libraryViews("prontas", [{ ...orig, title: "Meu nome" }], PRONTAS, { [orig.id]: { title: "Meu nome" } })[0];
    expect(v).toMatchObject({ title: "Meu nome", originalTitle: orig.title, edited: true });
    const back = libraryViews("prontas", [orig], PRONTAS, { [orig.id]: { title: orig.title } })[0];
    expect(back).toMatchObject({ title: orig.title, edited: false });
  });
  it("o prompt do usuário vem marcado, sem 'editado', e com a pasta dele", () => {
    const u = ready().find((i) => i.id === "lib:prontas:user-meu") as ReturnType<typeof ready>[number];
    expect(u).toMatchObject({ userMade: true, edited: false, folder: "Relógios", kind: "video", description: "Prompt cadastrado por você." });
  });
  it("legenda do card: a pasta nas prontas, o nome da coleção nas outras e a categoria na galeria", () => {
    const r = ready();
    expect(subtitleOf(r.find((i) => i.id === "lib:prontas:pronta-g1")!)).toBe("Ganchos Especiais");
    expect(subtitleOf(r.find((i) => i.collection === "videos")!)).toBe("Prompts dos Vídeos do TikTok");
    expect(subtitleOf(r.find((i) => i.collection === "movimentos")!)).toBe("Movimentos Especiais");
    expect(subtitleOf(items().find((i) => i.id === "giro-360")!)).toBe("Giros e câmera");
  });
  it("filtros por coleção e por pasta, e juntos com formato e busca", () => {
    const all = [...items(), ...ready()];
    const f = (p: object) => filterItems(all, { ...EMPTY_FILTERS, ...p }, noFav, hasMedia);
    expect(f({ category: "prontos" })).toHaveLength(80);
    expect(f({ collection: "videos" })).toHaveLength(48);
    expect(f({ collection: "movimentos" })).toHaveLength(7);
    expect(f({ collection: "prontas", folder: "Ganchos Especiais" })).toHaveLength(8);
    expect(f({ folder: "Relógios" }).every((i) => i.collection === "prontas")).toBe(true);
    expect(f({ collection: "prontas", kind: "video" })).toHaveLength(7);
    expect(f({ collection: "videos", q: "animal" }).length).toBeGreaterThan(0);
    expect(f({ collection: "videos", q: "animal" }).every((i) => i.collection === "videos")).toBe(true);
  });
  it("a busca também olha as observações e a pasta dos prompts prontos", () => {
    const all = ready();
    const f = (q: string) => filterItems(all, { ...EMPTY_FILTERS, q }, noFav, hasMedia);
    expect(f("omni flash").length).toBeGreaterThan(0);
    expect(f("calçados femininos").length).toBeGreaterThanOrEqual(3);
    expect(f("Frames to Video").length).toBeGreaterThanOrEqual(48);
  });
  it("isCollection", () => {
    expect(isCollection("videos")).toBe(true);
    expect(isCollection("x")).toBe(false);
    expect(isCollection(null)).toBe(false);
  });
});

describe("filtros combinados: o número ao lado de cada filtro bate com o que aparece", () => {
  const noFav = () => false;
  const noMedia = () => false;
  const all = (): ReturnType<typeof libraryViews> => [
    ...libraryViews("videos", VIDEO_PROMPTS, VIDEO_PROMPTS, {}),
    ...libraryViews("prontas", PRONTAS, PRONTAS, { [PRONTAS[0].id]: { title: "Meu nome" } }).map((v, i) => (i === 0 ? { ...v, title: "Meu nome", edited: true } : v)),
  ];
  it("com 'Editados por mim' ligado, a coleção de vídeos mostra 0 (e não 48) e a de prontas mostra 1", () => {
    const f = { ...EMPTY_FILTERS, view: "edited" as const };
    const c = facetCounts(all(), f, noFav, noMedia);
    expect(c.byCollection.videos ?? 0).toBe(0);
    expect(c.byCollection.prontas).toBe(1);
    expect(c.edited).toBe(1);
    expect(c.all).toBe(all().length);
  });
  it("cada número bate com o resultado de clicar naquele filtro", () => {
    const items = all();
    const f = { ...EMPTY_FILTERS, view: "edited" as const };
    const c = facetCounts(items, f, noFav, noMedia);
    for (const col of ["videos", "prontas"] as const) {
      expect(c.byCollection[col] ?? 0).toBe(filterItems(items, { ...f, category: READY_CATEGORY.id, collection: col }, noFav, noMedia).length);
    }
  });
  it("sem filtros, as contagens são as de sempre", () => {
    const items = all();
    expect(facetCounts(items, EMPTY_FILTERS, noFav, noMedia).byCollection).toEqual(countItems(items, noFav, noMedia).byCollection);
  });
  it("etiquetas dos filtros ligados e como tirar cada uma", () => {
    const f = { ...EMPTY_FILTERS, view: "edited" as const, category: READY_CATEGORY.id, collection: "videos" as const, kind: "video" as const };
    expect(activeFilters(f).map((x) => x.label)).toEqual(["Editados por mim", "Vídeo", "Prompts dos Vídeos do TikTok"]);
    expect(activeFilters(EMPTY_FILTERS)).toEqual([]);
    expect(withoutFilter(f, "view").view).toBe("all");
    const sem = withoutFilter(f, "collection");
    expect(sem.collection).toBeNull();
    expect(sem.category).toBeNull();
  });
});
