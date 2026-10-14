import { describe, expect, it } from "vitest";
import { SEED_AVATARS } from "./data/avatars";
import { CLEAN, GALLERY, SILENT } from "./data/gallery";
import { HACKS } from "./data/hacks";
import { DURATIONS, POV_HANDS, SCENES } from "./data/options";
import { SEED_PRODUCTS } from "./data/products";
import { STYLES, getStyle } from "./data/styles";
import { parseProductLines } from "./hooks/useProducts";
import { findItem, takeItems } from "./lib/direction";
import { FLOWS, stepLabel } from "./lib/flow";
import { autoScriptSystem, directionSystem, frameSystem, kitSystem, scriptCopyPrompt, scriptsSystem, videoSystem, wizardUserPrompt } from "./lib/prompts";
import { countWords, normalizeTakes, wordState } from "./lib/words";

describe("galeria", () => {
  it("tem ids únicos, títulos e prompts preenchidos", () => {
    const ids = GALLERY.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GALLERY) {
      expect(g.title.length).toBeGreaterThan(3);
      expect(g.description.length).toBeGreaterThan(10);
      expect(g.prompt.length).toBeGreaterThan(120);
      expect(g.styles.length).toBeGreaterThan(0);
    }
  });
  it("o sufixo do título bate com o tipo", () => {
    for (const g of GALLERY) expect(g.title.endsWith(g.kind === "image" ? "(Imagem)" : "(Vídeo)")).toBe(true);
  });
  it("vídeos são mudos e todos trazem as restrições de limpeza", () => {
    for (const g of GALLERY) {
      expect(g.prompt).toContain(CLEAN);
      if (g.kind === "video") expect(g.prompt).toContain(SILENT);
    }
  });
  it("tem os movimentos usados no Provador (carrinho laranja e giro lento)", () => {
    const titles = GALLERY.map((g) => g.title);
    expect(titles).toContain("CTA Carrinho Laranja (Vídeo)");
    expect(titles).toContain("Giro lento no look (Vídeo)");
    expect(GALLERY.filter((g) => g.kind === "video").length).toBeGreaterThan(20);
  });
});

describe("estilos e fluxos", () => {
  it("POV não usa avatar; UGC e Provador usam", () => {
    expect(getStyle("pov")?.usesAvatar).toBe(false);
    expect(getStyle("ugc")?.usesAvatar).toBe(true);
    expect(getStyle("provador")?.usesAvatar).toBe(true);
    expect(getStyle("x")).toBeUndefined();
  });
  it("os fluxos seguem o vídeo: UGC 4 passos, POV 3, Provador 4", () => {
    expect(FLOWS.ugc.steps.map((s) => s.id)).toEqual(["avatar", "produto", "cena", "roteiro"]);
    expect(FLOWS.pov.steps.map((s) => s.id)).toEqual(["produto", "visual", "roteiro"]);
    expect(FLOWS.provador.steps.map((s) => s.id)).toEqual(["avatar", "produto", "cena", "movimento"]);
    expect(FLOWS.ugc.total).toBe(4);
    expect(FLOWS.pov.total).toBe(3);
  });
  it("o rótulo do passo e as barras preenchidas batem", () => {
    expect(stepLabel("ugc", 0)).toBe("PASSO 1 DE 4");
    expect(stepLabel("pov", 2)).toBe("PASSO 3 DE 3");
    expect(FLOWS.ugc.steps[3].filled).toBe(4);
    // no Provador, a escolha do movimento ainda está no passo 3 (4ª barra apagada)
    expect(FLOWS.provador.steps[3].filled).toBe(3);
    for (const s of STYLES) expect(FLOWS[s.id].steps.every((x, i) => x.filled >= 1 && (i === 0 || x.filled >= FLOWS[s.id].steps[i - 1].filled))).toBe(true);
  });
  it("opções de configuração", () => {
    expect(SCENES).toHaveLength(10);
    expect(POV_HANDS.map((h) => h.id)).toEqual(["luvas", "masculina", "feminina", "sem-maos"]);
    expect(DURATIONS.map((d) => d.label)).toEqual(["8s", "16s", "24s", "32s", "40s"]);
    expect(DURATIONS.map((d) => d.takes)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("dados de partida", () => {
  it("avatares-base: 8 mulheres e 4 homens, ids únicos e sem 'mine'", () => {
    expect(SEED_AVATARS.filter((a) => a.gender === "f")).toHaveLength(8);
    expect(SEED_AVATARS.filter((a) => a.gender === "m")).toHaveLength(4);
    expect(new Set(SEED_AVATARS.map((a) => a.id)).size).toBe(12);
    expect(SEED_AVATARS.every((a) => !a.mine && a.description.length > 20)).toBe(true);
  });
  it("produtos de exemplo estão marcados como exemplo", () => {
    expect(SEED_PRODUCTS.length).toBeGreaterThanOrEqual(12);
    expect(SEED_PRODUCTS.every((p) => p.example)).toBe(true);
  });
  it("importa linhas de produtos com e sem selo", () => {
    expect(parseProductLines("Calça;alta\n\n Capinha ; em-alta \nGarrafa")).toEqual([
      { name: "Calça", demand: "alta" },
      { name: "Capinha", demand: "em-alta" },
      { name: "Garrafa", demand: "" },
    ]);
  });
});

describe("roteiro por takes", () => {
  it("conta palavras e classifica o limite de 20 a 25", () => {
    expect(countWords("  ")).toBe(0);
    expect(countWords("uma duas  três")).toBe(3);
    expect(wordState(0)).toBe("empty");
    expect(wordState(10)).toBe("short");
    expect(wordState(20)).toBe("ok");
    expect(wordState(25)).toBe("ok");
    expect(wordState(26)).toBe("long");
  });
  it("normaliza o número de takes", () => {
    expect(normalizeTakes(["a"], 3)).toEqual(["a", "", ""]);
    expect(normalizeTakes(["a", "b", "c"], 2)).toEqual(["a", "b"]);
  });
  it("o prompt para copiar cita produto e duração", () => {
    const p = scriptCopyPrompt("calça", 2);
    expect(p).toContain("up to 16s");
    expect(p).toContain('"calça"');
    expect(p).toContain("orange shopping cart");
    expect(p).toContain("20 to 25 words");
  });
});

describe("prompts do assistente", () => {
  it("UGC e POV diferem e ambos exigem a fala exata e continuidade", () => {
    expect(directionSystem("pov")).toContain("SEM mostrar rosto");
    expect(directionSystem("ugc")).toContain("lip sync");
    for (const s of ["ugc", "pov"] as const) {
      expect(directionSystem(s)).toContain("EXATAMENTE como o usuário escreveu");
      expect(directionSystem(s)).toContain("continuidade");
      expect(directionSystem(s)).toContain("Roteiro de Direção (Veo 3)");
    }
  });
  it("o Provador gera um kit mudo de dois passos", () => {
    expect(kitSystem()).toContain("Prompt do Frame");
    expect(kitSystem()).toContain("Prompt do Vídeo");
    expect(kitSystem()).toContain("Silent video");
    expect(frameSystem("pov")).toContain("sem rosto");
    expect(autoScriptSystem(2)).toContain("Exatamente 2 takes");
    expect(autoScriptSystem(1)).toContain("carrinho laranja");
  });
  it("o pedido leva avatar, produto, cena, movimento, voz e as falas exatas", () => {
    const text = wizardUserPrompt({
      style: "ugc",
      avatar: { name: "Laura", gender: "f", description: "cabelo cacheado", hasPhoto: true },
      product: { name: "Calça", details: "cintura alta", hasImage: true },
      scene: { label: "Quarto", interaction: "Câmera Frontal", pose: "Em pé, corpo inteiro" },
      voice: { gender: "feminino", tone: "Doce" },
      takes: ["Primeira fala.", "Segunda fala."],
    });
    expect(text).toContain("Laura (feminino)");
    expect(text).toContain("primeira imagem enviada");
    expect(text).toContain("Cenário: Quarto");
    expect(text).toContain("tonalidade Doce");
    expect(text).toContain('TAKE 2/2 (8s) — fala exata: "Segunda fala."');
  });
  it("POV não menciona avatar e Provador leva o movimento escolhido", () => {
    const pov = wizardUserPrompt({ style: "pov", product: { name: "Câmera", details: "", hasImage: false }, pov: { scene: "Setup Gamer / Tech", hands: "Sem mãos", presentation: "Funcionalidade" } });
    expect(pov).not.toContain("Avatar:");
    expect(pov).toContain("Mãos: Sem mãos");
    const kit = wizardUserPrompt({ style: "provador", product: { name: "Calça", details: "", hasImage: true }, movement: { title: "Giro", prompt: "TURN SLOWLY" } });
    expect(kit).toContain("TURN SLOWLY");
    expect(kit).toContain("Giro");
  });
});

describe("leitura da resposta", () => {
  const out = {
    sections: [
      { title: "Resumo da direção", items: [{ text: "resumo" }] },
      { title: "Roteiro de Direção (Veo 3)", items: [{ label: "Take 1/2", text: "t1" }, { label: "Take 2/2", text: "t2" }] },
    ],
  };
  it("acha os takes mesmo quando o resumo vem primeiro", () => {
    expect(takeItems(out).map((i) => i.text)).toEqual(["t1", "t2"]);
    expect(findItem(out, /resumo/i)?.text).toBe("resumo");
    expect(takeItems(undefined)).toEqual([]);
  });
});

describe("hacks", () => {
  it("todo estilo tem regras e elas entram nos prompts de sistema", () => {
    expect(HACKS).toHaveLength(3);
    for (const h of HACKS) {
      expect(h.rules.length).toBeGreaterThanOrEqual(3);
      for (const sys of [scriptsSystem(h), videoSystem(h)]) for (const rule of h.rules) expect(sys).toContain(rule);
    }
  });
  it("frutas proíbe alegação de saúde e cartomante proíbe previsão sensível", () => {
    const frutas = HACKS.find((h) => h.id === "frutas")!;
    const carta = HACKS.find((h) => h.id === "cartomante")!;
    expect(frutas.rules.join(" ")).toMatch(/Sem alegações de saúde/);
    expect(carta.rules.join(" ")).toMatch(/saúde, morte/);
    expect(videoSystem(frutas)).toContain("rotular como conteúdo de IA");
  });
});
