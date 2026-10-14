import type { Mode } from "./commands";

export interface Preset {
  id: string;
  kind: Mode;
  title: string;
  /** Cena base (em inglês) que entra no início do prompt. */
  prompt: string;
}

/** Presets de cena. Os textos foram escritos para este app. */
export const PRESETS: Preset[] = [
  { id: "selfie-espelho", kind: "image", title: "[Imagem] Selfie no espelho", prompt: "Candid mirror selfie of an everyday person in a lived-in bedroom, phone held at chest height and partly covering the lower edge of the face, ordinary clothes, a slightly smudged mirror, unposed and unplanned" },
  { id: "retrato-rua", kind: "image", title: "[Imagem] Retrato na rua", prompt: "Candid street photo of a person on a busy city sidewalk, caught mid-step in daylight with passers-by and parked cars around, framed as if a friend took it on a phone" },
  { id: "restaurante", kind: "image", title: "[Imagem] Foto casual no restaurante", prompt: "Casual photo of a person seated at a restaurant table with food and drinks, warm ambient light, laughing at someone off-camera, taken by a friend across the table" },
  { id: "academia", kind: "image", title: "[Imagem] Foto na academia", prompt: "Casual gym photo of a person between sets, a towel around the neck, equipment in the background under fluorescent ceiling light, caught mid-breath" },
  { id: "sofa", kind: "image", title: "[Imagem] Foto em casa no sofá", prompt: "Relaxed photo of a person on a couch at home, a blanket and cushions slightly out of place, a lamp and the glow of a TV, unposed and comfortable" },
  { id: "carro", kind: "image", title: "[Imagem] Selfie no carro", prompt: "Quick selfie of a person in the driver's seat of a parked car, seatbelt on, daylight through the windshield, the dashboard visible, a slightly awkward angle" },

  { id: "vlog-caseiro", kind: "video", title: "[Vídeo] Vlog caseiro", prompt: "Handheld home vlog of a person talking to the camera in a living room, gesturing naturally while explaining something, a bookshelf and plants behind them, casual and a little rambling" },
  { id: "vlog-rua", kind: "video", title: "[Vídeo] Vlog na rua", prompt: "Handheld street vlog of a person walking along a busy sidewalk while talking to the camera, traffic and pedestrians around, wind in the hair, occasional glances at the surroundings" },
  { id: "bar", kind: "video", title: "[Vídeo] Captura casual no bar", prompt: "Candid handheld video of a person at a bar, never looking at the camera, in animated conversation with people off-screen, telling a story with expressive reactions" },
  { id: "selfie-falando", kind: "video", title: "[Vídeo] Selfie falando com a câmera", prompt: "Front-camera selfie video of a person speaking to their phone at arm's length, small natural pauses and head tilts, indoor light coming from a window" },
  { id: "unboxing", kind: "video", title: "[Vídeo] Unboxing em casa", prompt: "Handheld point-of-view video of a person unboxing a package on a table at home, tearing the tape, pulling out the product and reacting with a small genuine smile" },
  { id: "provador", kind: "video", title: "[Vídeo] Provador de loja", prompt: "Mirror video in a clothing-store fitting room, the person turning side to side checking how the outfit fits, hangers and a curtain visible, the phone held in one hand" },
];

export const presetsFor = (mode: Mode): Preset[] => PRESETS.filter((p) => p.kind === mode);
