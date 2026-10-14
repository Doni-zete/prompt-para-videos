export type Side = "front" | "back";

export interface MannequinVideo {
  id: string;
  n: number;
  side: Side;
  /** Nome do movimento, em português. */
  title: string;
  /** O que acontece, em português (com as palavras da peça escolhida). */
  summaryPt: string;
  /** Linha do tempo do prompt (inglês); {tokens} viram o vocabulário da peça. */
  actions: { t: string; text: string }[];
  /** Linha extra opcional depois da linha do tempo. */
  note?: string;
  /** Fala do modelo original (vestido). */
  defaultNarration: string;
}

/**
 * Os 10 vídeos: 5 de frente e 5 de costas, cada um com um movimento diferente.
 * Tokens: {hand} feminine/masculine, {garment}, {upper}, {lower}, {waist}, {neck}, {back}; em português: {handPt}, {upperPt}, {lowerPt}, {waistPt}, {neckPt}, {backPt}.
 */
export const MANNEQUIN_VIDEOS: MannequinVideo[] = [
  {
    id: "m1", n: 1, side: "front", title: "Aproximação e toque no tecido",
    summaryPt: "A câmera se aproxima devagar do manequim, de frente. Uma mão {handPt} toca {upperPt} para mostrar a textura e depois segura {lowerPt} e mexe o tecido de leve, para mostrar o caimento e o volume.",
    actions: [
      { t: "0-2s", text: "Camera slowly approaches the mannequin from the front." },
      { t: "2-5s", text: "A {hand} hand enters from the right side and gently touches the {upper}, showing the texture." },
      { t: "5-8s", text: "The hand lightly holds the {lower} and moves the fabric slightly to demonstrate the flow and volume." },
    ],
    defaultNarration: "Esse vestido une elegância e conforto, com um caimento incrível que valoriza a silhueta em qualquer ocasião.",
  },
  {
    id: "m2", n: 2, side: "front", title: "Mostrar a cintura e a parte de baixo",
    summaryPt: "A câmera começa no corpo inteiro e desce até a cintura. A mão {handPt} toca {waistPt} para mostrar a estrutura e depois passa pelo tecido d{lowerPt}.",
    actions: [
      { t: "0-3s", text: "Camera starts full body and slowly moves downward toward the waist area." },
      { t: "3-6s", text: "A {hand} hand enters from the right side and gently touches the {waist}, showing the structure of the {garment}." },
      { t: "6-8s", text: "The hand softly moves across the {lower} fabric, creating a natural presentation movement." },
    ],
    defaultNarration: "Olha esse acabamento delicado, o tecido tem movimento elegante e deixa o visual sofisticado sem perder a leveza.",
  },
  {
    id: "m3", n: 3, side: "front", title: "Puxar a parte de baixo para dar volume",
    summaryPt: "A câmera se aproxima devagar. A mão {handPt} puxa a lateral d{lowerPt} para fora e solta: o tecido volta ao lugar enquanto a câmera mostra a silhueta.",
    actions: [
      { t: "0-2s", text: "Slow camera approach." },
      { t: "2-5s", text: "Hand enters from right side and gently pulls the side of the {lower} outward." },
      { t: "5-8s", text: "The fabric returns naturally while camera captures the silhouette." },
    ],
    note: "Keep mannequin facing front.",
    defaultNarration: "O detalhe que encanta está no caimento da saia, criando um movimento lindo e uma aparência muito elegante.",
  },
  {
    id: "m4", n: 4, side: "front", title: "Câmera lateral suave",
    summaryPt: "A câmera faz um movimento lateral bem sutil, sempre de frente. A mão {handPt} ajeita a parte de cima e a câmera volta para o plano inteiro, mostrando o visual completo.",
    actions: [
      { t: "0-3s", text: "Camera makes a very subtle horizontal movement while maintaining front view." },
      { t: "3-6s", text: "Hand adjusts the upper part of the {garment} gently." },
      { t: "6-8s", text: "Camera returns to full front view showing the complete look." },
    ],
    note: "No mannequin movement.",
    defaultNarration: "Um modelo pensado para quem ama peças femininas, delicadas e com aquele visual sofisticado de boutique.",
  },
  {
    id: "m5", n: 5, side: "front", title: "Close nos detalhes",
    summaryPt: "A câmera se aproxima d{neckPt}, a mão {handPt} toca a costura e o tecido, e a câmera se afasta para mostrar a peça inteira.",
    actions: [
      { t: "0-3s", text: "Camera slowly zooms into {neck}." },
      { t: "3-6s", text: "Hand gently touches the stitching and fabric." },
      { t: "6-8s", text: "Camera zooms back showing the entire {garment}." },
    ],
    defaultNarration: "Cada detalhe desse vestido transmite beleza, qualidade e um acabamento perfeito para momentos especiais.",
  },
  {
    id: "m6", n: 6, side: "back", title: "Mostrar o detalhe traseiro",
    summaryPt: "Manequim de costas. A câmera se aproxima, a mão {handPt} toca {backPt} e a câmera desce um pouco, mostrando o comprimento d{lowerPt} e a silhueta.",
    actions: [
      { t: "0-3s", text: "Camera slowly approaches the back view." },
      { t: "3-6s", text: "A {hand} hand enters from the right and gently touches the {back} of the {garment}." },
      { t: "6-8s", text: "Camera moves slightly downward showing the {lower} length and silhouette." },
    ],
    defaultNarration: "A parte de trás desse vestido revela detalhes encantadores que deixam a peça ainda mais elegante e exclusiva.",
  },
  {
    id: "m7", n: 7, side: "back", title: "Ajeitar o detalhe das costas",
    summaryPt: "A câmera foca na parte de cima das costas, a mão {handPt} ajeita {backPt} e a câmera se afasta devagar, revelando a peça inteira.",
    actions: [
      { t: "0-2s", text: "Camera focuses on the back upper area." },
      { t: "2-5s", text: "Hand gently adjusts the {back}." },
      { t: "5-8s", text: "Camera slowly moves away revealing the full {garment}." },
    ],
    defaultNarration: "O charme desse modelo aparece nos detalhes das costas, trazendo um toque feminino e muito sofisticado.",
  },
  {
    id: "m8", n: 8, side: "back", title: "Tecido em movimento",
    summaryPt: "Vista de costas, corpo inteiro. A mão {handPt} levanta a lateral d{lowerPt} um pouco e solta: o tecido cai com naturalidade, mostrando leveza e movimento.",
    actions: [
      { t: "0-3s", text: "Full back view." },
      { t: "3-6s", text: "Hand gently lifts the side of the {lower} slightly." },
      { t: "6-8s", text: "Fabric falls naturally showing softness and movement." },
    ],
    defaultNarration: "O tecido acompanha cada movimento com leveza, criando um vestido confortável e perfeito para várias ocasiões.",
  },
  {
    id: "m9", n: 9, side: "back", title: "Câmera descendo",
    summaryPt: "A câmera começa na altura dos ombros e desce devagar mostrando toda a silhueta das costas, até parar na peça completa. Sem mão neste vídeo.",
    actions: [
      { t: "0-3s", text: "Camera starts at shoulder level." },
      { t: "3-6s", text: "Camera slowly travels downward showing the entire back silhouette." },
      { t: "6-8s", text: "Camera stops showing the complete {garment}." },
    ],
    defaultNarration: "Esse vestido chama atenção pela elegância do corte e pela forma como valoriza a beleza feminina.",
  },
  {
    id: "m10", n: 10, side: "back", title: "Apresentação final premium",
    summaryPt: "Aproximação lenta e cinematográfica por trás, a mão {handPt} toca o tecido e a câmera se afasta devagar, numa apresentação final de boutique.",
    actions: [
      { t: "0-3s", text: "Slow cinematic approach from back." },
      { t: "3-5s", text: "Hand gently touches the fabric." },
      { t: "5-8s", text: "Camera slowly pulls away creating a premium boutique presentation." },
    ],
    defaultNarration: "Uma peça sofisticada, com acabamento impecável e aquele visual marcante que transforma qualquer produção.",
  },
];
