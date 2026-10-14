import type { StyleId } from "../data/styles";

export type StepId = "avatar" | "produto" | "cena" | "visual" | "roteiro" | "movimento";

export interface StepMeta {
  id: StepId;
  title: string;
  /** Quantas barras do progresso ficam preenchidas nesta tela. */
  filled: number;
}

export interface FlowMeta {
  total: number;
  steps: StepMeta[];
}

/** Passos de cada estilo, como no vídeo de referência. */
export const FLOWS: Record<StyleId, FlowMeta> = {
  ugc: {
    total: 4,
    steps: [
      { id: "avatar", title: "Avatar / Influencer", filled: 1 },
      { id: "produto", title: "Produto", filled: 2 },
      { id: "cena", title: "Configuração da Cena", filled: 3 },
      { id: "roteiro", title: "Roteiro & Voz", filled: 4 },
    ],
  },
  pov: {
    total: 3,
    steps: [
      { id: "produto", title: "Produto", filled: 1 },
      { id: "visual", title: "Configuração Visual", filled: 2 },
      { id: "roteiro", title: "Roteiro & Voz", filled: 3 },
    ],
  },
  provador: {
    total: 4,
    steps: [
      { id: "avatar", title: "Avatar / Influencer", filled: 1 },
      { id: "produto", title: "Produto", filled: 2 },
      { id: "cena", title: "Configuração da Cena", filled: 3 },
      { id: "movimento", title: "Movimento", filled: 3 },
    ],
  },
};

export const stepLabel = (style: StyleId, index: number): string => `PASSO ${FLOWS[style].steps[index].filled} DE ${FLOWS[style].total}`;
