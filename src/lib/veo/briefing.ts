/**
 * Formato novo dos prompts de vídeo (Veo / Flow) com produto IDÊNTICO à foto.
 * Fonte única das regras do briefing: os cards da biblioteca e o gerador com Gemini usam estas funções.
 * Os prompts ficam em inglês (para o Veo); só a narração é em português.
 */

export type SubjectKind = "none" | "hands" | "woman" | "man" | "pet" | "faceless" | "feet" | "two";

export interface VideoSpec {
  /** Cenário da foto (Prompt A). */
  scene: string;
  subject: SubjectKind;
  /** Ação principal do Prompt B: 2 ou 3 fases curtas, com tempos simples. */
  action: string;
  /** Ações alternativas para os clipes extras (Prompt C). */
  variants: string[];
  /** Adaptação da cláusula de integridade ao que se mexe de verdade neste card. */
  integrity?: string;
  voice: "female" | "male";
  /** A pessoa da foto fala (sincronia labial) ou é uma voz fora de cena. */
  speaking: "offscreen" | "onscreen";
  /** Aviso em português que entra no fim das Observações. */
  note?: string;
  /** O que acontece no vídeo, em português simples (mostrado no card). */
  resumo?: string;
  /** O que cada clipe extra faz, em português (mesma ordem de `variants`). */
  variantsPt?: string[];
}

export const DEFAULT_INTEGRITY = "nothing tears, bends, spills, breaks or shifts position";

const SUBJECT_TEXT: Record<Exclude<SubjectKind, "none">, string> = {
  hands: "the hands in the photo, by their visible traits (skin tone, nails, rings); the only hands in the video",
  woman: "the woman in the photo, by her visible traits (hair, skin tone, clothes); the only person in the video",
  man: "the man in the photo, by his visible traits (hair, skin tone, clothes); the only person in the video",
  pet: "the animal in the photo, by its visible traits (species, coat colors and markings); the only animal in the video",
  faceless: "the person in the photo, by the visible traits of their body and clothes; the only person in the video; the head stays out of frame exactly as in the photo and the face is never shown",
  feet: "the feet in the photo, by their visible traits (skin tone, nails); the only feet in the video",
  two: "the two women in the photo, by their visible traits; the only people in the video",
};

export const subjectText = (kind: SubjectKind): string | null => (kind === "none" ? null : SUBJECT_TEXT[kind]);

const VOICE_BASE = {
  female: "female voice, about 25 to 30 years old, medium-warm tone, fast conversational pace, expressive and varied intonation with clear pitch rises on key words, never monotone",
  male: "male voice, about 28 to 35 years old, medium-low warm tone, fast conversational pace, expressive and varied intonation with clear pitch rises on key words, never monotone",
};

/** Perfil de voz completo. Repita-o palavra por palavra em todo clipe com voz. */
export function voiceProfile(voice: VideoSpec["voice"], speaking: VideoSpec["speaking"]): string {
  const who = voice === "female" ? "natural, energetic" : "natural, confident";
  if (speaking === "onscreen") return `${who} ${VOICE_BASE[voice]}, spoken on camera by the ${voice === "female" ? "woman" : "man"} in the photo with natural lip sync`;
  return `${who} off-screen ${VOICE_BASE[voice]}`;
}

export const NARRATION_PLACEHOLDER = "[NARRATION: 22 to 26 words in Brazilian Portuguese for 8 s, only what is written in the product description]";

/* ------------------------- Campos preenchidos pelo usuário ------------------------- */

export interface PromptFill {
  /** O que a foto mostra (trava visual). */
  visual: string;
  /** Tamanho: proporção visível ou medidas reais (trava de escala). */
  scale: string;
  /** Quem aparece na foto (trava de sujeito). */
  subject: string;
  /** Como o produto é usado de verdade (só nos cards que pedem isso). */
  realUse: string;
  /** A fala, em português. */
  narration: string;
}

export const EMPTY_FILL: PromptFill = { visual: "", scale: "", subject: "", realUse: "", narration: "" };

const SUBJECT_NOUN: Record<Exclude<SubjectKind, "none">, string> = {
  hands: "pair of hands",
  woman: "person",
  man: "person",
  pet: "animal",
  faceless: "person",
  feet: "pair of feet",
  two: "pair of people",
};

/** Rótulo e exemplo do campo "quem aparece", em português, para cada tipo de sujeito. */
export const SUBJECT_FIELD: Record<Exclude<SubjectKind, "none">, { label: string; example: string }> = {
  hands: { label: "Mãos que aparecem na foto", example: "Ex.: mãos femininas, pele clara, unhas curtas sem esmalte" },
  woman: { label: "Mulher que aparece na foto", example: "Ex.: mulher de cabelo castanho liso, pele clara, camiseta branca" },
  man: { label: "Homem que aparece na foto", example: "Ex.: homem de cabelo curto e barba rala, pele morena, camiseta preta" },
  pet: { label: "Animal que aparece na foto", example: "Ex.: gato malhado e branco, com o peito e as patas da frente brancos" },
  faceless: { label: "Pessoa que aparece na foto (sem rosto)", example: "Ex.: mulher enquadrada do peito para baixo, pele morena, short jeans" },
  feet: { label: "Pés que aparecem na foto", example: "Ex.: pés de pele clara, unhas pintadas de rosa claro" },
  two: { label: "As duas mulheres que aparecem na foto", example: "Ex.: uma de cabelo loiro e outra de cabelo preto, as duas de camiseta branca" },
};

const REAL_USE_RE = /\[(?:REAL USE|REAL TEST)[^\]]*\]/g;

/** Alguns cards têm um trecho "[REAL USE: ...]" que o usuário precisa trocar pelo uso real do produto. */
export const needsRealUse = (action: string): boolean => /\[(?:REAL USE|REAL TEST)/.test(action);

export function applyRealUse(action: string, realUse: string): string {
  const t = realUse.trim().replace(/[.;]+$/, "");
  return t ? action.replace(REAL_USE_RE, t) : action;
}

const endSentence = (t: string) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);
/** Uma fala em uma linha só, sem aspas dentro (as aspas fecham a fala no prompt). */
export const cleanNarration = (t: string): string => t.replace(/["“”]/g, "'").replace(/\s+/g, " ").trim().replace(/^'+|'+$/g, "");

/** Mais palavras que o limite da duração + 10: é uma ficha técnica colada, não uma fala. */
export const narrationTooLong = (t: string, seconds = 8): boolean => countWords(t) > narrationRange(seconds).max + 10;

const cap = (t: string) => t.trim().replace(/^\p{L}/u, (c) => c.toUpperCase());

export const narrationPlaceholder = (seconds = 8, clip?: number): string => {
  const r = narrationRange(seconds);
  const len = seconds >= 7 ? "8 s" : "4 to 6 s";
  const what = clip
    ? `a new line for clip ${clip} that continues the story without repeating the previous clips, only what is written in the product description`
    : "only what is written in the product description";
  return `[NARRATION: ${r.min} to ${r.max} words in Brazilian Portuguese for ${len}, ${what}]`;
};

/** O parágrafo "Action" completo (com a trava de sujeito e a cláusula de integridade). */
export function actionParagraph(spec: Pick<VideoSpec, "subject" | "integrity">, action: string, fill?: Partial<PromptFill>): string {
  const s = subjectText(spec.subject);
  const mine = fill?.subject?.trim();
  const lock = !s ? "" : mine ? `${endSentence(cap(mine))} It is the only ${SUBJECT_NOUN[spec.subject as Exclude<SubjectKind, "none">]} in the video. ` : `[SUBJECT LOCK: ${s}]. `;
  return `${lock}Action: ${endSentence(applyRealUse(action, fill?.realUse ?? ""))} The product stays rigid, intact and undamaged: ${spec.integrity ?? DEFAULT_INTEGRITY}.`;
}

const FIRST_FRAME =
  "The first frame is a real photo. Animate it exactly as is. The product in the photo must stay 100% identical in every frame: ";
const SAME_AS_PHOTO = "Same shape, colors, texture and proportions. It never morphs, changes size, slides, or gains or loses any part. ";
const VISUAL_PLACEHOLDER = "[VISUAL LOCK: only what is visible in the photo: shape, colors, materials, textures, distinct details and where they are]";
const SCALE_PLACEHOLDER = "[SCALE LOCK: a proportion visible in the photo (product vs hand, animal or floor), or the real size in cm if you know it]";
const SHOT =
  "Single continuous shot, no cuts. Camera locked at the exact framing and angle of the first frame, with only a very slow subtle push-in. Never rotate around the product and never reveal sides that are not visible in the first frame. Same background and steady natural light, no flicker.";
const NO_OVERLAYS = "No text, no subtitles, no logos, no icons, no overlays.";

function lockedProduct(fill?: Partial<PromptFill>): string {
  const visual = fill?.visual?.trim().replace(/[.]+$/, "");
  const scale = fill?.scale?.trim();
  return `${FIRST_FRAME}${visual ? visual : VISUAL_PLACEHOLDER}. ${SAME_AS_PHOTO}${scale ? endSentence(cap(scale)) : `${SCALE_PLACEHOLDER}.`}`;
}

/** Prompt B: o vídeo, com a foto como primeiro quadro. */
export function buildPromptB(spec: VideoSpec, fill?: Partial<PromptFill>, seconds = 8): string {
  const raw = cleanNarration(fill?.narration ?? "");
  const narr = raw && !narrationTooLong(raw, seconds) ? raw : "";
  return [
    lockedProduct(fill),
    SHOT,
    actionParagraph(spec, spec.action, fill),
    `Voice: ${voiceProfile(spec.voice, spec.speaking)}. Brazilian Portuguese. Starts at 0.0s with no delay. Speaks only this line and does not narrate the action: "${narr || narrationPlaceholder(seconds)}"`,
    NO_OVERLAYS,
  ].join("\n\n");
}

/** Opções de voz de um clipe extra. Sem esta opção, o clipe sai SEM a linha "Voice" (a narração entra na edição). */
export interface ClipVoice {
  narration?: string;
  seconds?: number;
}

/**
 * Um clipe extra (Prompt C): o Prompt B inteiro com outra ação.
 * Com `voice`, o clipe leva a sua própria fala e o MESMO perfil de voz do clipe principal, repetido igual
 * (o formato manda repetir o perfil de voz completo, nunca escrever "mesma voz do clipe anterior").
 */
export function buildClip(spec: VideoSpec, variantIndex: number, fill?: Partial<PromptFill>, voice?: ClipVoice): string {
  const parts = [lockedProduct(fill), SHOT, actionParagraph(spec, spec.variants[variantIndex], fill)];
  if (voice) {
    const seconds = voice.seconds ?? 8;
    const raw = cleanNarration(voice.narration ?? "");
    const narr = raw && !narrationTooLong(raw, seconds) ? raw : "";
    parts.push(`Voice: ${voiceProfile(spec.voice, spec.speaking)}. Brazilian Portuguese. Starts at 0.0s with no delay. Speaks only this line and does not narrate the action: "${narr || narrationPlaceholder(seconds, variantIndex + 2)}"`);
  }
  parts.push(NO_OVERLAYS);
  return parts.join("\n\n");
}

/** Prompt A: a foto da cena, para quando a foto do produto é só de catálogo (fundo branco). */
export function buildPromptA(spec: Pick<VideoSpec, "scene" | "subject">, fill?: Partial<PromptFill>): string {
  const s = subjectText(spec.subject);
  const mine = fill?.subject?.trim();
  const subj = !s ? "" : mine ? `${endSentence(cap(mine))} ` : `[SUBJECT: ${s}]. `;
  return `Using the attached product photo, create a photorealistic vertical 9:16 photo of EXACTLY this product placed in ${spec.scene}. The product must be a faithful copy of the attached photo: same shape, colors, material, texture, proportions and details. Do not redesign, recolor, resize, add or remove anything. Keep the same viewing angle as the attached photo. ${subj}Natural light, realistic iPhone photo look. No text, no logos.`;
}

/** Trechos entre colchetes que ainda não foram preenchidos. */
export function missingParts(text: string): string[] {
  return text.match(/\[(?:VISUAL LOCK|SCALE LOCK|SUBJECT LOCK|SUBJECT|NARRATION|REAL USE|REAL TEST)[^\]]*\]/g) ?? [];
}

export function buildObs(spec: VideoSpec): string {
  const hasSubject = spec.subject !== "none";
  const out = [
    '📷 A FOTO do produto vai no Flow como PRIMEIRO QUADRO: suba em "Frames to Video" (não em Elementos) e cole o prompt ao lado.',
    `1) Preencha [VISUAL LOCK] só com o que a foto MOSTRA e [SCALE LOCK] com uma proporção visível (ou medidas reais em cm).${hasSubject ? " Preencha [SUBJECT LOCK] com os traços visíveis de quem aparece." : ""}`,
    "2) Escreva a narração só com o que está na descrição do produto: 22 a 26 palavras para 8 s (12 a 18 para 4 a 6 s). Não narre a ação.",
    "3) Foto de catálogo (fundo branco)? Gere antes a foto da cena com o Prompt A (abaixo) num gerador de imagem, confira se o produto ficou idêntico e use essa foto como primeiro quadro.",
    "4) Gere 3 a 4 versões e escolha a em que o produto está idêntico. Se ainda mudar, use clipes de 4 a 6 s.",
    "5) Microcenas: gere os clipes extras (logo abaixo). Cada um é um prompt completo para a MESMA foto, sem narração. Junte-os e corte em pedaços de 1 a 1,5 s no CapCut.",
  ];
  if (spec.note) out.push("", `⚠ ${spec.note}`);
  return out.join("\n");
}

/* --------------------------------- Narração --------------------------------- */

/** Faixa de palavras por duração (cerca de 3 palavras por segundo). */
export function narrationRange(seconds: number): { min: number; max: number } {
  return seconds >= 7 ? { min: 22, max: 26 } : { min: 12, max: 18 };
}

export function countWords(text: string): number {
  return text
    .replace(/["“”]/g, " ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export interface NarrationCheck {
  words: number;
  min: number;
  max: number;
  ok: boolean;
  /** Palavras proibidas encontradas (o briefing as veta). */
  banned: string[];
}

/** Palavras que o formato proíbe na narração, com as suas variações (feminino, plural). */
const BANNED_PATTERNS: { word: string; re: RegExp }[] = [
  { word: "sofisticado", re: /sofisticad[oa]s?/ },
  { word: "elegância pura", re: /eleg[aâ]ncia pura/ },
  { word: "impecável", re: /impec[aá]ve(?:l|is)/ },
  { word: "excelência", re: /excel[eê]ncia/ },
  { word: "refinado", re: /refinad[oa]s?/ },
];
export const BANNED_WORDS = BANNED_PATTERNS.map((b) => b.word);

export function checkNarration(text: string, seconds: number): NarrationCheck {
  const { min, max } = narrationRange(seconds);
  const words = countWords(text);
  const lower = text.toLowerCase();
  return { words, min, max, ok: words >= min && words <= max, banned: BANNED_PATTERNS.filter((b) => b.re.test(lower)).map((b) => b.word) };
}

/** Todas as falas da seção "Narração" (clipe 1 e, se houver, os extras), na ordem. */
export function findNarrations(output: { sections: { title: string; items: { text: string }[] }[] } | undefined): string[] {
  const sec = output?.sections.find((x) => /^narra/i.test(x.title.trim()));
  return (sec?.items ?? []).map((i) => i.text.trim()).filter(Boolean);
}

/* ------------------------------- Gerador (Gemini) ------------------------------- */

export const SECTION_TITLES = {
  photo: "O que vi na foto",
  promptA: "Prompt A (foto da cena)",
  promptB: "Prompt B (vídeo)",
  narration: "Narração",
  extras: "Clipes extras (Prompt C)",
  alerts: "Alertas",
  reminder: "Lembrete",
} as const;

const GENERIC: VideoSpec = {
  scene: "[SCENE]",
  subject: "none",
  action: "[phase 1, phase 2, phase 3, with simple timing].",
  variants: [],
  voice: "female",
  speaking: "offscreen",
};
const GENERIC_B = buildPromptB(GENERIC)
  .replace(/Action: /, "[SUBJECT LOCK: the animal or person in the photo, by visible traits; the only one in the video]. Action: ")
  .replace(/Voice: [^.]*\./, "Voice: [VOICE PROFILE: gender, age range, tone, pace, energy, timbre, and expressive intonation with pitch rises on key words, never monotone].")
  .replace(NARRATION_PLACEHOLDER, "[NARRATION]");
const GENERIC_A = buildPromptA({ scene: "[SCENE]", subject: "none" }).replace("No text, no logos.", "[SUBJECT if any]. No text, no logos.");

export const VEO_SYSTEM = `Você é um gerador de prompts de vídeo vertical 9:16 (Google Veo / Flow) para produto físico (TikTok Shop / Shopee) em que o produto do vídeo é IDÊNTICO ao da FOTO REAL enviada pelo usuário. Trabalhe sempre a partir da FOTO REAL. Se não houver foto, não gere nada: responda apenas pedindo a foto.

Por que o formato antigo falhava (o Veo mudava o produto): (1) o prompt descrevia o produto com palavras genéricas e, quando texto e imagem divergem, o Veo redesenha o produto; (2) microcenas com ângulos diferentes obrigam o Veo a inventar lados que a foto não mostra; (3) havia interação sem trava de integridade; (4) dependia só de texto, em vez de usar a foto real como primeiro quadro.

REGRAS DO FORMATO NOVO
- A foto real é o PRIMEIRO QUADRO (no Flow: "Frames to Video"). Se a foto for só de catálogo (fundo branco), entregue antes o Prompt A (foto da cena num modelo de imagem), para o usuário conferir se o produto ficou idêntico e usar essa foto como primeiro quadro.
- O prompt de vídeo NÃO descreve o produto de memória nem pela descrição de venda. Ele traz uma TRAVA VISUAL (VISUAL LOCK) escrita só com o que é VISÍVEL na foto: formato, cores, materiais, texturas, detalhes distintos e onde ficam. Nunca inclua material ou característica que a foto não mostra (isso só pode entrar na narração).
- UM plano contínuo por clipe, sem cortes, câmera travada no mesmo enquadramento e ângulo da foto, com no máximo um empurrão lento e sutil. Nunca girar em torno do produto nem mostrar lados que a foto não mostra. Se o usuário quiser outro ângulo, ele precisa mandar uma foto desse ângulo e usá-la como outro primeiro quadro.
- TRAVA DE INTEGRIDADE obrigatória: o produto fica rígido, intacto, sem dano, sem deformar e sem mudar de lugar durante a interação (adapte à ação).
- TRAVA DE SUJEITO (SUBJECT LOCK): se a foto tem animal ou pessoa, descreva-os pelos traços visíveis e diga que é o único. Não troque nem acrescente outro.
- TRAVA DE ESCALA (SCALE LOCK): use uma proporção visível na foto (produto em relação ao animal, à mão ou ao piso). Se o usuário informou medidas reais, use-as. Se NÃO informou, nunca estime pelo olho: use só a proporção visível e registre em "Alertas" que faltam as medidas reais.
- O ambiente (parede, piso, luz) é o da foto e fica estável, sem tremer nem piscar.
- Zero texto, legenda, logo, ícone, carrinho ou overlay.
- A ação é simples, em 2 ou 3 fases curtas, fisicamente segura e coerente com o uso REAL do produto.
- Microcenas rápidas são feitas na EDIÇÃO (CapCut): 2 a 4 clipes de plano único a partir da MESMA foto (muda só a ação), cortados em pedaços de 1 a 1,5 s.

PASSO A PASSO
1. Olhe a foto e escreva a TRAVA VISUAL e a TRAVA DE ESCALA (só o visível).
2. Leia a descrição do produto. Liste só as características e benefícios que estão escritos nela. Aponte contradições (ex.: "para gatos pequenos e médios" versus "para todos os gatos") e NÃO use o ponto contraditório.
3. Defina a ação conforme o uso real do produto e a foto.
4. Escreva a narração (regras abaixo).
5. Monte o prompt de vídeo (Prompt B). Se a foto for de catálogo, entregue antes o Prompt A.
6. Se o usuário pedir mais clipes, entregue cada clipe extra (Prompt C) como o Prompt B COMPLETO, pronto para colar, trocando SÓ o parágrafo "Action" e SEM a linha "Voice".

REGRAS DA NARRAÇÃO (em português do Brasil)
- Fale do produto e das características reais. NUNCA narre a ação da tela.
- Use só características e benefícios que estão na descrição. Não invente função, resultado nem número.
- Suavize promessas: "ajuda a", nunca garantia absoluta nem promessa médica.
- Ritmo de cerca de 3 palavras por segundo: 8 s = 22 a 26 palavras; 4 a 6 s = 12 a 18 palavras. Conte antes de entregar.
- Linguagem falada e simples. Proibido: sofisticado, elegância pura, impecável, excelência, refinado.
- Pontue para forçar entonação (vírgula, pergunta, exclamação). Nada de frase reta e lida.
- CTA natural e variado (não repita "clica no carrinho"). Sem referência a elementos gráficos.
- Se houver mais de um clipe com voz, repita o PERFIL DE VOZ completo, palavra por palavra, em cada prompt. Nunca escreva "mesma voz do clipe anterior".

MODELOS (em inglês; só a narração é em português)

Prompt A (só se a foto for de catálogo; o usuário usa com a foto anexada em um modelo de imagem):
${GENERIC_A}

Prompt B (vídeo, com a foto como primeiro quadro):
${GENERIC_B}

Prompt C: repita o Prompt B trocando SÓ o parágrafo "Action", mantendo o plano único e o mesmo ângulo. Se o pedido disser que os clipes extras levam fala, cada Prompt C traz a linha "Voice" com o MESMO perfil de voz do Prompt B, escrito por inteiro (nunca "mesma voz do clipe anterior"), e a sua própria fala, que CONTINUA a história sem repetir o clipe anterior; a chamada para clicar no carrinho vai só na última fala da sequência. Se o pedido disser que os extras não levam fala, apague a linha "Voice" (a narração entra na edição).

CHECKLIST ANTES DE ENTREGAR
- A trava visual traz só o que a foto mostra. Plano único, sem cortes, câmera travada, sem ângulo que a foto não tem.
- Cláusula de integridade presente. Trava de escala presente. Trava de sujeito, se houver animal ou pessoa.
- Ambiente estável. Perfil de voz completo e narração com a contagem certa.
- Zero texto, logo, ícone ou overlay. Nenhuma característica fora da descrição; contradições sinalizadas.

FORMATO DA RESPOSTA
Responda no JSON do schema, com estas seções, nesta ordem e com estes títulos EXATOS (omita as que não se aplicam):
1. "${SECTION_TITLES.photo}": 1 item com a trava visual e a de escala em 2 ou 3 linhas (português).
2. "${SECTION_TITLES.promptA}": 1 item (só se a foto for de catálogo).
3. "${SECTION_TITLES.promptB}": 1 item com o Prompt B completo, já preenchido.
4. "${SECTION_TITLES.narration}": 1 item por clipe COM fala, na ordem, cada um com o texto SÓ da fala em português (sem aspas e sem explicações) e o rótulo "Clipe 1", "Clipe 2"… (o clipe 1 é o Prompt B; os extras só entram aqui se o pedido disser que levam fala).
5. "${SECTION_TITLES.extras}": 1 item por clipe extra pedido (Prompt C): o Prompt B COMPLETO com a nova ação, pronto para colar, com a linha "Voice" e a fala própria quando o pedido mandar, e sem a linha "Voice" quando não mandar. Só se pedido.
6. "${SECTION_TITLES.alerts}": 1 item por alerta (contradições na descrição, medidas que faltam, riscos da foto). Se não houver, 1 item dizendo "Nenhum alerta".
7. "${SECTION_TITLES.reminder}": 1 item: gerar de 3 a 4 versões e escolher a em que o produto está idêntico; se ainda derivar, usar clipes de 4 a 6 s.
Prompts técnicos em inglês; narração, "O que vi na foto", alertas e lembrete em português do Brasil. Nunca invente característica que não esteja na foto (visual) ou na descrição (narração).`;

export interface VeoRequest {
  catalogPhoto: boolean;
  product: string;
  description: string;
  measures: string;
  seconds: number;
  extraClips: number;
  /** Cada clipe extra leva a sua fala (true) ou fica sem fala, para narrar na edição (false). */
  extraVoice: boolean;
  voice: "female" | "male";
  speaking: "offscreen" | "onscreen";
  action: string;
  scene: string;
}

export function veoUserPrompt(r: VeoRequest): string {
  const range = narrationRange(r.seconds);
  return [
    `Tipo da foto: ${r.catalogPhoto ? "CATÁLOGO (fundo branco): entregue o Prompt A antes do Prompt B." : "FOTO DE CENA (o produto já está no ambiente): não precisa do Prompt A."}`,
    `Produto: ${r.product.trim() || "ver a foto"}`,
    `Descrição do produto (única fonte para a narração):\n${r.description.trim() || "(não informada: não invente características; avise em Alertas)"}`,
    `Medidas reais: ${r.measures.trim() || "NÃO informadas: não estime pelo olho; use só a proporção visível e avise em Alertas."}`,
    `Duração da narração: ${r.seconds} s (${range.min} a ${range.max} palavras).`,
    `Voz: ${r.voice === "female" ? "feminina" : "masculina"}, ${r.speaking === "onscreen" ? "a pessoa da foto fala para a câmera com sincronia labial" : "fora de cena (off-screen)"}.`,
    `Clipes extras (Prompt C): ${r.extraClips > 0 ? r.extraClips : "nenhum"}.`,
    r.extraClips > 0 ? (r.extraVoice ? "Os clipes extras LEVAM fala própria: cada um continua a história sem repetir, com o mesmo perfil de voz escrito por inteiro, e a chamada para ação vai só no último. Liste a fala de cada clipe na seção Narração (Clipe 1, Clipe 2…)." : "Os clipes extras NÃO levam fala: apague a linha Voice deles (a narração entra na edição).") : "",
    r.action.trim() ? `Ideia de ação (adapte ao uso REAL do produto e à foto): ${r.action.trim()}` : "Ideia de ação: livre, conforme o uso real do produto e a foto.",
    r.scene.trim() ? `Cenário sugerido para o Prompt A: ${r.scene.trim()}` : "",
    "A(s) imagem(ns) anexada(s) é(são) a FOTO REAL do produto. Gere agora, no formato de seções pedido.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/* ------------------- A IA preenche os campos da área de montagem ------------------- */

const between = (text: string, a: string, b: string) => text.slice(text.indexOf(a), text.indexOf(b));
const RULES_BLOCK = between(VEO_SYSTEM, "REGRAS DO FORMATO NOVO", "PASSO A PASSO");
export const NARRATION_BLOCK = between(VEO_SYSTEM, "REGRAS DA NARRAÇÃO", "MODELOS");

export const FILL_SECTIONS = { fields: "Campos", alerts: "Alertas" } as const;

export const FILL_SYSTEM = `Você preenche os campos de um prompt de vídeo vertical 9:16 (Google Veo / Flow) para produto físico (TikTok Shop / Shopee). O produto do vídeo precisa ser IDÊNTICO ao da foto real. Você NÃO escreve o prompt inteiro: devolve só os campos pedidos, curtos e prontos para entrar no prompt.

O QUE VOCÊ RECEBE: o card (ação-modelo, quem aparece, cenário), o título e a descrição do produto (pode ser uma ficha técnica longa, cheia de itens), medidas reais (opcional) e, se houver, a FOTO REAL anexada.

${RULES_BLOCK}
COMO PREENCHER CADA CAMPO (itens da seção "${FILL_SECTIONS.fields}", com EXATAMENTE estes rótulos; OMITA o item que não puder preencher)
- visual (inglês): só se houver FOTO. 1 ou 2 frases curtas com o que a foto MOSTRA: formato, cores, materiais aparentes, texturas, detalhes distintos e onde ficam. Nunca use a descrição de venda nem o título, e nunca inclua material ou característica que a foto não mostra. Sem foto: omita.
- scale (inglês): 1 frase. Se a descrição trouxer medidas reais, use-as (ex.: "the product is about 114 cm tall, 90.6 cm wide and 35.2 cm deep"). Sem medidas, use uma proporção visível na foto (produto em relação à mão, ao animal ou ao piso). Sem medidas e sem foto: omita. Nunca estime pelo olho.
- subject (inglês): só se houver FOTO e o card tiver pessoa, mãos ou animal: descreva pelos traços visíveis. Senão, omita.
- action (inglês): a ação do vídeo adaptada ao uso REAL deste produto, em 2 ou 3 fases curtas com tempos simples ("for the first 2 seconds ...; then ...; in the last 3 seconds ..."). Mantenha o mesmo tipo de sujeito do card (as mesmas mãos, pessoa ou animal) e o plano único com câmera travada: nada de cortes, giros nem lados que a foto não mostra. Se a ação-modelo já combina com o produto, só ajuste os detalhes; se não combina (ex.: card de eletrodoméstico para um móvel), troque pelo gesto de uso real mais simples e seguro. Sem trechos entre colchetes.
- actionPt (português): 1 ou 2 frases simples dizendo o que acontece no vídeo.
- clip2 e clip3 (inglês), clip2Pt e clip3Pt (português): duas ações alternativas no mesmo formato, para clipes extras (mesma foto, plano único).
- narration (português do Brasil): a fala do vídeo (clipe 1), no tamanho pedido. Escolha as 2 ou 3 características e benefícios mais úteis para vender que estão escritos na descrição. NUNCA liste a ficha técnica nem enfileire números e especificações. Se houver clipes extras com fala (veja o pedido), esta é a ABERTURA da sequência: gancho + 1 benefício, SEM chamada para ação.
- narration2 e narration3 (português do Brasil): a fala de cada clipe extra (narration2 vai com clip2, narration3 com clip3), só se o clipe existir. Cada fala tem o mesmo tamanho pedido e CONTINUA a história sem repetir o clipe anterior (traga outros benefícios que estão na descrição). A chamada para clicar no carrinho vai só na ÚLTIMA fala da sequência. Se não houver clipes extras, a chamada fecha a fala em narration.

${NARRATION_BLOCK}
SEÇÃO "${FILL_SECTIONS.alerts}": 1 item por alerta, em português: contradições na descrição (e não use o ponto contraditório), medidas que faltam, foto que não foi enviada (diga que o campo "visual" não foi preenchido e peça a foto), riscos. Se não houver, 1 item "Nenhum alerta".

Os campos em inglês devem ser curtos e diretos. Responda no JSON do schema com as seções "${FILL_SECTIONS.fields}" e "${FILL_SECTIONS.alerts}".`;

const SUBJECT_PT: Record<SubjectKind, string> = {
  none: "ninguém (só o produto)",
  hands: "mãos",
  woman: "uma mulher",
  man: "um homem",
  pet: "um animal",
  faceless: "uma pessoa sem rosto",
  feet: "pés",
  two: "duas pessoas",
};

export interface FillRequest {
  title: string;
  subject: SubjectKind;
  action: string;
  scene: string;
  product: string;
  description: string;
  measures: string;
  seconds: number;
  hasPhoto: boolean;
  /** Quantos clipes extras terão fala (0 = sem clipes extras com fala). */
  extraClips: number;
}

export function fillUserPrompt(r: FillRequest): string {
  const range = narrationRange(r.seconds);
  return [
    `Card escolhido: ${r.title}`,
    `Quem aparece no vídeo: ${SUBJECT_PT[r.subject]}`,
    `Ação-modelo do card (adapte ao produto, se precisar): ${r.action}`,
    `Cenário do card: ${r.scene}`,
    `Produto: ${r.product.trim() || "(sem título)"}`,
    `Descrição / ficha técnica do produto (única fonte da narração; pode ser longa, escolha só o que vende):\n${r.description.trim() || "(vazia)"}`,
    `Medidas reais informadas à parte: ${r.measures.trim() || "(nenhuma; procure na descrição)"}`,
    `Narração: ${r.seconds} s, de ${range.min} a ${range.max} palavras.`,
    r.extraClips > 0
      ? `Sequência: 1 clipe principal + ${r.extraClips} ${r.extraClips === 1 ? "clipe extra" : "clipes extras"} COM fala, cada um de ${range.min} a ${range.max} palavras. Escreva narration (abertura), ${r.extraClips === 1 ? "narration2" : "narration2 e narration3"}. A chamada para ação vai só na última fala.`
      : "Sem clipes extras com fala: a fala principal fecha com a chamada para ação.",
    r.hasPhoto ? "FOTO anexada: a imagem enviada é a FOTO REAL do produto. Preencha também visual e subject." : "FOTO NÃO anexada: omita visual e subject e avise em Alertas.",
  ].join("\n\n");
}

export interface AiFill {
  visual?: string;
  scale?: string;
  subject?: string;
  action?: string;
  actionPt?: string;
  clip2?: string;
  clip2Pt?: string;
  clip3?: string;
  clip3Pt?: string;
  narration?: string;
  narration2?: string;
  narration3?: string;
  alerts: string[];
}

const FILL_KEYS = ["visual", "scale", "subject", "action", "actionPt", "clip2", "clip2Pt", "clip3", "clip3Pt", "narration", "narration2", "narration3"] as const;

/** Lê a resposta da IA (seções "Campos" e "Alertas"). Itens ausentes ficam de fora; colchetes soltos são descartados. */
export function parseFill(output: { sections: { title: string; items: { label?: string; text: string }[] }[] } | undefined): AiFill {
  const out: AiFill = { alerts: [] };
  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const fields = output?.sections.find((s) => norm(s.title) === norm(FILL_SECTIONS.fields));
  for (const it of fields?.items ?? []) {
    const key = FILL_KEYS.find((k) => k.toLowerCase() === (it.label ?? "").trim().toLowerCase());
    const text = it.text.replace(/\s+/g, " ").trim();
    if (!key || !text || /\[(?:VISUAL|SCALE|SUBJECT|NARRATION|REAL)/.test(text)) continue;
    out[key] = key.startsWith("narration") ? cleanNarration(text) : text;
  }
  const alerts = output?.sections.find((s) => norm(s.title) === norm(FILL_SECTIONS.alerts));
  out.alerts = (alerts?.items ?? []).map((i) => i.text.trim()).filter((t) => t && !/^nenhum alerta\.?$/i.test(t));
  return out;
}
