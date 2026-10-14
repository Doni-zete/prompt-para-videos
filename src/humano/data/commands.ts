export type Mode = "image" | "video";

export interface Category {
  id: string;
  label: string;
  /** Categorias que só fazem sentido em um modo. */
  only?: Mode;
}

export interface Command {
  id: string;
  category: string;
  title: string;
  desc: string;
  /** Trecho (em inglês, para os geradores de imagem e vídeo) que entra no prompt. */
  text: string;
  modes: Mode[];
}

export const CATEGORIES: Category[] = [
  { id: "rosto", label: "Rosto e pele" },
  { id: "corpo", label: "Corpo" },
  { id: "dispositivo", label: "Dispositivo" },
  { id: "edicao", label: "Edição" },
  { id: "iluminacao", label: "Iluminação" },
  { id: "movimento", label: "Movimento", only: "video" },
  { id: "outros", label: "Outros" },
];

const both: Mode[] = ["image", "video"];
const c = (id: string, category: string, title: string, desc: string, text: string, modes: Mode[] = both): Command => ({ id, category, title, desc, text, modes });

/** Comandos de realismo. Os textos foram escritos para este app. */
export const COMMANDS: Command[] = [
  c("micro-movimentos", "rosto", "Micro movimentos faciais", "Expressões naturais feitas pelo rosto", "Subtle natural facial micro-movements: small eyebrow shifts, a brief squint, the lips relaxing and tensing between expressions", ["video"]),
  c("textura-pele", "rosto", "Textura de pele real", "Poros, pelos finos e pequenas imperfeições", "Real skin texture with visible pores, fine vellus hair, faint blemishes, uneven skin tone and slight redness around the nose, no airbrushing"),
  c("assimetria", "rosto", "Assimetria natural do rosto", "Rosto sem simetria perfeita", "Naturally asymmetrical face, one eyebrow slightly higher than the other, an uneven smile"),
  c("olhar-natural", "rosto", "Olhar sem posar", "Não encara a câmera", "Not posing for the camera, gaze drifting naturally to the side or off-screen"),
  c("cabelo-real", "rosto", "Cabelo imperfeito", "Fios soltos e volume irregular", "Slightly messy hair with flyaway strands, uneven volume and natural frizz"),
  c("maquiagem-leve", "rosto", "Maquiagem leve", "Sem acabamento de estúdio", "Minimal everyday makeup, no studio finish, no contouring or heavy highlighter"),

  c("postura", "corpo", "Postura relaxada", "Peso em uma perna, ombros desiguais", "Relaxed asymmetric posture, weight on one leg, shoulders slightly uneven"),
  c("maos", "corpo", "Mãos naturais", "Cinco dedos e proporções reais", "Anatomically correct hands with five fingers, natural knuckles and realistic proportions, holding things casually"),
  c("roupa-real", "corpo", "Roupa com dobras reais", "Amassados e caimento natural", "Clothing with real wrinkles, creases and natural fabric drape, a slightly twisted strap or collar"),
  c("proporcoes", "corpo", "Proporções não idealizadas", "Corpo comum, sem filtro de beleza", "Ordinary non-idealized body proportions, no exaggerated curves, no perfect symmetry"),

  c("celular", "dispositivo", "Câmera de celular", "Lente grande-angular de smartphone", "Shot on a smartphone with a wide-angle lens, slightly stretched edges, portrait mode off"),
  c("ruido", "dispositivo", "Ruído de sensor", "Grão nas áreas escuras", "Visible sensor noise in the shadows and mild processing artifacts typical of phone cameras"),
  c("selfie-frontal", "dispositivo", "Câmera frontal (selfie)", "Distância de braço esticado", "Front-facing selfie camera look at arm's length, slightly low-resolution detail"),
  c("flash", "dispositivo", "Flash do celular", "Luz direta e sombra dura atrás", "On-camera phone flash with direct light, a hard shadow behind the subject and slightly blown highlights"),
  c("estabilizacao", "dispositivo", "Estabilização imperfeita", "Tremor leve de mão", "Imperfect handheld stabilization with slight rolling-shutter wobble", ["video"]),

  c("sem-retoque", "edicao", "Sem retoque", "Nada de filtro ou suavização", "No retouching, no beauty filter, no skin smoothing, no HDR look"),
  c("granulado", "edicao", "Granulação leve", "Textura de foto real", "Light natural film-like grain across the whole frame"),
  c("cor-neutra", "edicao", "Cores sem exagero", "Saturação e contraste naturais", "Natural muted colors, no oversaturation, no heavy contrast, a slightly imperfect white balance"),
  c("compressao", "edicao", "Compressão de rede social", "Qualidade de imagem repostada", "Mild social-media compression artifacts as if reposted, slightly soft details"),
  c("aberracao", "edicao", "Aberração cromática sutil", "Franjas de cor nas bordas", "Subtle chromatic aberration and slight lens flare on bright edges"),

  c("luz-janela", "iluminacao", "Luz natural de janela", "Luz suave vinda de um lado", "Soft natural window light from one side with gentle falloff"),
  c("luz-mista", "iluminacao", "Luz mista de ambiente", "Lâmpada quente + luz do dia", "Mixed ambient lighting, warm indoor bulbs combined with cooler daylight"),
  c("sol-duro", "iluminacao", "Sol direto", "Sombras duras e brilho na pele", "Direct midday sun with hard shadows, a slight shine on the skin and squinting eyes"),
  c("contraluz", "iluminacao", "Contraluz leve", "Estouro de luz atrás do sujeito", "Mild backlight with slightly blown background highlights and a soft rim around the hair"),
  c("sem-estudio", "iluminacao", "Sem luz de estúdio", "Nada de softbox ou rim light", "No studio lighting, no softbox, no cinematic color grading"),

  c("camera-mao", "movimento", "Câmera na mão", "Tremor e reenquadramentos", "Handheld camera with subtle shake, small reframing and slow drift", ["video"]),
  c("gestos-unicos", "movimento", "Gestos que não se repetem", "Cada movimento é diferente", "Natural gestures that never repeat, each movement slightly different from the last", ["video"]),
  c("motion-blur", "movimento", "Desfoque de movimento", "24 fps com blur natural", "24fps motion blur on quick movements, natural shutter look", ["video"]),
  c("foco-oscila", "movimento", "Foco que oscila", "A câmera ajusta o foco", "Autofocus that occasionally hunts and refocuses on the subject", ["video"]),
  c("ignora-camera", "movimento", "Pessoa ignora a câmera", "Como se não soubesse que filmam", "The person is unaware of being filmed and never looks directly at the camera", ["video"]),

  c("fundo-real", "outros", "Fundo com vida real", "Bagunça e objetos do dia a dia", "Lived-in background with everyday clutter and ordinary objects, nothing styled"),
  c("pessoas-fundo", "outros", "Pessoas ao fundo", "Figurantes desfocados", "Unposed bystanders softly out of focus in the background"),
  c("composicao-casual", "outros", "Composição casual", "Fora do centro, corte imperfeito", "Casual off-center composition, slightly tilted horizon and imperfect cropping"),
  c("sem-texto", "outros", "Sem texto ou marca", "Nada de legenda, logo ou marca d'água", "No text, captions, logos or watermarks"),
];

export const categoriesFor = (mode: Mode): Category[] => CATEGORIES.filter((k) => !k.only || k.only === mode);
export const commandsIn = (mode: Mode, category: string): Command[] => COMMANDS.filter((x) => x.category === category && x.modes.includes(mode));
