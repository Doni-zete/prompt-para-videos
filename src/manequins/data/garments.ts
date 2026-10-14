export type GarmentId = "vestido" | "saia" | "blusa" | "calca" | "short" | "conjunto" | "macacao" | "jaqueta";

export interface Garment {
  id: GarmentId;
  label: string;
  /** Como a peça é chamada no prompt (inglês). */
  en: string;
  /** Detalhe que o prompt manda preservar (ex.: "neckline"). */
  lock: string;
  upper: string;
  lower: string;
  waist: string;
  neck: string;
  back: string;
  /** Vocabulário em português, usado nas explicações. */
  pt: string;
  upperPt: string;
  lowerPt: string;
  waistPt: string;
  neckPt: string;
  backPt: string;
}

/** Cada peça tem o seu vocabulário: o vestido tem saia e decote; a calça tem cós e pernas; etc. */
export const GARMENTS: Garment[] = [
  { id: "vestido", label: "Vestido", en: "dress", lock: "neckline", upper: "upper fabric area", lower: "skirt", waist: "waist seam", neck: "neckline and bodice", back: "back detail (bow, zipper or cut)", pt: "vestido", upperPt: "a parte de cima do tecido", lowerPt: "a saia", waistPt: "a costura da cintura", neckPt: "o decote e o corpete", backPt: "o detalhe das costas (laço, zíper ou recorte)" },
  { id: "saia", label: "Saia", en: "skirt", lock: "waistband", upper: "waistband area", lower: "skirt", waist: "waistband", neck: "waistband and top seam", back: "back seam and zipper", pt: "saia", upperPt: "a região do cós", lowerPt: "a saia", waistPt: "o cós", neckPt: "o cós e a costura de cima", backPt: "a costura e o zíper de trás" },
  { id: "blusa", label: "Blusa ou camisa", en: "top", lock: "neckline", upper: "upper fabric area", lower: "lower hem", waist: "side seam", neck: "neckline and shoulders", back: "back detail of the top", pt: "blusa", upperPt: "o tecido da parte de cima", lowerPt: "a barra", waistPt: "a costura lateral", neckPt: "o decote e os ombros", backPt: "o detalhe das costas" },
  { id: "calca", label: "Calça", en: "pants", lock: "waistband", upper: "waistband area", lower: "pant legs", waist: "waistband", neck: "waistband and pockets", back: "back pockets and seam", pt: "calça", upperPt: "a região do cós", lowerPt: "as pernas da calça", waistPt: "o cós", neckPt: "o cós e os bolsos", backPt: "os bolsos e a costura de trás" },
  { id: "short", label: "Short", en: "shorts", lock: "waistband", upper: "waistband area", lower: "shorts legs", waist: "waistband", neck: "waistband and pockets", back: "back pockets and seam", pt: "short", upperPt: "a região do cós", lowerPt: "as pernas do short", waistPt: "o cós", neckPt: "o cós e os bolsos", backPt: "os bolsos e a costura de trás" },
  { id: "conjunto", label: "Conjunto", en: "two-piece set", lock: "neckline", upper: "upper piece fabric", lower: "lower piece", waist: "waist area where the two pieces meet", neck: "neckline of the upper piece", back: "back detail of the set", pt: "conjunto", upperPt: "o tecido da peça de cima", lowerPt: "a peça de baixo", waistPt: "a cintura, onde as duas peças se encontram", neckPt: "o decote da peça de cima", backPt: "o detalhe das costas" },
  { id: "macacao", label: "Macacão", en: "jumpsuit", lock: "neckline", upper: "bodice area", lower: "pant legs", waist: "waist seam", neck: "neckline and bodice", back: "back detail of the jumpsuit", pt: "macacão", upperPt: "a parte de cima", lowerPt: "as pernas", waistPt: "a costura da cintura", neckPt: "o decote e o corpete", backPt: "o detalhe das costas" },
  { id: "jaqueta", label: "Jaqueta", en: "jacket", lock: "collar", upper: "collar and shoulders", lower: "lower hem", waist: "side seams", neck: "collar and front closure", back: "back panel", pt: "jaqueta", upperPt: "a gola e os ombros", lowerPt: "a barra", waistPt: "as costuras laterais", neckPt: "a gola e o fecho da frente", backPt: "as costas" },
];

export const getGarment = (id: string): Garment => GARMENTS.find((g) => g.id === id) ?? GARMENTS[0];

export type ToneId = "peach" | "white" | "beige" | "brown" | "black";

export const TONES: { id: ToneId; label: string; en: string }[] = [
  { id: "peach", label: "Pêssego fosco", en: "smooth matte peach" },
  { id: "white", label: "Branco fosco", en: "smooth matte white" },
  { id: "beige", label: "Bege fosco", en: "smooth matte beige" },
  { id: "brown", label: "Marrom fosco", en: "smooth matte brown" },
  { id: "black", label: "Preto fosco", en: "smooth matte black" },
];

export const getTone = (id: string) => TONES.find((t) => t.id === id) ?? TONES[0];

export const defaultScene = (gender: "female" | "male"): string =>
  `Premium ${gender === "female" ? "women's" : "men's"} fashion boutique, warm wooden walls, clothing racks in background, soft retail lighting, realistic smartphone fashion video.`;
