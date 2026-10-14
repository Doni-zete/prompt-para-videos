export type StyleId = "ugc" | "pov" | "provador";

export interface StyleMeta {
  id: StyleId;
  title: string;
  description: string;
  /** Estilos que mostram uma pessoa usam um avatar; POV mostra só as mãos. */
  usesAvatar: boolean;
  hue: number;
}

/** Os três formatos da tela "Escolha o estilo do seu vídeo". */
export const STYLES: StyleMeta[] = [
  { id: "ugc", title: "UGC", description: "Avatar humanizado apresentando produtos de forma natural e persuasiva.", usesAvatar: true, hue: 212 },
  { id: "pov", title: "POV", description: "Vídeos em primeira pessoa mostrando o produto sem aparecer.", usesAvatar: false, hue: 232 },
  { id: "provador", title: "Provador", description: "Exibição realista do caimento da roupa em movimento.", usesAvatar: true, hue: 252 },
];

export const getStyle = (id: string | undefined): StyleMeta | undefined => STYLES.find((s) => s.id === id);
