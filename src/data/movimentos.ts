import type { LibraryItem } from "./types";

const IDENTITY =
  "Create a hyper-realistic video based on the reference image. Preserve the woman's identity exactly as shown: same face, skin tone, facial features, hairstyle, hair color, body proportions, outfit, jewelry, and overall appearance. Preserve the exact environment, lighting, colors, camera angle, and atmosphere from the reference image.";

const RESTRICTIONS =
  "Visual restrictions:\n* No text.\n* No captions.\n* No subtitles.\n* No stickers.\n* No emojis.\n* No graphics.\n* No icons.\n* No TikTok interface or shopping cart.\n* No overlays.\n* No watermarks.";

const SILENT = "Audio:\nNo speech. No music. No sound effects. Silent video.";

const LIGHT = "Lighting:\nMaintain the exact lighting from the reference image. Consistent exposure and color. Natural shadows and realistic skin reflections.";

const mk = (id: string, title: string, motion: string, hue: number, emoji: string): LibraryItem => ({
  id: `mov-${id}`,
  title,
  prompt: `${IDENTITY}\n\n${motion}\n\n${LIGHT}\n\n${RESTRICTIONS}\n\n${SILENT}\n\nStatic camera. Single continuous shot.`,
  obs: "Use no Flow com a imagem da influencer (Frames ou Elementos). Troque a descrição do produto se necessário.",
  cover: { tag: title, emoji, hue },
  draft: true,
  source: "builtin",
});

/** "Movimentos Especiais": prompts de gestos reutilizáveis (reconstruídos de trechos do vídeo). */
export const MOVIMENTOS: LibraryItem[] = [
  mk("blusa", "Mostrando a blusa/camiseta",
    "Motion:\nThe woman looks at the camera with a natural, closed-mouth smile. With both hands she gently holds the hem of the top and lifts it slightly toward the camera, turning it a few degrees to show the fabric and fit, then lets it fall back naturally. Calm, confident, TikTok creator behavior.",
    330, "👚"),
  mk("apontando-v2", "Apontando para baixo V2",
    "Motion:\nThe woman maintains direct eye contact with the camera and a warm, natural closed-mouth smile throughout the entire video. One arm is extended toward the lower center of the frame. Her hand is positioned closer to the camera lens, naturally creating depth and perspective. Her index finger points downward, held steady, then relaxes.",
    300, "👇"),
  mk("encostando", "Encostando a peça de roupa",
    "Motion:\nA hand enters the frame and gently presses the garment against the surface, smoothing it once from top to bottom to show the texture of the fabric. The hand exits. Do not show the face. Do not show any hanger or hook in the final frame.",
    25, "🧥"),
  mk("apontando", "Apontando para baixo",
    "Motion:\nThe woman immediately walks toward the camera with a gentle CLOSED-MOUTH smile. She keeps her lips firmly together during the entire video. When she is close to the lens she points downward with her index finger and holds the gesture for one second.",
    340, "☝️"),
  mk("mostrando-apontando", "Mostrando e apontando",
    "Motion:\nThe woman presents the outfit with a small turn to each side, lifts the hem of the garment lightly with one hand, then points downward with the other hand. Sharp but natural reversals of direction. High-energy TikTok Shop creator behavior.",
    190, "💃"),
  mk("vestido", "Mostrando o vestido",
    "Motion:\nThe woman holds the dress up in front of her body, then opens her arms to let the skirt fall and sway naturally. Realistic fabric physics. TIMING: the dress must completely cover 100% of the screen within the first 1.5 seconds of the video and remain covering the lens until the video ends.",
    260, "👗"),
  mk("palma", "Palma da mão na tela",
    "Motion:\nThe woman raises one open palm toward the camera and presses it gently against the lens, then slides it away to reveal the finished look. Keep her bracelets, rings and necklace exactly as in the reference image.",
    210, "🖐️"),
];
