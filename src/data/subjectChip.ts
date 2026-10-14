import type { SubjectKind } from "../lib/veo/briefing";

/** Rótulo curto, em português, de quem aparece em cada vídeo. */
export const SUBJECT_CHIP: Record<SubjectKind, string> = {
  none: "Só o produto",
  hands: "Aparecem as mãos",
  woman: "Aparece uma mulher",
  man: "Aparece um homem",
  pet: "Aparece um animal",
  faceless: "Pessoa sem rosto",
  feet: "Aparecem os pés",
  two: "Aparecem duas pessoas",
};
