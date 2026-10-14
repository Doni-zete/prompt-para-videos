import { describe, expect, it } from "vitest";
import { CATEGORIES, COMMANDS, categoriesFor, commandsIn } from "./data/commands";
import { PRESETS, presetsFor } from "./data/presets";
import { INITIAL_STATE, compareNames, composePrompt, sanitizeState } from "./lib/compose";

describe("dados", () => {
  it("ids únicos e textos preenchidos", () => {
    expect(new Set(COMMANDS.map((c) => c.id)).size).toBe(COMMANDS.length);
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (const c of COMMANDS) {
      expect(c.title.length).toBeGreaterThan(3);
      expect(c.desc.length).toBeGreaterThan(5);
      expect(c.text.length).toBeGreaterThan(30);
      expect(CATEGORIES.some((k) => k.id === c.category)).toBe(true);
      expect(c.modes.length).toBeGreaterThan(0);
    }
    for (const p of PRESETS) expect(p.prompt.length).toBeGreaterThan(80);
  });
  it("as 7 categorias da referência existem e 'Movimento' só aparece em vídeo", () => {
    expect(CATEGORIES.map((k) => k.label)).toEqual(["Rosto e pele", "Corpo", "Dispositivo", "Edição", "Iluminação", "Movimento", "Outros"]);
    expect(categoriesFor("video")).toHaveLength(7);
    expect(categoriesFor("image").map((k) => k.id)).not.toContain("movimento");
  });
  it("todo modo tem presets e cada categoria visível tem comandos", () => {
    expect(presetsFor("image").length).toBeGreaterThanOrEqual(6);
    expect(presetsFor("video").length).toBeGreaterThanOrEqual(6);
    expect(presetsFor("video").map((p) => p.title)).toEqual(expect.arrayContaining(["[Vídeo] Vlog caseiro", "[Vídeo] Vlog na rua", "[Vídeo] Captura casual no bar"]));
    for (const m of ["image", "video"] as const) for (const k of categoriesFor(m)) expect(commandsIn(m, k.id).length).toBeGreaterThan(0);
  });
  it("comandos só de vídeo não aparecem no modo imagem", () => {
    expect(commandsIn("image", "rosto").map((c) => c.id)).not.toContain("micro-movimentos");
    expect(commandsIn("video", "rosto").map((c) => c.id)).toContain("micro-movimentos");
  });
});

describe("composePrompt", () => {
  it("fica vazio sem nada marcado", () => {
    expect(composePrompt({ mode: "video", base: "  ", presetIds: [], commandIds: [] })).toBe("");
  });
  it("ordem: texto do usuário, presets na ordem escolhida e comandos na ordem das categorias", () => {
    const out = composePrompt({ mode: "video", base: "A woman in a red coat", presetIds: ["vlog-rua", "vlog-caseiro"], commandIds: ["camera-mao", "textura-pele"] });
    const i = (s: string) => out.indexOf(s);
    expect(i("A woman in a red coat.")).toBe(0);
    expect(i("street vlog")).toBeLessThan(i("home vlog"));
    expect(i("Real skin texture")).toBeLessThan(i("Handheld camera with subtle shake"));
    expect(out.startsWith("A woman in a red coat.")).toBe(true);
  });
  it("termina cada trecho com ponto e não duplica", () => {
    const out = composePrompt({ mode: "image", base: "Hello.", presetIds: ["carro", "carro"], commandIds: ["granulado", "granulado"] });
    expect(out.match(/Light natural film-like grain/g)).toHaveLength(1);
    expect(out).not.toMatch(/\.\./);
    expect(out.endsWith(".")).toBe(true);
  });
  it("ignora presets e comandos de outro modo", () => {
    const out = composePrompt({ mode: "image", base: "", presetIds: ["vlog-rua", "selfie-espelho"], commandIds: ["camera-mao", "ruido"] });
    expect(out).toContain("mirror selfie");
    expect(out).not.toContain("street vlog");
    expect(out).toContain("sensor noise");
    expect(out).not.toContain("Handheld camera with subtle shake");
  });
});

describe("estado salvo", () => {
  it("lixo vira o estado inicial e ids antigos são descartados", () => {
    expect(sanitizeState(null)).toEqual(INITIAL_STATE);
    expect(sanitizeState("x")).toEqual(INITIAL_STATE);
    const s = sanitizeState({ mode: "image", presetIds: ["carro", "nao-existe", "vlog-rua", 3], commandIds: ["ruido", "camera-mao", "?"], base: 7, custom: 1 });
    expect(s.mode).toBe("image");
    expect(s.presetIds).toEqual(["carro"]);
    expect(s.commandIds).toEqual(["ruido"]);
    expect(s.base).toBe("");
    expect(s.custom).toBeNull();
  });
  it("nomes de arquivo da comparação: o do preset ganha do padrão do modo e do geral", () => {
    expect(compareNames("video", "vlog-rua", "original")).toEqual(["vlog-rua-original", "padrao-video-original", "padrao-original"]);
    expect(compareNames("image", undefined, "realista")).toEqual(["padrao-imagem-realista", "padrao-realista"]);
  });
});
