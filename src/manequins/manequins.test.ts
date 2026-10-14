import { describe, expect, it } from "vitest";
import { checkNarration, countWords } from "../lib/veo/briefing";
import { GARMENTS, TONES, defaultScene } from "./data/garments";
import { MANNEQUIN_VIDEOS } from "./data/videos";
import {
  DEFAULT_CONFIG, NARRATIONS_SYSTEM, NARRATION_PLACEHOLDER, buildImagePrompt, buildVideoPrompt, contract, effectiveScene, fillTokens, narrationFor,
  narrationsUserPrompt, parseNarrations, summaryFor, type MqConfig,
} from "./lib/prompts";

const cfg = (p: Partial<MqConfig> = {}): MqConfig => ({ ...DEFAULT_CONFIG, ...p });
const V = (n: number) => MANNEQUIN_VIDEOS.find((v) => v.n === n)!;

describe("os 10 vídeos do documento", () => {
  it("5 de frente e 5 de costas, com ids e números únicos", () => {
    expect(MANNEQUIN_VIDEOS).toHaveLength(10);
    expect(MANNEQUIN_VIDEOS.filter((v) => v.side === "front").map((v) => v.n)).toEqual([1, 2, 3, 4, 5]);
    expect(MANNEQUIN_VIDEOS.filter((v) => v.side === "back").map((v) => v.n)).toEqual([6, 7, 8, 9, 10]);
    expect(new Set(MANNEQUIN_VIDEOS.map((v) => v.id)).size).toBe(10);
  });
  it("cada vídeo tem 3 momentos que fecham em 8 s, título e explicação em português, e a fala do modelo", () => {
    for (const v of MANNEQUIN_VIDEOS) {
      expect(v.actions, v.title).toHaveLength(3);
      expect(v.actions[0].t, v.title).toMatch(/^0-\d+s$/);
      expect(v.actions[2].t, v.title).toMatch(/-8s$/);
      expect(v.title.length).toBeGreaterThan(8);
      expect(v.summaryPt.length, v.title).toBeGreaterThan(60);
      expect(v.defaultNarration.length).toBeGreaterThan(40);
    }
  });
  it("as falas do modelo são as do documento", () => {
    expect(V(1).defaultNarration).toBe("Esse vestido une elegância e conforto, com um caimento incrível que valoriza a silhueta em qualquer ocasião.");
    expect(V(10).defaultNarration).toBe("Uma peça sofisticada, com acabamento impecável e aquele visual marcante que transforma qualquer produção.");
  });
  it("o app sinaliza que as falas do documento não têm as 22 a 26 palavras que ele promete", () => {
    expect(countWords(V(1).defaultNarration)).toBe(17);
    expect(checkNarration(V(1).defaultNarration, 8).ok).toBe(false);
    expect(MANNEQUIN_VIDEOS.filter((v) => checkNarration(v.defaultNarration, 8).ok)).toHaveLength(0);
    expect(checkNarration(V(2).defaultNarration, 8).banned).toContain("sofisticado");
    expect(checkNarration(V(10).defaultNarration, 8).banned).toEqual(["sofisticado", "impecável"]);
  });
});

describe("prompt do vídeo: texto do documento (vestido, de frente)", () => {
  const p = buildVideoPrompt(V(1), cfg(), V(1).defaultNarration);
  it("abertura, trava do produto e cenário", () => {
    for (const t of [
      "Create a realistic vertical 9:16 fashion boutique product video, 8 seconds duration.",
      "Use the reference image as the exact starting frame.",
      "Show a full-body female mannequin with a smooth matte peach skin tone, faceless head, wearing exactly the same dress from the reference image.",
      "PRODUCT LOCK:\nKeep the dress 100% identical:\nsame color, fabric, neckline, stitching, shape, length, proportions and details.\nDo not redesign or modify anything.",
      "The mannequin is facing directly toward the camera and remains completely still.",
      "SCENE:\nPremium women's fashion boutique, warm wooden walls, clothing racks in background, soft retail lighting, realistic smartphone fashion video.",
    ]) expect(p, t).toContain(t);
  });
  it("a ação do vídeo 1, com os tempos", () => {
    expect(p).toContain("0-2s:\nCamera slowly approaches the mannequin from the front.");
    expect(p).toContain("2-5s:\nA feminine hand enters from the right side and gently touches the upper fabric area, showing the texture.");
    expect(p).toContain("5-8s:\nThe hand lightly holds the skirt and moves the fabric slightly to demonstrate the flow and volume.");
  });
  it("câmera, estilo e negativos", () => {
    expect(p).toContain("CAMERA:\nNatural handheld smartphone movement.\nNo rotation.\nNo mannequin movement.");
    expect(p).toContain("STYLE:\nLuxury boutique TikTok fashion showcase.\nReal smartphone recording.\nNatural lighting.");
    for (const n of ["No changing dress.", "No extra arms.", "No extra hands.", "No text.", "No watermark.", "No CGI appearance.", "No mannequin rotation."]) expect(p).toContain(n);
  });
  it("todo vídeo termina com o bloco AUDIO do documento (voz em português, sem sincronia labial)", () => {
    for (const v of MANNEQUIN_VIDEOS) {
      const t = buildVideoPrompt(v, cfg(), "uma fala");
      expect(t, v.title).toContain("AUDIO:\nBrazilian Portuguese female voice.\nNatural commercial narration.\nDuration around 8 seconds.\nDo not sync lips.\nVoice only, no dialogue from mannequin.");
      expect(t.indexOf("AUDIO:"), v.title).toBeGreaterThan(t.indexOf("NEGATIVE:"));
    }
  });
  it("o manequim fica parado e a câmera não gira em nenhum vídeo", () => {
    for (const v of MANNEQUIN_VIDEOS) {
      const t = buildVideoPrompt(v, cfg(), "x");
      expect(t, v.title).toContain("remains completely still");
      expect(t, v.title).toContain("No rotation.");
      expect(t, v.title).toContain("No mannequin rotation.");
    }
  });
});

describe("vídeos de costas e movimentos específicos", () => {
  it("o vídeo 6 mostra as costas e manda preservar o detalhe traseiro", () => {
    const p = buildVideoPrompt(V(6), cfg(), "x");
    expect(p).toContain("The mannequin is facing away from the camera, showing the back of the dress.");
    expect(p).toContain("Preserve every detail of the back: same fabric, back detail (bow, zipper or cut), cut, shape and proportions.");
    expect(p).toContain("gently touches the back detail (bow, zipper or cut) of the dress.");
    expect(p).not.toContain("facing directly toward the camera");
  });
  it("o vídeo 2 toca a costura da cintura; o 3 mantém o manequim de frente; o 9 não tem mão", () => {
    expect(buildVideoPrompt(V(2), cfg(), "x")).toContain("gently touches the waist seam, showing the structure of the dress.");
    expect(buildVideoPrompt(V(3), cfg(), "x")).toContain("Keep mannequin facing front.");
    expect(buildVideoPrompt(V(9), cfg(), "x")).not.toMatch(/enters from the right/);
  });
});

describe("trocar a roupa: o vocabulário acompanha a peça", () => {
  it("nenhum token sobra, para toda peça, vídeo e tipo de manequim", () => {
    for (const g of GARMENTS) for (const v of MANNEQUIN_VIDEOS) for (const gender of ["female", "male"] as const) {
      const c = cfg({ garment: g.id, gender, hand: gender === "female" ? "feminine" : "masculine", voice: gender });
      const t = buildVideoPrompt(v, c, "fala");
      expect(t, `${g.id} ${v.title}`).not.toMatch(/[{}]/);
      expect(summaryFor(v, c), `${g.id} ${v.title}`).not.toMatch(/[{}]/);
    }
  });
  it("calça: fala em pants, cós e pernas; nunca em vestido ou saia", () => {
    for (const v of MANNEQUIN_VIDEOS) {
      const t = buildVideoPrompt(v, cfg({ garment: "calca" }), "x");
      expect(t, v.title).toContain("wearing exactly the same pants");
      expect(t, v.title).toContain("same color, fabric, waistband, stitching");
      expect(t, v.title).not.toMatch(/\bdress\b|\bskirt\b|\bbow\b/i);
    }
    expect(buildVideoPrompt(V(1), cfg({ garment: "calca" }), "x")).toContain("gently touches the waistband area");
    expect(buildVideoPrompt(V(1), cfg({ garment: "calca" }), "x")).toContain("The hand lightly holds the pant legs");
  });
  it("blusa, conjunto e jaqueta também não herdam palavras do vestido", () => {
    for (const id of ["blusa", "conjunto", "jaqueta", "macacao", "short", "saia"] as const) for (const v of MANNEQUIN_VIDEOS) {
      const t = buildVideoPrompt(v, cfg({ garment: id }), "x");
      expect(t, `${id} ${v.title}`).not.toMatch(/\bdress\b/i);
      if (id !== "saia") expect(t, `${id} ${v.title}`).not.toMatch(/\bskirt\b/i);
    }
  });
  it("as explicações em português usam as palavras da peça", () => {
    expect(summaryFor(V(1), cfg({ garment: "calca" }))).toContain("segura as pernas da calça");
    expect(summaryFor(V(2), cfg({ garment: "vestido" }))).toContain("tecido da saia");
    expect(summaryFor(V(2), cfg({ garment: "calca" }))).toContain("tecido das pernas da calça");
  });
  it("contração em português", () => {
    expect(contract("a saia")).toBe("da saia");
    expect(contract("o cós")).toBe("do cós");
    expect(contract("as pernas")).toBe("das pernas");
    expect(contract("o decote e o corpete")).toBe("do decote e do corpete");
    expect(summaryFor(V(5), cfg())).toContain("se aproxima do decote e do corpete");
  });
  it("fillTokens troca {hand}, {garment} e o vocabulário", () => {
    const g = GARMENTS.find((x) => x.id === "calca")!;
    expect(fillTokens("A {hand} hand holds {lower} of the {garment}", g, { hand: "masculine" })).toBe("A masculine hand holds pant legs of the pants");
  });
});

describe("manequim, mão, voz e cenário", () => {
  it("manequim masculino: cenário, mão e voz masculinos", () => {
    const c = cfg({ gender: "male", hand: "masculine", voice: "male" });
    const p = buildVideoPrompt(V(1), c, "x");
    expect(p).toContain("full-body male mannequin");
    expect(p).toContain("Premium men's fashion boutique");
    expect(p).toContain("A masculine hand enters");
    expect(p).toContain("Brazilian Portuguese male voice.");
    expect(effectiveScene(c)).toBe(defaultScene("male"));
  });
  it("cenário personalizado e cada tom de pele", () => {
    expect(buildVideoPrompt(V(1), cfg({ scene: "A bright showroom with white walls." }), "x")).toContain("SCENE:\nA bright showroom with white walls.");
    for (const t of TONES) expect(buildVideoPrompt(V(1), cfg({ tone: t.id }), "x")).toContain(`with a ${t.en} skin tone, faceless head`);
  });
});

describe("a fala (espaço separado, entra no fim do prompt)", () => {
  it("com a fala ligada, ela vai no fim, entre aspas, em uma linha só", () => {
    const p = buildVideoPrompt(V(1), cfg(), "Primeira frase boa?\n  Segunda frase boa.");
    expect(p.trim().endsWith('Speak only this line, exactly as written: "Primeira frase boa? Segunda frase boa."')).toBe(true);
  });
  it("sem fala escrita, o modelo aparece destacável; ficha técnica colada não entra", () => {
    expect(buildVideoPrompt(V(1), cfg(), "")).toContain(NARRATION_PLACEHOLDER);
    const ficha = Array.from({ length: 60 }, (_, i) => `Item ${i}: valor`).join("\n");
    const p = buildVideoPrompt(V(1), cfg(), ficha);
    expect(p).not.toContain("Item 3");
    expect(p).toContain(NARRATION_PLACEHOLDER);
  });
  it("com a fala desligada, o prompt só traz o bloco AUDIO, sem a linha da fala", () => {
    const p = buildVideoPrompt(V(1), cfg({ withNarration: false }), "uma fala qualquer");
    expect(p).toContain("Voice only, no dialogue from mannequin.");
    expect(p).not.toContain("Speak only this line");
    expect(p).not.toContain("uma fala qualquer");
  });
  it("no vestido vale a fala do modelo; em outra peça, vazio; o que o usuário salvou (até vazio) vale mais", () => {
    expect(narrationFor(V(1), cfg(), {})).toBe(V(1).defaultNarration);
    expect(narrationFor(V(1), cfg({ garment: "calca" }), {})).toBe("");
    expect(narrationFor(V(1), cfg(), { m1: "minha" })).toBe("minha");
    expect(narrationFor(V(1), cfg(), { m1: "" })).toBe("");
  });
});

describe("prompt de imagem: vestir o manequim com a peça", () => {
  it("frente e costas, com a peça e o manequim escolhidos", () => {
    const f = buildImagePrompt("front", cfg());
    expect(f).toContain("Using the attached front photo of the dress");
    expect(f).toContain("full-body female mannequin with a smooth matte peach skin tone and a faceless head");
    expect(f).toContain("facing directly toward the camera, wearing EXACTLY this dress");
    expect(f).toContain("faithful copy of the attached photo: same color, fabric, neckline");
    expect(f).toContain("Do not redesign, recolor, resize, add or remove anything.");
    const b = buildImagePrompt("back", cfg({ garment: "calca", gender: "male" }));
    expect(b).toContain("Using the attached back photo of the pants");
    expect(b).toContain("male mannequin");
    expect(b).toContain("facing away from the camera, showing the back of EXACTLY this pants");
    expect(b).toContain("same fabric, back pockets and seam");
    expect(b).not.toMatch(/\bdress\b/);
  });
});

describe("IA escreve as 10 falas", () => {
  it("o sistema traz as regras: 22 a 26 palavras, falas diferentes, sem narrar a ação, sem palavras proibidas", () => {
    for (const t of ["22 a 26 palavras", "DIFERENTE das outras", "NUNCA descreve a ação", "1 a 5 são de frente", "6 a 10 são de costas", "no máximo 3 das 10 falas", "Nunca use as palavras: sofisticado, elegância pura, impecável, excelência, refinado", "REGRAS DA NARRAÇÃO", "10 itens rotulados"]) expect(NARRATIONS_SYSTEM, t).toContain(t);
    expect(NARRATIONS_SYSTEM).not.toMatch(/\$\{|undefined|\[object/);
  });
  it("o pedido leva peça, nome, manequim e a descrição", () => {
    const u = narrationsUserPrompt(cfg({ garment: "blusa", name: "Blusa canelada", description: "Algodão canelado. Manga curta." }));
    expect(u).toContain("Peça: blusa ou camisa (Blusa canelada)");
    expect(u).toContain("Manequim: feminino");
    expect(u).toContain("Algodão canelado. Manga curta.");
    expect(narrationsUserPrompt(cfg())).toContain("(vazia)");
  });
  it("lê os itens rotulados de 1 a 10, ignora rótulos inválidos e limpa as falas", () => {
    const out = { sections: [
      { title: "Falas", items: [{ label: "1", text: '"Fala um\n boa."' }, { label: "10", text: "Fala dez." }, { label: "11", text: "fora" }, { label: "x", text: "fora" }, { label: "3", text: "  " }] },
      { title: "Alertas", items: [{ text: "Faltou o tecido." }, { text: "Nenhum alerta" }] },
    ] };
    const r = parseNarrations(out);
    expect(r.byId).toEqual({ m1: "Fala um boa.", m10: "Fala dez." });
    expect(r.alerts).toEqual(["Faltou o tecido."]);
    expect(parseNarrations(undefined)).toEqual({ byId: {}, alerts: [] });
  });
});
