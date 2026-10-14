import type { ToolOutput } from "../../lib/gemini";
import { BANNED_WORDS, NARRATION_BLOCK, cleanNarration, narrationRange, narrationTooLong } from "../../lib/veo/briefing";
import { BASE_SYSTEM } from "../../tools/knowledge";
import { defaultScene, getGarment, getTone, type Garment, type GarmentId, type ToneId } from "../data/garments";
import { MANNEQUIN_VIDEOS, type MannequinVideo, type Side } from "../data/videos";

export interface MqConfig {
  garment: GarmentId;
  name: string;
  description: string;
  gender: "female" | "male";
  tone: ToneId;
  hand: "feminine" | "masculine";
  voice: "female" | "male";
  /** Vazio = cenário padrão do tipo de manequim. */
  scene: string;
  /** Coloca a fala dentro do prompt (a voz fala no vídeo). */
  withNarration: boolean;
}

export const DEFAULT_CONFIG: MqConfig = {
  garment: "vestido",
  name: "",
  description: "",
  gender: "female",
  tone: "peach",
  hand: "feminine",
  voice: "female",
  scene: "",
  withNarration: true,
};

export const effectiveScene = (cfg: MqConfig): string => cfg.scene.trim() || defaultScene(cfg.gender);

/** "a saia" vira "da saia"; "o decote e o corpete" vira "do decote e do corpete". */
export const contract = (s: string): string =>
  s.replace(/^(o|a|os|as) /, (_m, art: string) => `d${art} `).replace(/ e (o|a|os|as) /g, (_m, art: string) => ` e d${art} `);

/** Troca os {tokens} do texto pelo vocabulário da peça escolhida. */
export function fillTokens(text: string, g: Garment, cfg: Pick<MqConfig, "hand">): string {
  const en: Record<string, string> = { hand: cfg.hand, garment: g.en, upper: g.upper, lower: g.lower, waist: g.waist, neck: g.neck, back: g.back };
  const pt: Record<string, string> = { upperPt: g.upperPt, lowerPt: g.lowerPt, waistPt: g.waistPt, neckPt: g.neckPt, backPt: g.backPt };
  return text
    .replace(/d\{(\w+Pt)\}/g, (_m, k: string) => contract(pt[k] ?? ""))
    .replace(/\{handPt\}/g, cfg.hand === "feminine" ? "feminina" : "masculina")
    .replace(/\{(\w+Pt)\}/g, (_m, k: string) => pt[k] ?? "")
    .replace(/\{(\w+)\}/g, (_m, k: string) => en[k] ?? "");
}

export const summaryFor = (v: MannequinVideo, cfg: MqConfig): string => fillTokens(v.summaryPt, getGarment(cfg.garment), cfg);

/** Fala que vale para este vídeo: a que o usuário escreveu ou, no vestido, a do modelo original. */
export function narrationFor(v: MannequinVideo, cfg: MqConfig, saved: Record<string, string>): string {
  if (v.id in saved) return saved[v.id];
  return cfg.garment === "vestido" ? v.defaultNarration : "";
}

export const NARRATION_PLACEHOLDER = "[NARRATION: 22 to 26 words in Brazilian Portuguese for 8 s, a different line for this video]";

/** O prompt do vídeo, pronto para colar no Flow (com a foto do manequim como primeiro quadro). */
export function buildVideoPrompt(v: MannequinVideo, cfg: MqConfig, narration: string): string {
  const g = getGarment(cfg.garment);
  const tone = getTone(cfg.tone).en;
  const front = v.side === "front";
  const raw = cleanNarration(narration);
  const narr = raw && !narrationTooLong(raw, 8) ? raw : "";
  const actions = v.actions.map((a) => `${a.t}:\n${fillTokens(a.text, g, cfg)}`).join("\n\n");
  const audio = [
    "AUDIO:",
    `Brazilian Portuguese ${cfg.voice} voice.`,
    "Natural commercial narration.",
    "Duration around 8 seconds.",
    "Do not sync lips.",
    "Voice only, no dialogue from mannequin.",
    ...(cfg.withNarration ? [`Speak only this line, exactly as written: "${narr || NARRATION_PLACEHOLDER}"`] : []),
  ].join("\n");
  return [
    "Create a realistic vertical 9:16 fashion boutique product video, 8 seconds duration.",
    "Use the reference image as the exact starting frame.",
    `Show a full-body ${cfg.gender} mannequin with a ${tone} skin tone, faceless head, wearing exactly the same ${g.en} from the reference image.`,
    `PRODUCT LOCK:\nKeep the ${g.en} 100% identical:\nsame color, fabric, ${g.lock}, stitching, shape, length, proportions and details.\nDo not redesign or modify anything.`,
    front
      ? "The mannequin is facing directly toward the camera and remains completely still."
      : `The mannequin is facing away from the camera, showing the back of the ${g.en}. It remains completely still.\nPreserve every detail of the back: same fabric, ${g.back}, cut, shape and proportions.`,
    `SCENE:\n${effectiveScene(cfg)}`,
    `ACTION:\n${actions}${v.note ? `\n\n${v.note}` : ""}`,
    "CAMERA:\nNatural handheld smartphone movement.\nNo rotation.\nNo mannequin movement.",
    "STYLE:\nLuxury boutique TikTok fashion showcase.\nReal smartphone recording.\nNatural lighting.",
    `NEGATIVE:\nNo changing ${g.en}.\nNo extra arms.\nNo extra hands.\nNo text.\nNo watermark.\nNo CGI appearance.\nNo mannequin rotation.`,
    audio,
  ].join("\n\n");
}

/** Prompt de imagem: veste o manequim com a peça da foto (a foto do manequim é o primeiro quadro dos vídeos). */
export function buildImagePrompt(side: Side, cfg: MqConfig): string {
  const g = getGarment(cfg.garment);
  const tone = getTone(cfg.tone).en;
  const pose =
    side === "front"
      ? `standing completely still and facing directly toward the camera, wearing EXACTLY this ${g.en}`
      : `standing completely still and facing away from the camera, showing the back of EXACTLY this ${g.en}`;
  const detail =
    side === "front"
      ? `same color, fabric, ${g.lock}, stitching, shape, length, proportions and details`
      : `same fabric, ${g.back}, cut, shape, length and proportions`;
  return `Using the attached ${side === "front" ? "front" : "back"} photo of the ${g.en}, create a photorealistic vertical 9:16 photo of a full-body ${cfg.gender} mannequin with a ${tone} skin tone and a faceless head, ${pose}. The ${g.en} must be a faithful copy of the attached photo: ${detail}. Do not redesign, recolor, resize, add or remove anything. Setting: ${effectiveScene(cfg)} Soft natural retail lighting, realistic smartphone photo look. No text, no logos, no watermark.`;
}

/* ------------------------- A IA escreve as 10 falas ------------------------- */

export const NARRATIONS_SYSTEM = `${BASE_SYSTEM}

Você escreve as falas (narração) de 10 vídeos curtos de 8 segundos em que um manequim veste uma peça de roupa, para TikTok Shop, em português do Brasil.

REGRAS
- Cada vídeo mostra uma ação diferente (a câmera se aproxima, uma mão toca o tecido…). A fala NUNCA descreve a ação da tela: fala da peça e do que ela oferece.
- Cada fala tem de ${narrationRange(8).min} a ${narrationRange(8).max} palavras (cerca de 3 palavras por segundo) e é DIFERENTE das outras (ganchos e benefícios diferentes).
- Use só o que está na descrição da peça. Se a descrição vier vazia, fale só do que é óbvio pelo tipo de peça, sem inventar tecido, tamanho, modelagem nem preço, e avise em Alertas.
- Os vídeos 1 a 5 são de frente; os vídeos 6 a 10 são de costas: nas falas dos vídeos de costas só mencione detalhes das costas se a descrição os trouxer.
- A chamada para clicar no carrinho laranja aparece em no máximo 3 das 10 falas, escrita de jeitos diferentes.
- Nunca use as palavras: ${BANNED_WORDS.join(", ")}.

${NARRATION_BLOCK}
Responda no JSON do schema: a seção "Falas" com 10 itens rotulados "1" a "10" (o texto de cada item é SÓ a fala, sem aspas) e a seção "Alertas" (contradições na descrição, informações que faltam; se não houver, 1 item "Nenhum alerta").`;

export function narrationsUserPrompt(cfg: MqConfig): string {
  const g = getGarment(cfg.garment);
  return [
    `Peça: ${g.label.toLowerCase()}${cfg.name.trim() ? ` (${cfg.name.trim()})` : ""}`,
    `Manequim: ${cfg.gender === "female" ? "feminino" : "masculino"}`,
    `Descrição ou ficha técnica da peça (única fonte; pode ser longa, escolha só o que vende):\n${cfg.description.trim() || "(vazia)"}`,
    "Escreva as 10 falas.",
  ].join("\n\n");
}

export interface ParsedNarrations {
  byId: Record<string, string>;
  alerts: string[];
}

export function parseNarrations(output: Pick<ToolOutput, "sections"> | undefined): ParsedNarrations {
  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const byId: Record<string, string> = {};
  const falas = output?.sections.find((s) => norm(s.title) === "falas");
  for (const it of falas?.items ?? []) {
    const n = Number((it.label ?? "").replace(/\D/g, ""));
    const v = MANNEQUIN_VIDEOS.find((x) => x.n === n);
    const text = cleanNarration(it.text);
    if (v && text) byId[v.id] = text;
  }
  const al = output?.sections.find((s) => norm(s.title) === "alertas");
  const alerts = (al?.items ?? []).map((i) => i.text.trim()).filter((t) => t && !/^nenhum alerta\.?$/i.test(t));
  return { byId, alerts };
}
