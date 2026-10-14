import type { StyleId } from "./styles";

export type GalleryKind = "image" | "video";

export interface GalleryPrompt {
  id: string;
  kind: GalleryKind;
  title: string;
  description: string;
  prompt: string;
  styles: StyleId[];
}

const ID =
  "Keep the person from the reference image exactly as shown: same face, skin tone, facial features, hairstyle, hair color, body proportions and outfit. Do not redesign, age or beautify them.";
const REAL =
  "Ultra-realistic smartphone look: natural skin texture with visible pores, true-to-life colors, soft natural light, no beauty filter, no plastic skin.";
export const SILENT = "Audio: none. No speech, no music, no sound effects. Silent video, movement only.";
export const CLEAN = "No text, captions, subtitles, stickers, emojis, logos, watermarks, UI elements or shopping icons.";

function vid(id: string, title: string, description: string, styles: StyleId[], scene: string, motion: string, camera: string): GalleryPrompt {
  return {
    id,
    kind: "video",
    title: `${title} (Vídeo)`,
    description,
    styles,
    prompt: `Create a 6-second ultra-realistic vertical 9:16 video.\n\n${ID}\n\nScene:\n${scene}\n\nMotion:\n${motion}\n\nCamera:\n${camera}\n\n${REAL}\n\n${SILENT}\n${CLEAN}`,
  };
}

function img(id: string, title: string, description: string, styles: StyleId[], scene: string, pose: string): GalleryPrompt {
  return {
    id,
    kind: "image",
    title: `${title} (Imagem)`,
    description,
    styles,
    prompt: `Create an ultra-realistic vertical 9:16 photograph.\n\n${ID}\n\nScene:\n${scene}\n\nPose and framing:\n${pose}\n\n${REAL}\n${CLEAN}`,
  };
}

const BEDROOM = "a bright, tidy Brazilian bedroom with natural window light and a neatly made bed";
const LIVING = "a cozy Brazilian living room with a sofa, soft daylight and a few plants";
const STORE = "a modern clothing store with racks softly blurred in the background and warm retail lighting";
const GYM = "a clean, well-lit gym with equipment softly blurred in the background";
const STATIC_CAM = "Static smartphone camera on a tripod, eye level, subject centered, slight natural handheld micro-movement.";
const LIGHT_HAND = "Very light handheld-style stabilization, casual lifestyle recording feel.";

/**
 * Galeria de prompts. Os títulos seguem os da galeria mostrada na gravação de tela;
 * os textos foram escritos para este app (a gravação só mostra trechos), então servem de ponto de partida.
 */
export const GALLERY: GalleryPrompt[] = [
  img("pacote-img", "Segurando pacote de TikTok Shop", "Apresentação realista segurando um pacote de entrega estilo TikTok Shop.", ["ugc"],
    LIVING, "Medium shot from the waist up. The person holds a white-and-grey delivery mailer bag in both hands toward the camera, covering any shipping data with their fingers, with a genuine smile."),
  vid("pacote-vid", "Segurando pacote de TikTok Shop", "Vídeo realista caminhando com pacote de entrega, cobrindo os dados de envio.", ["ugc"],
    LIVING, "The person walks toward the camera holding a delivery mailer bag in front of their chest, fingers covering the shipping label, then stops and gives a small proud nod.", LIGHT_HAND),
  vid("tapar-camera", "Tapar a câmera para transição", "Caminha em direção à câmera e tampa a lente para efeito de transição.", ["ugc", "provador"],
    BEDROOM, "The person walks confidently toward the camera and covers the whole lens with the palm of one hand, filling the frame with black for the final half second.", "Static camera, eye level. The hand must cover 100% of the lens at the end for a clean transition."),
  vid("movimento-fashion", "Movimento fashion", "Movimento fashion fluido com toques delicados na roupa e poses variadas.", ["ugc", "provador"],
    BEDROOM, "Fluid fashion movement: a slow weight shift, delicate fingertip touches on the garment hem and waist, then a change to a different relaxed pose. Natural, never stiff.", STATIC_CAM),
  vid("mostrar-look-cta", "Mostrar look + CTA", "Apresentação natural do look com CTA de apontar no final.", ["ugc"],
    BEDROOM, "The person presents the full look with a small natural turn, smiles genuinely only at the moment of the gesture, and ends pointing downward toward the camera as a call to action.", STATIC_CAM),
  vid("cta-apontar", "CTA apontando para baixo", "CTA com sorriso cativante, apontando para baixo no final.", ["ugc"],
    LIVING, "Direct eye contact with the camera. Closed-mouth, warm smile. One arm extends toward the lower center of the frame and the index finger points downward, held steady for one second, then relaxes.", STATIC_CAM),
  vid("movimento-natural", "Movimento natural", "Movimento corporal contínuo e natural, sem rotação ou congelamento.", ["ugc", "provador"],
    BEDROOM, "Continuous natural movement: subtle lateral steps, small shoulder shifts and a gentle hair touch. No rotation, no freezing, no sudden actions.", "Slow dolly-in, subtle and smooth."),
  vid("olhar-lento", "Olhar lento no look", "Olhar lento descendo pelo look, com sorriso breve e natural.", ["provador"],
    STORE, "The person looks down slowly along their outfit, then lifts their eyes back to the camera with a brief natural smile.", STATIC_CAM),
  vid("giro-360", "Giro lento 360 controlado", "Rotação 360° lenta, mostrando o look de diferentes ângulos no mesmo lugar.", ["provador"],
    BEDROOM, "A slow, controlled 360-degree turn in place, arms relaxed, showing the garment from the front, side, back and side again. The garment keeps its fit and drape throughout.", STATIC_CAM),
  vid("mao-cintura", "Mão na cintura + movimento leve", "Mão na cintura com deslocamentos laterais e frontais sutis.", ["provador", "ugc"],
    BEDROOM, "One hand on the waist, small lateral and frontal weight shifts, a light sway of the hips, relaxed confident expression.", STATIC_CAM),
  vid("foco-look", "Foco no look", "Apresentação natural com atenção ao caimento e à textura da roupa.", ["provador"],
    STORE, "The person stands still and lets the camera do the work: a gentle push-in from the outfit's hem up to the face, with only a tiny breathing movement and one slow blink.", "Slow dolly-in from the waist down to the face. Smooth, no shaking."),
  vid("movimento-cabelo", "Movimento no cabelo", "Mão no cabelo com fluidez natural, passando e soltando os fios.", ["ugc"],
    BEDROOM, "The person runs one hand through their hair and lets it fall back naturally, hair moving with realistic physics. A soft micro-smile forms.", STATIC_CAM),
  img("espelho-academia", "Espelho na academia", "Selfie no espelho da academia, realista e com detalhes de textura da pele.", ["ugc", "provador"],
    GYM, "Full-body mirror selfie, phone held at chest height, slight lean on one hip, natural gym lighting, visible skin texture."),
  img("espelho-provador", "Espelho provador", "Selfie no espelho do provador, look e roupa em destaque.", ["provador", "ugc"],
    `${STORE}, inside a fitting room with a large mirror`, "Mirror selfie, phone at chest height, outfit fully visible head to toe, relaxed standing pose, soft fitting-room light."),
  img("espelho-lateral", "Espelho com pose lateral na academia", "Foto de corpo quase inteiro no espelho, girando levemente de costas.", ["provador"],
    GYM, "Near full-body mirror photo in a side pose, torso turned slightly away from the mirror, showing the back of the outfit, phone visible in hand."),
  img("foto-espelho-v1", "Foto no espelho V1", "Mirror selfie / lifestyle portrait, corpo todo.", ["ugc"],
    BEDROOM, "Full-body mirror selfie in a standard Brazilian bedroom, wide-angle phone lens, casual stance, natural daylight."),
  img("foto-espelho-v2", "Foto no espelho V2", "Close-up de selfie no espelho com características naturais.", ["ugc"],
    BEDROOM, "Close-up mirror selfie from the chest up, subtle natural features and imperfections, phone covering part of the lower face edge, soft window light."),
  img("selfie-carro", "Selfie no carro - Influencer", "Selfie dentro do carro, luz natural entrando pela janela.", ["ugc"],
    "the driver's seat of a parked car with daylight coming through the window", "POV selfie with the arm extended, medium close-up, seatbelt visible, relaxed natural expression."),
  img("corpo-todo", "Corpo todo", "Corpo inteiro em quarto brasileiro comum, lente grande angular.", ["provador"],
    BEDROOM, "Full-body shot, wide-angle phone lens, the whole outfit visible from head to shoes, standing naturally."),
  img("selfie-restaurante", "Selfie no restaurante", "Selfie casual em restaurante com luz ambiente quente.", ["ugc"],
    "a casual restaurant with warm ambient light and softly blurred tables", "Seated selfie with the arm extended, medium close-up, relaxed smile, a drink on the table."),
  img("estilo-vida", "Estilo de vida", "Imagem lifestyle ultra-realista.", ["ugc"],
    LIVING, "Candid lifestyle shot, the person caught mid-moment laughing softly, looking slightly off camera, natural posture."),
  img("pele-real", "Pele real e imperfeições", "Rosto ultra-realista com textura natural de pele.", ["ugc"],
    "soft daylight near a window", "Close-up portrait with true skin texture: visible pores, tiny natural asymmetries, no retouching and no smoothing."),
  vid("espelho-textura", "Espelho Textura", "Selfie no espelho com ênfase na textura do tecido.", ["provador"],
    `${BEDROOM}, with a large mirror`, "Mirror selfie. The person gently touches the fabric of the outfit with the free hand to show its texture, then lets the hand rest.", LIGHT_HAND),
  vid("espelho-relax", "Espelho Relax", "Selfie no espelho com mãos nos bolsos e expressão relaxada.", ["provador", "ugc"],
    `${BEDROOM}, with a large mirror`, "Mirror selfie. Hands casually in pockets, relaxed confident expression, a small shift of weight from one leg to the other.", LIGHT_HAND),
  vid("levantamento-terra", "Levantamento terra academia", "Vídeo de academia com movimento controlado e realista.", ["ugc"],
    GYM, "The person performs one slow controlled deadlift repetition with correct, safe form, the outfit's fabric moving naturally with the body.", "Medium wide shot from the side, static, at hip height."),
  vid("desvio-lateral", "Desvio lateral lento", "Câmera com desvio lateral sutil enquanto a pessoa se mantém natural.", ["provador", "ugc"],
    BEDROOM, "The person stays mostly still with natural micro-movements while a very subtle camera drift reveals the outfit from slightly different angles.", "Extremely subtle lateral camera drift from left to right with very light handheld-style stabilization."),
  vid("assimetrico", "Foco de movimento assimétrico", "Movimento intencionalmente assimétrico, com acessórios em destaque.", ["provador"],
    BEDROOM, "Intentionally asymmetrical movement: one hip slightly forward, one shoulder relaxed lower. A very subtle change in facial expression over time and a soft micro-smile that forms naturally. Accessory movement emphasized through gravity and inertia.", LIGHT_HAND),
  vid("arrumando-cabelo", "Arrumando o cabelo", "Gesto delicado arrumando o cabelo, com olhar confiante.", ["ugc"],
    BEDROOM, "The person subtly adjusts their hair with a delicate arm lift and soft head tilt, then returns to a confident, inviting gaze.", STATIC_CAM),
  vid("toque-tecido", "Toque sutil no tecido", "A pessoa toca o tecido do produto, transmitindo maciez e qualidade.", ["provador", "ugc"],
    BEDROOM, "The person gently touches and smooths the fabric of the garment, conveying softness and quality, then looks to the camera.", "Medium close-up, static, subtle zoom to highlight the texture."),
  vid("produto-rosto", "Passando produto no rosto", "Close médio aplicando um produto de skincare no rosto.", ["ugc"],
    "a bright bathroom with a mirror and soft daylight", "Medium close-up handheld shot of the person applying a skincare product to one cheek with their fingertips, blending it gently, then smiling softly.", LIGHT_HAND),
  vid("pov-capinha", "POV - Capinha", "POV de uma mão segurando o celular com a capinha em destaque.", ["pov"],
    "a cozy bedroom, soft light", "Point-of-view of a woman's hand delicately holding a smartphone with a phone case, turning it slowly to show the print, edges and buttons.", "POV, arm extended perspective, close-up on the case, soft handheld motion."),
  vid("pov-pequeno", "POV - Produto pequeno", "POV segurando um produto pequeno em destaque, girando para mostrar detalhes.", ["pov"],
    "a clean tabletop in soft window light", "Hands hold a small product up to the camera, rotate it slowly to show every side, then place it on the table.", "POV macro-leaning close-up, shallow depth of field, steady."),
  vid("pov-cabide", "POV - Cabide", "POV pegando uma peça de roupa no cabide, mostrando o caimento.", ["pov"],
    STORE, "Hands take a hanger from the rack, lift the garment toward the camera, let it hang and show the fabric and finishing details.", "POV at chest height, smooth reveal."),
  vid("pov-sapatos", "POV - Sapatos", "POV de produto segurado por mãos, com o outro par nos pés.", ["pov"],
    "a living room floor with a black shag rug", "Seated POV: hands hold one shoe close to the camera while the other shoe is worn on the foot, then the hands rotate the shoe to show the sole and the side.", "POV from above, both legs visible in the lower frame, steady."),
  img("pov-sapatos-img", "POV - Sapatos", "POV sentado com um tênis na mão e o outro no pé.", ["pov"],
    "a living room floor with a black shag rug and a shoebox in the background", "POV photograph from above: one hand holds the shoe near the camera while the other shoe is on the foot, both legs visible in the lower part of the frame."),
  vid("dancinha", "Dancinha", "Dancinha leve, focada na parte superior do corpo.", ["ugc"],
    BEDROOM, "A light, natural dance with rhythmic shoulder bouncing and small arm movements, focus on the upper body, smiling.", STATIC_CAM),
  vid("ritmico-apontar", "Movimento rítmico + Apontar", "Frontal UGC com movimento rítmico terminando em CTA.", ["ugc"],
    BEDROOM, "Frontal UGC shot. Rhythmic movement ending in a CTA: both hands point downward toward the camera in the last second.", STATIC_CAM),
  vid("energia-alta", "Energia alta (Promoções rápidas)", "Frontal UGC de alta energia, sem falar.", ["ugc"],
    LIVING, "Frontal UGC shot, high energy: quick head tilts, fast confident hand gestures and bright expressions. No mouth movement.", STATIC_CAM),
  vid("selfie-pensativo", "Selfie pensativo", "Apenas movimentos sutis de olhar e expressão em selfie.", ["ugc"],
    BEDROOM, "Selfie angle. A thoughtful look off to the side, then back to camera with a small smile. Subtle head movement only, no mouth movement.", "POV selfie, arm extended, very slight handheld motion."),
  vid("selfie-cabelo", "Selfie cabelo", "Selfie passando a mão no cabelo, movimentos leves.", ["ugc"],
    BEDROOM, "Selfie angle. The person lightly tousles their hair with one hand and settles it, with a relaxed smile.", "POV selfie, arm extended, very slight handheld motion."),
  vid("convite-amigavel", "Convite amigável", "Passa confiança e convida o espectador de forma leve.", ["ugc"],
    LIVING, "The person makes a friendly welcoming gesture with an open palm toward the camera, then points downward with a warm smile.", STATIC_CAM),
  vid("dancinhas-ritmicas", "Dancinhas e movimentos rítmicos", "Engajamento mostrando o movimento da roupa no corpo.", ["provador", "ugc"],
    BEDROOM, "Rhythmic body movements that show how the garment moves with the body: small hip sways, a light twirl and a shoulder bounce.", STATIC_CAM),
  vid("revelacao", "Revelação e admiração", "Mostra o look completo com uma transição fluida.", ["provador", "ugc"],
    BEDROOM, "The person starts partly turned away, turns toward the camera revealing the full look, then glances down at the outfit in admiration.", STATIC_CAM),
  vid("destaque-tecido", "Destaque de tecido", "Close-up com foco na textura e na qualidade do material.", ["provador"],
    BEDROOM, "A close-up of the garment while one hand gently pinches and releases the fabric near the waist, showing its stretch and weave.", "Close-up, static, shallow depth of field."),
  vid("cta-carrinho", "CTA Carrinho Laranja", "Convida o espectador a clicar no carrinho laranja, apontando para baixo.", ["ugc", "provador"],
    LIVING, "The person smiles at the camera and points downward twice with the index finger, as a call to action to tap the shopping cart below the video. No cart or icon is drawn in the scene.", STATIC_CAM),
  vid("giro-lento-look", "Giro lento no look", "Meio giro lento mostrando o look de frente e de lado, com sorriso breve.", ["provador"],
    BEDROOM, "A slow half turn showing the outfit from the front and then from the side, a brief natural smile, then back to face the camera.", STATIC_CAM),
];

