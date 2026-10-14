import { describe, expect, it } from "vitest";
import { VIDEO_PROMPTS } from "../../data/videoPrompts";
import { VIDEO_CARDS } from "../../data/videoSpecs";
import {
  BANNED_WORDS, EMPTY_FILL, SECTION_TITLES, SUBJECT_FIELD, VEO_SYSTEM, applyRealUse, buildClip, buildObs, buildPromptA, buildPromptB, checkNarration,
  FILL_SYSTEM, cleanNarration, countWords, fillUserPrompt, findNarrations, missingParts, narrationRange, narrationTooLong, needsRealUse, parseFill, veoUserPrompt, voiceProfile, type VideoSpec,
} from "./briefing";

/** Os títulos e a ordem definem o id (video-N) e o nome do arquivo de mídia de cada card: não podem mudar. */
const TITLES = [
  "Eletrodomésticos", "Roupas Infantis", "Produtos Pet", "Qualquer Brinquedo", "Capinha de Celular + Selfie no Espelho", "Prompt Dinâmico para Móveis",
  "UGC Dinâmico 2.0", "No Face + Plus Size", "Gancho - Disputa Pelo produto", "SkinCare e Maquiagem", "Vídeo ASMR do Produto", "No Face / Faceless",
  "Gancho O Falso Protagonista", "Vídeo Viral Gringo", "ESBARRÃO COM O PRODUTO", "Caminhão de Encomendas Caindo", "Estilo Chinês + Teste de resistência",
  "UGC Dinâmico", "Vídeo Cinematográfico e Minimalista", "Vídeos Estilo Chinês", "JOGANDO TINTA E MUDANDO DE COR", "Caixa de Correio + Abrindo o pacote",
  "Unboxing UGC", "Queimando com o Isqueiro", "Composição e combinação de acessórios", "Estalando os Dedos", "Óculos na Loja", "Calçados Femininos",
  "Modelo Plus Size", "Calça/Esticando/Agachando", "Loja de departamentos", "Retirando a Bolsa da Caixa", "Dancinha Feminina para mostrar a calça",
  "Dancinha Masculina para mostrar a calça", "Roupa no Manequim", "POV de Tênis", "Roupas de Cama", "Formato POV + UGC", "Colocando sobre a cama",
  "Manequim na Esteira", "Abrindo caixa de sapato", "Esticando Roupa", "Calça no apoio girando", "Blusas na mão andando pela loja", "Abrindo caixa de relógio",
  "Conjuntos esticando", "Mostrando Variações", "Rasgando o Pacote",
];

describe("cards de vídeo: identidade preservada", () => {
  it("48 cards, mesmos títulos, mesma ordem e ids video-0…video-47", () => {
    expect(VIDEO_PROMPTS).toHaveLength(48);
    expect(VIDEO_PROMPTS.map((c) => c.title)).toEqual(TITLES);
    expect(VIDEO_PROMPTS.map((c) => c.id)).toEqual(TITLES.map((_, i) => `video-${i}`));
  });
  it("cada card mantém capa (emoji e matiz)", () => {
    for (const c of VIDEO_PROMPTS) {
      expect(c.cover?.emoji).toBeTruthy();
      expect(typeof c.cover?.hue).toBe("number");
    }
  });
});

describe("cada prompt segue o briefing", () => {
  const must = [
    "The first frame is a real photo. Animate it exactly as is.",
    "[VISUAL LOCK:", "[SCALE LOCK:", "It never morphs, changes size, slides, or gains or loses any part.",
    "Single continuous shot, no cuts.", "Camera locked at the exact framing and angle of the first frame",
    "Never rotate around the product and never reveal sides that are not visible in the first frame.",
    "Same background and steady natural light, no flicker.", "The product stays rigid, intact and undamaged:",
    "Voice:", "Brazilian Portuguese. Starts at 0.0s with no delay. Speaks only this line and does not narrate the action:",
    "No text, no subtitles, no logos, no icons, no overlays.",
  ];
  it("todos trazem as travas e as cláusulas obrigatórias", () => {
    for (const c of VIDEO_PROMPTS) for (const m of must) expect(c.prompt, `${c.title}: ${m}`).toContain(m);
  });
  it("nenhum resquício do formato antigo (microcenas, cortes, vários ângulos, 'exatamente o produto da referência')", () => {
    for (const c of VIDEO_PROMPTS) {
      expect(c.prompt, c.title).not.toMatch(/micro-?scene|microcena|0[.,]5\s*(–|-|a|to)\s*1[.,]5|extremely fast|constant angle|fast-paced|mudanças constantes/i);
      expect(c.prompt, c.title).not.toMatch(/EXACTLY the product from the reference image/);
    }
  });
  it("a ação tem 2 ou 3 fases curtas com tempo", () => {
    for (const c of VIDEO_CARDS) {
      expect(c.action, c.title).toMatch(/for the first \d+ seconds?/);
      expect(c.action, c.title).toMatch(/in the last \d+ seconds?/);
      expect((c.action.match(/\bthen\b/g) ?? []).length, c.title).toBeGreaterThanOrEqual(1);
      expect(c.variants.length, c.title).toBeGreaterThanOrEqual(2);
    }
  });
  it("trava de sujeito só quando há pessoa, animal ou pés", () => {
    for (const c of VIDEO_CARDS) {
      const p = buildPromptB(c);
      if (c.subject === "none") expect(p).not.toContain("[SUBJECT LOCK:");
      else expect(p, c.title).toContain("[SUBJECT LOCK:");
    }
    expect(buildPromptB(VIDEO_CARDS[2])).toContain("the only animal in the video");
    expect(buildPromptB(VIDEO_CARDS[7])).toContain("the face is never shown");
  });
  it("não usa as palavras proibidas da narração", () => {
    for (const c of VIDEO_PROMPTS) for (const b of BANNED_WORDS) expect(c.prompt.toLowerCase(), c.title).not.toContain(b);
  });
  it("não fala em fotos de várias imagens nem manda trocar de ângulo", () => {
    for (const c of VIDEO_PROMPTS) expect(c.prompt, c.title).not.toMatch(/camera (moves|orbits|pans)|orbit|360/i);
  });
});

describe("segurança e coerência de cards específicos", () => {
  const byTitle = (t: string) => VIDEO_CARDS.find((c) => c.title === t)!;
  it("'Queimando com o Isqueiro' não tem fogo: isqueiro apagado", () => {
    const c = byTitle("Queimando com o Isqueiro");
    const p = buildPromptB(c);
    expect(p).toContain("unlit");
    expect(p).toContain("there is no flame, spark or heat of any kind");
    expect(p + buildClip(c, 0) + buildClip(c, 1)).not.toMatch(/ignit|sets? (it )?on fire|lights the|burning/i);
  });
  it("'Tinta' não muda a cor da peça dentro do clipe (a troca é na edição)", () => {
    const c = byTitle("JOGANDO TINTA E MUDANDO DE COR");
    expect(buildPromptB(c)).toContain("no paint touches it");
    expect(buildObs(c)).toContain("EDIÇÃO");
  });
  it("vozes masculinas só onde a pessoa é homem", () => {
    const male = VIDEO_CARDS.filter((c) => c.voice === "male").map((c) => c.title);
    expect(male).toEqual(["ESBARRÃO COM O PRODUTO", "Dancinha Masculina para mostrar a calça", "Roupa no Manequim", "POV de Tênis", "Manequim na Esteira"]);
    for (const c of VIDEO_CARDS) expect(buildPromptB(c)).toContain(c.voice === "male" ? " male voice" : " female voice");
  });
  it("pessoa que fala na câmera usa sincronia labial; voz fora de cena não", () => {
    expect(buildPromptB(byTitle("Vídeo Viral Gringo"))).toContain("natural lip sync");
    expect(buildPromptB(byTitle("Eletrodomésticos"))).toContain("off-screen");
    expect(buildPromptB(byTitle("Eletrodomésticos"))).not.toContain("lip sync");
  });
});

describe("o que cada card mostra (português simples e sem campos soltos)", () => {
  it("todo card explica em português o que acontece no vídeo", () => {
    for (const c of VIDEO_CARDS) {
      expect(c.resumo.length, c.title).toBeGreaterThan(60);
      expect(c.resumo, c.title).not.toMatch(/\b(the|and|then|product stays)\b/i);
    }
  });
  it("cada clipe extra tem a sua explicação em português", () => {
    for (const c of VIDEO_CARDS) {
      expect(c.variantsPt, c.title).toHaveLength(c.variants.length);
      for (const t of c.variantsPt) expect(t.length, c.title).toBeGreaterThan(15);
    }
  });
  it("o card do isqueiro avisa que não tem fogo", () => {
    expect(VIDEO_CARDS.find((c) => c.title === "Queimando com o Isqueiro")!.resumo).toContain("Sem fogo");
  });
  it("nenhum card de vídeo guarda 'extras': os prompts são montados na área de trabalho", () => {
    for (const c of VIDEO_PROMPTS) expect((c as { extras?: unknown }).extras).toBeUndefined();
  });
  it("a observação traz a explicação e manda subir a foto no Flow em Frames to Video", () => {
    for (const c of VIDEO_PROMPTS) {
      expect(c.obs, c.title).toContain(c.spec!.resumo);
      expect(c.obs, c.title).toContain('"Frames to Video"');
      expect(c.obs, c.title).toContain("PRIMEIRO QUADRO");
      expect(c.obs, c.title).toContain("não em Elementos");
      expect(c.obs, c.title).toContain("CapCut");
    }
  });
  it("a observação pede [SUBJECT LOCK] só quando há sujeito, e traz o aviso do card", () => {
    expect(buildObs(VIDEO_CARDS[2])).toContain("[SUBJECT LOCK]");
    expect(buildObs(VIDEO_CARDS[42])).not.toContain("[SUBJECT LOCK]");
    expect(buildObs(VIDEO_CARDS[23])).toContain("⚠ Segurança: sem chama");
  });
});

describe("campos preenchidos entram no prompt (sem colchetes soltos)", () => {
  const pet = VIDEO_CARDS[2];
  const full = { visual: "arranhador ondulado de papelão marrom com borda de MDF claro.", scale: "o produto é um pouco maior que o gato deitado", subject: "gato malhado e branco com as patas da frente brancas", realUse: "", narration: '"Seu gato vive arranhando o sofá? Esse arranhador dá a ele um lugar só dele!"' };
  it("sem nada preenchido, o modelo traz os trechos entre colchetes", () => {
    const p = buildPromptB(pet);
    expect(missingParts(p).map((m) => m.split(":")[0])).toEqual(["[VISUAL LOCK", "[SCALE LOCK", "[SUBJECT LOCK", "[NARRATION"]);
  });
  it("preenchido, some todo colchete e o texto do usuário aparece", () => {
    const p = buildPromptB(pet, full);
    expect(missingParts(p)).toEqual([]);
    expect(p).toContain("identical in every frame: arranhador ondulado de papelão marrom com borda de MDF claro. Same shape");
    expect(p).toContain("O produto é um pouco maior que o gato deitado.");
    expect(p).toContain("Gato malhado e branco com as patas da frente brancas. It is the only animal in the video.");
  });
  it("a narração entra entre aspas, sem aspas duplicadas", () => {
    const p = buildPromptB(pet, full);
    expect(p).toContain('does not narrate the action: "Seu gato vive arranhando o sofá? Esse arranhador dá a ele um lugar só dele!"');
    expect(p).not.toContain('""');
  });
  it("a duração muda a faixa do modelo da narração", () => {
    expect(buildPromptB(pet, undefined, 8)).toContain("22 to 26 words");
    expect(buildPromptB(pet, undefined, 5)).toContain("12 to 18 words");
  });
  it("campos em branco ou só com espaços não apagam o modelo", () => {
    expect(missingParts(buildPromptB(pet, { visual: "   ", scale: "", subject: "  " })).length).toBe(4);
  });
  it("[REAL USE] é trocado pelo uso real e só existe em alguns cards", () => {
    const eletro = VIDEO_CARDS[0];
    expect(needsRealUse(eletro.action)).toBe(true);
    expect(needsRealUse(VIDEO_CARDS[2].action)).toBe(false);
    expect(buildPromptB(eletro)).toContain("[REAL USE:");
    const p = buildPromptB(eletro, { realUse: "apertar o botão de ligar." });
    expect(p).not.toContain("[REAL USE");
    expect(p).toContain("then one hand performs this real use: apertar o botão de ligar;");
    expect(applyRealUse("x [REAL TEST: y] z", "puxar")).toBe("x puxar z");
    expect(applyRealUse("x [REAL USE: y] z", "  ")).toBe("x [REAL USE: y] z");
  });
  it("cada tipo de sujeito tem rótulo e exemplo em português", () => {
    for (const k of Object.keys(SUBJECT_FIELD) as (keyof typeof SUBJECT_FIELD)[]) {
      expect(SUBJECT_FIELD[k].label.length).toBeGreaterThan(8);
      expect(SUBJECT_FIELD[k].example).toMatch(/^Ex\./);
    }
  });
  it("com tudo preenchido, qualquer card sem [REAL USE] fica sem colchetes", () => {
    for (const c of VIDEO_CARDS) {
      const fill = { ...EMPTY_FILL, visual: "peça azul", scale: "do tamanho da mão", subject: "pessoa de cabelo escuro", realUse: "usar normalmente", narration: "uma fala" };
      expect(missingParts(buildPromptB(c, fill)), c.title).toEqual([]);
    }
  });
});

describe("clipes extras: prompts completos, prontos para colar", () => {
  const eletro = VIDEO_CARDS[0];
  const fill = { visual: "liquidificador preto", scale: "do tamanho de uma jarra", subject: "mãos femininas de pele clara", realUse: "apertar o botão", narration: "fala" };
  it("cada clipe é o Prompt B inteiro com outra ação e SEM a linha Voice", () => {
    const clip = buildClip(eletro, 0, fill);
    expect(clip).toContain("The first frame is a real photo.");
    expect(clip).toContain("Single continuous shot, no cuts.");
    expect(clip).toContain("Action: a hand lifts the lid or opens the door");
    expect(clip).toContain("liquidificador preto");
    expect(clip).toContain("Mãos femininas de pele clara. It is the only pair of hands in the video.");
    expect(clip).toContain("No text, no subtitles, no logos, no icons, no overlays.");
    expect(clip).not.toContain("Voice:");
    expect(clip).not.toContain("Brazilian Portuguese");
    expect(clip).not.toContain("Prompt B");
    expect(clip).not.toMatch(/Use o Prompt|Clipe \d/);
  });
  it("um clipe por variação, com ações diferentes entre si e da ação principal", () => {
    const clips = eletro.variants.map((_, i) => buildClip(eletro, i, fill));
    expect(clips).toHaveLength(2);
    expect(new Set([...clips, buildPromptB(eletro, fill)]).size).toBe(3);
  });
  it("parágrafo Action sem ponto faltando antes da cláusula de integridade", () => {
    for (const c of VIDEO_CARDS) for (let i = 0; i < c.variants.length; i++) expect(buildClip(c, i), c.title).not.toMatch(/[a-z]\s+The product stays rigid/);
  });
});

describe("Prompt A (foto da cena)", () => {
  it("cópia fiel da foto, mesmo ângulo, sem texto, com o cenário do card", () => {
    for (const c of VIDEO_CARDS) {
      const a = buildPromptA(c);
      expect(a).toContain("Using the attached product photo");
      expect(a).toContain("a faithful copy of the attached photo");
      expect(a).toContain("Keep the same viewing angle as the attached photo.");
      expect(a).toContain(c.scene);
    }
  });
  it("usa a descrição de quem aparece quando preenchida", () => {
    const a = buildPromptA(VIDEO_CARDS[2], { subject: "gato malhado" });
    expect(a).toContain("Gato malhado.");
    expect(a).not.toContain("[SUBJECT");
  });
});

describe("narração", () => {
  const exemplo = "Seu gato vive arranhando o sofá? Esse arranhador de papelão com acabamento em MDF dá a ele um lugar só dele pra arranhar e relaxar!";
  it("conta palavras como o briefing (o exemplo do briefing tem 25)", () => {
    expect(countWords(exemplo)).toBe(25);
    expect(countWords('  "oi   tudo bem?"  ')).toBe(3);
    expect(countWords("— !")).toBe(0);
  });
  it("faixas: 8 s = 22 a 26; 4 a 6 s = 12 a 18", () => {
    expect(narrationRange(8)).toEqual({ min: 22, max: 26 });
    expect(narrationRange(6)).toEqual({ min: 12, max: 18 });
    expect(narrationRange(4)).toEqual({ min: 12, max: 18 });
  });
  it("checagem de limites e de palavras proibidas", () => {
    expect(checkNarration(exemplo, 8).ok).toBe(true);
    expect(checkNarration("Muito curto.", 8)).toMatchObject({ ok: false, words: 2 });
    expect(checkNarration(exemplo, 5).ok).toBe(false);
    expect(checkNarration("Um acabamento impecável e refinado para a sua casa.", 5).banned).toEqual(["impecável", "refinado"]);
  });
  it("perfil de voz completo e igual em qualquer clipe", () => {
    const a = voiceProfile("female", "offscreen");
    expect(a).toBe(voiceProfile("female", "offscreen"));
    expect(a).toContain("fast conversational pace");
    expect(a).toContain("never monotone");
  });
});

describe("gerador com a foto do usuário (Gemini)", () => {
  it("o prompt de sistema traz as regras do briefing", () => {
    for (const s of [
      "FOTO REAL", '"Frames to Video"', "VISUAL LOCK", "SCALE LOCK", "SUBJECT LOCK", "nunca estime pelo olho", "22 a 26 palavras", "12 a 18 palavras",
      "NUNCA narre a ação", "Aponte contradições", "NÃO use o ponto contraditório", "Se não houver foto, não gere nada", "UM plano contínuo", "Prompt B COMPLETO",
      "CapCut", "PERFIL DE VOZ completo, palavra por palavra", "Nunca escreva \"mesma voz do clipe anterior\"",
    ]) expect(VEO_SYSTEM, s).toContain(s);
    for (const b of BANNED_WORDS) expect(VEO_SYSTEM).toContain(b);
    for (const t of Object.values(SECTION_TITLES)) expect(VEO_SYSTEM).toContain(`"${t}"`);
  });
  it("embute os modelos A e B do briefing (genéricos) e nenhum resto de template quebrado", () => {
    expect(VEO_SYSTEM).toContain("[SUBJECT LOCK: the animal or person in the photo, by visible traits; the only one in the video]. Action: [phase 1, phase 2, phase 3, with simple timing].");
    expect(VEO_SYSTEM).toContain("[VOICE PROFILE: gender, age range, tone, pace, energy, timbre");
    expect(VEO_SYSTEM).toContain('does not narrate the action: "[NARRATION]"');
    expect(VEO_SYSTEM).toContain("EXACTLY this product placed in [SCENE]");
    expect(VEO_SYSTEM).toContain("[SUBJECT if any]. No text, no logos.");
    expect(VEO_SYSTEM).not.toMatch(/\$\{|undefined|\[object/);
  });
  it("o pedido leva tipo da foto, descrição, medidas, duração e extras", () => {
    const base: Parameters<typeof veoUserPrompt>[0] = { catalogPhoto: true, product: "Arranhador", description: "papelão e MDF", measures: "", seconds: 8, extraClips: 2, extraVoice: true, voice: "female", speaking: "offscreen", action: "o gato arranha", scene: "uma sala" };
    const p = veoUserPrompt(base);
    expect(p).toContain("CATÁLOGO");
    expect(p).toContain("papelão e MDF");
    expect(p).toContain("NÃO informadas: não estime pelo olho");
    expect(p).toContain("22 a 26 palavras");
    expect(p).toContain("Clipes extras (Prompt C): 2");
    expect(p).toContain("o gato arranha");
    const q = veoUserPrompt({ ...base, catalogPhoto: false, measures: "40 x 12 cm", seconds: 5, extraClips: 0, description: "" });
    expect(q).toContain("FOTO DE CENA");
    expect(q).toContain("40 x 12 cm");
    expect(q).toContain("12 a 18 palavras");
    expect(q).toContain("não invente características");
    expect(q).toContain("nenhum");
  });
});

describe("builders isolados", () => {
  const spec: VideoSpec = { scene: "a tile floor", subject: "pet", action: "for the first 2 seconds the cat rests; then it stretches; in the last 3 seconds it settles.", variants: ["alt one", "alt two"], voice: "female", speaking: "offscreen" };
  it("Prompt B: integridade padrão quando o card não adapta", () => {
    expect(buildPromptB(spec)).toContain("nothing tears, bends, spills, breaks or shifts position");
    expect(buildPromptB({ ...spec, integrity: "custom clause" })).toContain("undamaged: custom clause.");
  });
  it("clipes: um por variação", () => {
    expect(buildClip(spec, 0)).toContain("Action: alt one");
    expect(buildClip(spec, 1)).toContain("Action: alt two");
  });
});

const FICHA = `Características:

 - Espessura da Estrutura: 12mm

 - Possui Gavetas?: Sim
${Array.from({ length: 46 }, (_, i) => ` - Item técnico ${i}: valor ${i}`).join("\n")}`;

describe("ficha técnica colada na narração não entra no prompt", () => {
  const comoda = VIDEO_CARDS[0];
  it("limpa a fala: uma linha, sem aspas internas", () => {
    expect(cleanNarration('  "Olá,\n  mundo"  "oi" ')).toBe("Olá, mundo' 'oi");
    expect(cleanNarration("\n\n a   b \n")).toBe("a b");
  });
  it("define quando é longa demais (limite da duração + 10 palavras)", () => {
    const w = (n: number) => Array.from({ length: n }, () => "ok").join(" ");
    expect(narrationTooLong(w(36), 8)).toBe(false);
    expect(narrationTooLong(w(37), 8)).toBe(true);
    expect(narrationTooLong(w(28), 5)).toBe(false);
    expect(narrationTooLong(w(29), 5)).toBe(true);
  });
  it("ficha técnica: a narração volta ao modelo (destacada) e nada da ficha vaza para o prompt", () => {
    const p = buildPromptB(comoda, { narration: FICHA });
    expect(p).not.toContain("Espessura da Estrutura");
    expect(p).not.toContain("Item técnico");
    expect(missingParts(p).some((m) => m.startsWith("[NARRATION"))).toBe(true);
  });
  it("fala normal de várias linhas entra em uma linha só", () => {
    const p = buildPromptB(comoda, { narration: "Primeira frase boa?\nSegunda frase boa." });
    expect(p).toContain('does not narrate the action: "Primeira frase boa? Segunda frase boa."');
  });
  it("as 7 ações com [REAL USE] leem bem com um trecho inserido", () => {
    for (const c of VIDEO_CARDS.filter((x) => needsRealUse(x.action))) {
      const p = buildPromptB(c, { realUse: "opening the doors" });
      expect(p, c.title).toContain(": opening the doors");
      expect(p, c.title).not.toMatch(/does opening|\[REAL/);
    }
    expect(VIDEO_CARDS.filter((x) => needsRealUse(x.action))).toHaveLength(7);
  });
});

describe("IA preenche os campos (resposta e pedido)", () => {
  const out = {
    sections: [
      { title: "Campos", items: [
        { label: "Visual", text: "a black matte chest of drawers with two doors and four drawers" },
        { label: "scale", text: "the product is about 114 cm tall, 90.6 cm wide and 35.2 cm deep" },
        { label: "narration", text: '"Sua cômoda de quatro gavetas\n com acabamento fosco!"' },
        { label: "action", text: "for the first 2 seconds the hand rests beside the chest; then it opens one door; in the last 3 seconds it closes it." },
        { label: "actionPt", text: "A mão abre uma porta e fecha." },
        { label: "clip2", text: "the hand pulls a drawer out a few centimeters and pushes it back." },
        { label: "clip2Pt", text: "A mão puxa uma gaveta e empurra de volta." },
        { label: "subject", text: "[SUBJECT LOCK: preencha]" },
        { label: "campo-desconhecido", text: "x" },
      ] },
      { title: "Alertas", items: [{ text: "Medidas conferidas na descrição." }, { text: "Nenhum alerta" }] },
    ],
  };
  it("lê os rótulos sem diferenciar maiúsculas, limpa a fala e descarta colchetes e rótulos desconhecidos", () => {
    const f = parseFill(out);
    expect(f.visual).toBe("a black matte chest of drawers with two doors and four drawers");
    expect(f.scale).toContain("114 cm tall");
    expect(f.narration).toBe("Sua cômoda de quatro gavetas com acabamento fosco!");
    expect(f.action).toContain("opens one door");
    expect(f.actionPt).toBe("A mão abre uma porta e fecha.");
    expect(f.clip2).toContain("pulls a drawer");
    expect(f.clip3).toBeUndefined();
    expect(f.subject).toBeUndefined();
    expect(Object.keys(f)).not.toContain("campo-desconhecido");
  });
  it("alertas: ignora 'Nenhum alerta' e entrada vazia", () => {
    expect(parseFill(out).alerts).toEqual(["Medidas conferidas na descrição."]);
    expect(parseFill(undefined)).toEqual({ alerts: [] });
    expect(parseFill({ sections: [] })).toEqual({ alerts: [] });
  });
  it("o sistema da IA proíbe despejar a ficha técnica e manda omitir o que não dá para preencher", () => {
    for (const t of ["OMITA", "NUNCA liste a ficha técnica", "visual (inglês): só se houver FOTO", "114 cm tall", "Nunca estime pelo olho", "narration (português do Brasil)", "narration2 e narration3", "ÚLTIMA fala da sequência", "ABERTURA da sequência", "22 a 26 palavras", "UM plano contínuo", "Proibido: sofisticado, elegância pura, impecável, excelência, refinado"]) expect(FILL_SYSTEM, t).toContain(t);
    expect(FILL_SYSTEM).not.toMatch(/\$\{|undefined|\[object/);
  });
  it("o pedido leva card, descrição, medidas, faixa e se há foto", () => {
    const base = { title: "Eletrodomésticos", subject: "hands" as const, action: "A", scene: "S", product: "Cômoda Paris", description: "MDP e MDF. Altura: 114 cm", measures: "", seconds: 8, hasPhoto: true, extraClips: 2 };
    const a = fillUserPrompt(base);
    expect(a).toContain("Quem aparece no vídeo: mãos");
    expect(a).toContain("Altura: 114 cm");
    expect(a).toContain("22 a 26 palavras");
    expect(a).toContain("FOTO anexada");
    expect(a).toContain("procure na descrição");
    expect(a).toContain("Sequência: 1 clipe principal + 2 clipes extras COM fala");
    expect(a).toContain("narration2 e narration3");
    expect(a).toContain("A chamada para ação vai só na última fala");
    const b = fillUserPrompt({ ...base, hasPhoto: false, measures: "114 x 90 cm", seconds: 5 });
    expect(b).toContain("FOTO NÃO anexada: omita visual e subject");
    expect(b).toContain("114 x 90 cm");
    expect(b).toContain("12 a 18 palavras");
    expect(fillUserPrompt({ ...base, extraClips: 1 })).toContain("1 clipe extra COM fala");
    expect(fillUserPrompt({ ...base, extraClips: 1 })).toContain("narration2.");
    const none = fillUserPrompt({ ...base, extraClips: 0 });
    expect(none).toContain("Sem clipes extras com fala: a fala principal fecha com a chamada para ação.");
    expect(none).not.toContain("Sequência:");
  });
});

describe("clipes extras com fala própria", () => {
  const eletro = VIDEO_CARDS[0];
  const fill = { visual: "liquidificador preto", scale: "do tamanho de uma jarra", subject: "mãos femininas", realUse: "apertar o botão", narration: "fala do clipe um" };
  const voiceLine = (t: string) => t.match(/Voice: .*?never monotone\./)?.[0];
  it("sem a opção de voz, o clipe continua sem a linha Voice", () => {
    expect(buildClip(eletro, 0, fill)).not.toContain("Voice:");
  });
  it("com voz, o clipe leva a sua fala e o MESMO perfil de voz do clipe principal, escrito por inteiro", () => {
    const main = buildPromptB(eletro, fill);
    const clip = buildClip(eletro, 0, fill, { narration: "Segunda fala do vídeo, com outro benefício.", seconds: 8 });
    expect(voiceLine(clip)).toBeTruthy();
    expect(voiceLine(clip)).toBe(voiceLine(main));
    expect(clip).toContain('does not narrate the action: "Segunda fala do vídeo, com outro benefício."');
    expect(clip).not.toMatch(/same voice|mesma voz/i);
    expect(clip.indexOf("Voice:")).toBeGreaterThan(clip.indexOf("Action:"));
    expect(clip.trim().endsWith("No text, no subtitles, no logos, no icons, no overlays.")).toBe(true);
  });
  it("sem fala preenchida, o modelo da fala aparece destacável e diz de qual clipe é", () => {
    const c2 = buildClip(eletro, 0, fill, { seconds: 8 });
    const c3 = buildClip(eletro, 1, fill, { seconds: 8 });
    expect(c2).toContain("a new line for clip 2 that continues the story without repeating the previous clips");
    expect(c3).toContain("a new line for clip 3");
    expect(missingParts(c2).some((m) => m.startsWith("[NARRATION"))).toBe(true);
    expect(buildClip(eletro, 0, fill, { seconds: 5 })).toContain("12 to 18 words");
  });
  it("ficha técnica na fala do clipe também não entra", () => {
    const clip = buildClip(eletro, 0, fill, { narration: FICHA, seconds: 8 });
    expect(clip).not.toContain("Espessura da Estrutura");
    expect(missingParts(clip).some((m) => m.startsWith("[NARRATION"))).toBe(true);
  });
  it("voz masculina e fala na câmera valem para os clipes extras", () => {
    const tenis = VIDEO_CARDS.find((c) => c.title === "POV de Tênis")!;
    expect(buildClip(tenis, 0, fill, { narration: "oi", seconds: 8 })).toContain(" male voice");
    const gringo = VIDEO_CARDS.find((c) => c.title === "Vídeo Viral Gringo")!;
    expect(buildClip(gringo, 0, fill, { narration: "oi", seconds: 8 })).toContain("natural lip sync");
  });
  it("a IA devolve a fala de cada clipe e o app limpa e associa", () => {
    const f = parseFill({ sections: [{ title: "Campos", items: [
      { label: "narration", text: "Abertura boa." },
      { label: "Narration2", text: '"Segunda\n fala."' },
      { label: "narration3", text: "Terceira fala, clique no carrinho!" },
    ] }] });
    expect(f.narration).toBe("Abertura boa.");
    expect(f.narration2).toBe("Segunda fala.");
    expect(f.narration3).toBe("Terceira fala, clique no carrinho!");
  });
});

describe("gerador completo (diálogo): fala nos clipes extras", () => {
  const base: Parameters<typeof veoUserPrompt>[0] = { catalogPhoto: false, product: "X", description: "d", measures: "10 cm", seconds: 8, extraClips: 2, extraVoice: true, voice: "female", speaking: "offscreen", action: "", scene: "" };
  it("o pedido diz se os clipes extras levam fala ou não", () => {
    const com = veoUserPrompt(base);
    expect(com).toContain("Os clipes extras LEVAM fala própria");
    expect(com).toContain("a chamada para ação vai só no último");
    expect(com).toContain("seção Narração (Clipe 1, Clipe 2…)");
    const sem = veoUserPrompt({ ...base, extraVoice: false });
    expect(sem).toContain("Os clipes extras NÃO levam fala");
    expect(sem).not.toContain("LEVAM");
    const nenhum = veoUserPrompt({ ...base, extraClips: 0 });
    expect(nenhum).not.toContain("LEVAM");
    expect(nenhum).not.toContain("NÃO levam");
  });
  it("o sistema explica as duas formas e a lista de falas por clipe", () => {
    for (const t of ["Se o pedido disser que os clipes extras levam fala", "MESMO perfil de voz do Prompt B", "nunca \"mesma voz do clipe anterior\"", "só na última fala da sequência", "Se o pedido disser que os extras não levam fala, apague a linha \"Voice\"", '"Clipe 1", "Clipe 2"']) expect(VEO_SYSTEM, t).toContain(t);
  });
  it("lê todas as falas da seção Narração, na ordem", () => {
    const out = { sections: [{ title: "Narração", items: [{ text: " Um. " }, { text: "Dois." }, { text: "  " }, { text: "Três." }] }] };
    expect(findNarrations(out)).toEqual(["Um.", "Dois.", "Três."]);
    expect(findNarrations({ sections: [] })).toEqual([]);
    expect(findNarrations(undefined)).toEqual([]);
    expect(findNarrations(out)[0]).toBe("Um.");
  });
});

describe("palavras proibidas: também no feminino e no plural", () => {
  it("reconhece as variações", () => {
    expect(checkNarration("Uma peça sofisticada e refinada.", 5).banned).toEqual(["sofisticado", "refinado"]);
    expect(checkNarration("Looks sofisticados, acabamentos impecáveis.", 5).banned).toEqual(["sofisticado", "impecável"]);
    expect(checkNarration("Um corte de elegância pura e de excelência.", 5).banned).toEqual(["elegância pura", "excelência"]);
  });
  it("não pega palavras parecidas e permitidas", () => {
    expect(checkNarration("Um look elegante, fino e bem acabado.", 5).banned).toEqual([]);
  });
});
