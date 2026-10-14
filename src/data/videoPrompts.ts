import { buildObs, buildPromptB } from "../lib/veo/briefing";
import type { LibraryItem } from "./types";
import { VIDEO_CARDS } from "./videoSpecs";

/**
 * "Prompts dos Vídeos do TikTok": 48 ideias de vídeo no formato novo (a foto real do produto é o primeiro quadro).
 * O prompt final é montado na área "Montar prompt" (campos preenchidos pelo usuário). Aqui fica o modelo, usado na busca.
 * Os títulos e a ordem (ids video-0…video-47) não mudam, para as mídias de cada card continuarem valendo.
 */
export const VIDEO_PROMPTS: LibraryItem[] = VIDEO_CARDS.map((card, i) => ({
  id: `video-${i}`,
  title: card.title,
  prompt: buildPromptB(card),
  obs: `${card.resumo}\n\n${buildObs(card)}`,
  cover: { tag: card.tag, emoji: card.em, hue: card.hue },
  mode: "frames" as const,
  source: "builtin" as const,
  spec: card,
}));
