import type { VideoSpec } from "../lib/veo/briefing";

export interface VideoCard extends VideoSpec {
  title: string;
  tag: string;
  em: string;
  hue: number;
  /** O que acontece no vídeo, em português simples. */
  resumo: string;
  /** O que cada clipe extra faz, em português (mesma ordem de `variants`). */
  variantsPt: string[];
}

/** Os 48 cards de "Prompts dos Vídeos do TikTok", no formato novo (produto idêntico à foto). A ordem define o id (video-0…). */
export const VIDEO_CARDS: VideoCard[] = [
  {
    "title": "Eletrodomésticos",
    "tag": "Prompt para <b>eletros</b>",
    "em": "🍹",
    "hue": 330,
    "scene": "a clean modern kitchen counter with the appliance sitting on it ready to use, soft daylight from a window",
    "subject": "hands",
    "action": "for the first 2 seconds the hands rest beside the product; then one hand performs this real use: [REAL USE: the single simplest real-use gesture of this appliance, e.g. pressing the power button]; in the last 3 seconds the product runs as it normally would and the hand steps away.",
    "variants": [
      "a hand lifts the lid or opens the door a few centimeters, shows the inside, and closes it again",
      "a hand turns the knob or dial one notch, the indicator light responds, then the hand lets go"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "nothing moves except the parts that move in real use",
    "note": "Troque [REAL USE] pelo gesto de uso mais simples do seu eletrodoméstico. O tamanho da embalagem muda a escala: use medidas reais em [SCALE LOCK].",
    "resumo": "Mãos ao lado do eletrodoméstico, na bancada da cozinha. Uma mão faz o gesto de uso mais simples dele (por exemplo, apertar o botão), o aparelho funciona do jeito normal e a mão sai.",
    "variantsPt": [
      "Uma mão levanta a tampa ou abre a porta alguns centímetros, mostra o interior e fecha de novo.",
      "Uma mão gira o botão um nível, a luz indicadora responde e a mão solta."
    ]
  },
  {
    "title": "Roupas Infantis",
    "tag": "Prompt <b>roupa infantil</b>",
    "em": "🧸",
    "hue": 300,
    "scene": "a bright tidy table covered with a pale cloth, the children's clothes laid out neatly, soft natural window light",
    "subject": "hands",
    "action": "for the first 2 seconds the hands rest near the garments; then they smooth the fabric once from top to bottom to show the print; in the last 3 seconds they lift one corner slightly and set it back exactly where it was.",
    "variants": [
      "the fingertips trace the print and one seam, then rest",
      "both hands lift the top piece a few centimeters to show the fabric texture, then lay it back"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "nothing tears, stretches out of shape, changes color or moves to another place",
    "note": "Se a foto tiver mais de uma peça, descreva todas em [VISUAL LOCK] e mantenha a mesma quantidade.",
    "resumo": "Mãos sobre uma mesa clara com as roupinhas dobradas. Alisam o tecido de cima para baixo para mostrar a estampa e, no fim, levantam uma ponta e devolvem ao mesmo lugar.",
    "variantsPt": [
      "As pontas dos dedos acompanham a estampa e uma costura, e descansam.",
      "As duas mãos levantam a peça de cima alguns centímetros para mostrar o tecido e a devolvem."
    ]
  },
  {
    "title": "Produtos Pet",
    "tag": "Prompt para <b>produtos pet</b>",
    "em": "🐱",
    "hue": 28,
    "scene": "a bright living-room floor at home, the product on the floor with the pet beside it, natural window light",
    "subject": "pet",
    "action": "for the first 2 seconds the animal keeps calmly looking at the product; then it approaches and sniffs it; in the last 3 seconds it starts using the product the way it is really meant to be used, calmly.",
    "variants": [
      "the animal steps onto or into the product and settles down, relaxed, looking at the camera",
      "the animal plays gently with the product using its front paws, then pauses and looks at the camera"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "nothing tears, crumbles, tips over or shifts position",
    "note": "Descreva o animal pelos traços visíveis (espécie, pelagem, manchas). Se a descrição do produto se contradisser sobre porte ou espécie, não afirme.",
    "resumo": "O animal está ao lado do produto, no chão da sala. Olha para ele com calma, se aproxima, cheira e começa a usar do jeito que o produto foi feito para ser usado.",
    "variantsPt": [
      "O animal sobe ou entra no produto e se acomoda, relaxado, olhando para a câmera.",
      "O animal brinca com o produto com as patinhas da frente e para, olhando para a câmera."
    ]
  },
  {
    "title": "Qualquer Brinquedo",
    "tag": "Prompt para <b>qualquer brinquedo</b>",
    "em": "🛩️",
    "hue": 210,
    "scene": "a colorful playful room, the toy on a low table, bright natural light",
    "subject": "hands",
    "action": "for the first 2 seconds adult hands hold the toy still; then they operate it the way it is really played with: [REAL USE: how this toy is played with]; in the last 3 seconds the toy performs its real function once and the hands step back.",
    "variants": [
      "the hands place the toy on the surface and release it so it performs its main action once",
      "one hand points at the main feature of the toy while the other shows how it moves"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "no part detaches, changes color or changes shape",
    "note": "Troque [REAL USE] pelo uso real do brinquedo. Mostre só o que ele realmente faz.",
    "resumo": "Mãos de adulto seguram o brinquedo parado, depois o usam do jeito que se brinca de verdade e, no final, o brinquedo faz a função principal uma vez.",
    "variantsPt": [
      "As mãos colocam o brinquedo na superfície e soltam, para ele fazer a ação principal uma vez.",
      "Uma mão aponta a função principal enquanto a outra mostra como ele se move."
    ]
  },
  {
    "title": "Capinha de Celular + Selfie no Espelho",
    "tag": "Capinha + <b>selfie</b> no espelho",
    "em": "🤳",
    "hue": 260,
    "scene": "a bright bedroom with a large mirror, a woman taking a mirror selfie with the phone case clearly visible",
    "subject": "woman",
    "action": "for the first 2 seconds she holds the phone still in front of the mirror with the case clearly visible; then she tilts the phone slightly left and right so the print catches the light; in the last 3 seconds she lowers the phone a little and looks at her reflection with a small smile.",
    "variants": [
      "she tilts the phone a few degrees to show the edge of the case, then returns it to the center",
      "she taps the back of the case lightly with one finger, then brings the phone back in front of the mirror"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the print, colors and edges of the case never change and the phone model never changes",
    "note": "Nesse formato, em vez de enviar duas imagens (pessoa e capinha), use UMA foto da pessoa segurando o celular com a capinha.",
    "resumo": "Uma mulher tira selfie no espelho com a capinha bem visível. Inclina o celular para os lados para a estampa pegar a luz e, no fim, abaixa um pouco o celular e sorri para o reflexo.",
    "variantsPt": [
      "Ela inclina o celular alguns graus para mostrar a borda da capinha e volta ao centro.",
      "Ela toca de leve a parte de trás da capinha com um dedo e leva o celular de volta ao espelho."
    ]
  },
  {
    "title": "Prompt Dinâmico para Móveis",
    "tag": "Prompt dinâmico <b>móveis</b>",
    "em": "🛋️",
    "hue": 35,
    "scene": "a living room with the furniture in its place, a person standing beside it, warm natural light",
    "subject": "woman",
    "action": "for the first 2 seconds she stands beside the furniture looking at it; then she uses it the way it is really used: [REAL USE: e.g. opens a drawer, sits down]; in the last 3 seconds she returns it to the starting state.",
    "variants": [
      "she places a few everyday objects on the furniture to show its size, then steps back",
      "she runs one hand along the surface to show the finish, then rests it"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the furniture stays rigid and in the same place, and nothing wobbles, changes color or changes size",
    "note": "Em móveis a escala é crítica: informe medidas reais (altura e largura) em [SCALE LOCK].",
    "resumo": "Uma pessoa ao lado do móvel, olhando para ele. Ela usa o móvel do jeito normal (abrir uma gaveta, sentar…) e, no fim, deixa tudo como estava.",
    "variantsPt": [
      "Ela coloca alguns objetos do dia a dia no móvel para mostrar o tamanho e se afasta.",
      "Ela passa a mão pela superfície para mostrar o acabamento e descansa a mão."
    ]
  },
  {
    "title": "UGC Dinâmico 2.0",
    "tag": "UGC dinâmico <b>2.0</b>",
    "em": "⚡",
    "hue": 190,
    "scene": "a bright bedroom, a woman holding the product in front of her, natural window light",
    "subject": "woman",
    "action": "for the first 2 seconds she holds the product at chest height looking at the camera; then she tilts it slightly toward the light to show its main feature: [REAL USE: the main feature to show]; in the last 3 seconds she brings it a little closer to the camera and back.",
    "variants": [
      "she nods with a pleased expression while pointing at the product with one finger",
      "she lifts the product to face level and lowers it slowly"
    ],
    "voice": "female",
    "speaking": "onscreen",
    "integrity": "the product keeps the same side facing the camera",
    "resumo": "Uma mulher segura o produto na altura do peito olhando para a câmera, inclina-o para a luz para mostrar a característica principal e o aproxima um pouco da câmera.",
    "variantsPt": [
      "Ela concorda com a cabeça, satisfeita, apontando o produto com um dedo.",
      "Ela leva o produto até a altura do rosto e abaixa devagar."
    ]
  },
  {
    "title": "No Face + Plus Size",
    "tag": "<b>No face</b> + plus size",
    "em": "👖",
    "hue": 15,
    "scene": "a bright bedroom, a woman framed from the chest down wearing the outfit, soft natural light",
    "subject": "faceless",
    "action": "for the first 2 seconds she stands still, framed from the chest down; then she shifts her weight and smooths the fabric along the hip; in the last 3 seconds she takes a small step in place so the fabric moves naturally.",
    "variants": [
      "she places a hand on her waist and slowly shifts her weight from one leg to the other",
      "she pulls the hem lightly with both hands and releases it"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the garment keeps the same fit, print and color and never rides up or changes shape",
    "note": "Enquadramento do peito para baixo, sem rosto, como na foto.",
    "resumo": "Mulher enquadrada do peito para baixo (sem rosto), com a roupa. Ela fica parada, alisa o tecido no quadril e dá um passinho no lugar para o tecido se mover.",
    "variantsPt": [
      "Ela põe a mão na cintura e passa o peso de uma perna para a outra devagar.",
      "Ela puxa a barra de leve com as duas mãos e solta."
    ]
  },
  {
    "title": "Gancho - Disputa Pelo produto",
    "tag": "Gancho: <b>disputa</b> pelo produto",
    "em": "🤼",
    "hue": 345,
    "scene": "a bright bedroom, two women holding the same garment from opposite sides in a playful tug-of-war, both wearing simple neutral outfits",
    "subject": "two",
    "action": "for the first 2 seconds both women pull the garment gently in opposite directions, laughing; then one of them lets go with a surprised smile; in the last 3 seconds the other holds the garment up proudly toward the camera.",
    "variants": [
      "they pull once more, then both look at the garment and laugh, still holding it",
      "one woman takes the garment and hugs it to her chest while the other pretends to protest"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the garment never tears, stretches out of shape or changes color, and it is never worn during the tug-of-war",
    "note": "Na foto a peça NÃO está vestida por ninguém (só disputada). Para mostrá-la vestida, gere outro clipe com outra foto.",
    "resumo": "Duas mulheres puxam a mesma peça de lados opostos, rindo, num cabo de guerra de brincadeira. Uma solta com cara de surpresa e a outra levanta a peça, orgulhosa, para a câmera.",
    "variantsPt": [
      "Elas puxam mais uma vez, depois as duas olham para a peça e riem, ainda segurando.",
      "Uma pega a peça e abraça no peito enquanto a outra finge protestar."
    ]
  },
  {
    "title": "SkinCare e Maquiagem",
    "tag": "Prompt produtos de <b>skin care</b>",
    "em": "🧴",
    "hue": 320,
    "scene": "a bright bathroom counter with a mirror, a woman holding the skincare product near her face, soft daylight",
    "subject": "woman",
    "action": "for the first 2 seconds she holds the product beside her face looking at the camera; then she opens the lid or presses the pump exactly as the product works; in the last 3 seconds she applies a small amount to the back of her hand and smiles.",
    "variants": [
      "she holds the product next to her cheek, tilts her head slightly and smiles",
      "she presses the pump once, a small amount appears on her fingertips, and she shows it to the camera"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the packaging, label area and colors never change and the lid never changes shape",
    "note": "Evite mostrar resultado no rosto (antes e depois) e não afirme efeitos que a descrição não traz.",
    "resumo": "Uma mulher segura o produto ao lado do rosto, olhando para a câmera. Abre a tampa ou aperta o pump como o produto funciona e passa um pouco no dorso da mão, sorrindo.",
    "variantsPt": [
      "Ela segura o produto ao lado da bochecha, inclina a cabeça e sorri.",
      "Ela aperta o pump uma vez, aparece um pouco de produto na ponta dos dedos e ela mostra para a câmera."
    ]
  },
  {
    "title": "Vídeo ASMR do Produto",
    "tag": "Prompt vídeo <b>ASMR</b>",
    "em": "🎧",
    "hue": 250,
    "scene": "a minimalist bedroom with light neutral colors and a neatly made bed, the garment folded on the bed, soft natural light",
    "subject": "hands",
    "action": "for the first 2 seconds the hands rest beside the folded garment; then the fingertips tap and brush the fabric slowly; in the last 3 seconds one hand smooths the fabric flat and the hands lift away.",
    "variants": [
      "the fingertips pinch the fabric lightly and release it so it springs back",
      "one hand slides across the fabric slowly from one edge to the other"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the garment keeps the same folds, print and color and never changes shape",
    "note": "O som ASMR (toques no tecido) pode ser gerado ou colocado na edição; a narração aqui é opcional.",
    "resumo": "Mãos ao lado da peça dobrada sobre a cama. A ponta dos dedos bate e passa devagar no tecido; no fim uma mão alisa a peça e as mãos saem.",
    "variantsPt": [
      "Os dedos beliscam o tecido de leve e soltam, e ele volta ao lugar.",
      "Uma mão desliza pelo tecido devagar, de uma ponta à outra."
    ]
  },
  {
    "title": "No Face / Faceless",
    "tag": "Prompt <b>no face</b> / faceless",
    "em": "🙈",
    "hue": 140,
    "scene": "a modern cozy bedroom, a woman framed from the shoulders down wearing the garment, soft natural light",
    "subject": "faceless",
    "action": "for the first 2 seconds she stands still, framed from the shoulders down; then she runs a hand down the garment to show the fabric; in the last 3 seconds she turns her torso a few degrees toward the light and back.",
    "variants": [
      "she adjusts the neckline or waistband with two fingers and lets go",
      "she lifts the hem a few centimeters and lets it fall"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the garment keeps the same fit, print and color",
    "note": "A cabeça fica fora do enquadramento em todo o clipe, como na foto.",
    "resumo": "Mulher enquadrada dos ombros para baixo (sem rosto), com a peça. Ela fica parada, passa a mão pela peça para mostrar o tecido e vira o tronco poucos graus para a luz e volta.",
    "variantsPt": [
      "Ela ajusta a gola ou o cós com dois dedos e solta.",
      "Ela levanta a barra alguns centímetros e deixa cair."
    ]
  },
  {
    "title": "Gancho O Falso Protagonista",
    "tag": "Gancho <b>falso protagonista</b>",
    "em": "⌚",
    "hue": 45,
    "scene": "a premium night street with a luxury car parked at the curb, a woman standing beside it holding the product low, warm streetlight",
    "subject": "woman",
    "action": "for the first 2 seconds she stands beside the luxury car looking at it with the product held low; then she raises the product into view toward the camera; in the last 3 seconds she gives a small knowing smile.",
    "variants": [
      "she lifts the product next to her face and nods slowly at the camera",
      "she looks at the car, then back at the camera, and raises the product proudly"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the product keeps the same side facing the camera and the car never replaces it as the focus",
    "note": "O carro só chama a atenção; no fim o produto precisa ser o foco. Se o produto for pequeno, informe a escala real.",
    "resumo": "Uma mulher ao lado de um carro de luxo, à noite, com o produto baixo na mão. Ela levanta o produto até aparecer para a câmera e dá um sorrisinho de quem sabe o que está fazendo.",
    "variantsPt": [
      "Ela levanta o produto ao lado do rosto e acena devagar para a câmera.",
      "Ela olha para o carro, depois para a câmera, e levanta o produto com orgulho."
    ]
  },
  {
    "title": "Vídeo Viral Gringo",
    "tag": "Vídeo viral <b>gringo</b>",
    "em": "🌎",
    "hue": 200,
    "scene": "a casual home room with natural light, a woman holding the product and talking to the camera, handheld smartphone look",
    "subject": "woman",
    "action": "for the first 2 seconds she looks straight into the camera holding the product at chest height; then she gestures naturally with her free hand while talking; in the last 3 seconds she lifts the product slightly toward the camera.",
    "variants": [
      "she nods while talking and points at the product with one finger",
      "she brings the product slightly closer to the camera and back"
    ],
    "voice": "female",
    "speaking": "onscreen",
    "integrity": "the product keeps the same side facing the camera",
    "resumo": "Uma mulher olha direto para a câmera com o produto na altura do peito e fala com gestos naturais; no fim levanta um pouco o produto em direção à câmera.",
    "variantsPt": [
      "Ela concorda com a cabeça enquanto fala e aponta o produto com um dedo.",
      "Ela aproxima um pouco o produto da câmera e volta."
    ]
  },
  {
    "title": "ESBARRÃO COM O PRODUTO",
    "tag": "Esbarrão <b>com o produto</b>",
    "em": "💥",
    "hue": 20,
    "scene": "a busy sidewalk in daylight, a man standing with the product in one hand, passers-by softly blurred behind him",
    "subject": "man",
    "action": "for the first 2 seconds the man stands on the sidewalk holding the product in one hand; then another pedestrian brushes past and the product slips from his hand; in the last 3 seconds he catches it before it touches the ground and looks relieved.",
    "variants": [
      "the man juggles the product once between both hands and secures it with a relieved laugh",
      "he steadies the slipping product against his chest and smiles"
    ],
    "voice": "male",
    "speaking": "offscreen",
    "integrity": "it only moves as described and never deforms, breaks or changes color",
    "note": "O produto não fala: a voz é só a narração. O esbarrão é curto e o produto termina intacto.",
    "resumo": "Um homem na calçada segura o produto. Alguém esbarra nele e o produto escorrega da mão, mas ele pega antes de cair no chão e olha aliviado.",
    "variantsPt": [
      "Ele equilibra o produto entre as duas mãos uma vez e o segura firme, rindo de alívio.",
      "Ele segura o produto que escorrega contra o peito e sorri."
    ]
  },
  {
    "title": "Caminhão de Encomendas Caindo",
    "tag": "Caminhão de <b>entregas</b>",
    "em": "🚚",
    "hue": 320,
    "scene": "a city street behind a delivery truck, a few colorful packages scattered on the road with the product among them, daylight",
    "subject": "woman",
    "action": "for the first 2 seconds a few packages sit on the street; then the woman steps into frame and picks up the product from among them; in the last 3 seconds she holds it up toward the camera.",
    "variants": [
      "she brushes dust off the product with one hand and shows it to the camera",
      "she crouches, lifts the product from the packages and stands up holding it"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the product is never crushed or covered by the other packages and keeps the same shape and color",
    "note": "A foto precisa mostrar o produto em meio aos pacotes: gere-a com o Prompt A.",
    "resumo": "Alguns pacotes espalhados na rua, atrás de um caminhão de entregas, com o produto entre eles. A mulher entra no quadro, pega o produto do meio dos pacotes e o mostra para a câmera.",
    "variantsPt": [
      "Ela tira a poeira do produto com uma mão e o mostra para a câmera.",
      "Ela se agacha, levanta o produto dos pacotes e se levanta segurando-o."
    ]
  },
  {
    "title": "Estilo Chinês + Teste de resistência",
    "tag": "Estilo chinês <b>2.0</b> resistência",
    "em": "🔨",
    "hue": 5,
    "scene": "a clean workbench in bright light, the product on the bench, a hand about to test it",
    "subject": "hands",
    "action": "for the first 2 seconds the hands rest beside the product; then they apply one simple, safe resistance test that fits its real use: [REAL TEST: e.g. pulling both ends or pressing, within its real limit]; in the last 3 seconds the product returns to its original shape and the hands step away.",
    "variants": [
      "the hands press the product firmly once and release it, and it springs back",
      "the hands pull the product gently to show its strength, then let go"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the product shows no tear, crack or permanent deformation and returns exactly to its original shape",
    "note": "Não mostre testes que o produto não aguentaria na vida real: não prometa mais do que ele faz.",
    "resumo": "Mãos ao lado do produto, sobre a bancada. Elas fazem um único teste simples e seguro (puxar, apertar…) dentro do limite real dele, e o produto volta ao formato original.",
    "variantsPt": [
      "As mãos apertam o produto com força uma vez e soltam; ele volta ao normal.",
      "As mãos puxam o produto com cuidado para mostrar a resistência e soltam."
    ]
  },
  {
    "title": "UGC Dinâmico",
    "tag": "Prompt UGC <b>dinâmico</b>",
    "em": "📦",
    "hue": 30,
    "scene": "a bright home room, a person holding the product at chest height, natural light",
    "subject": "woman",
    "action": "for the first 2 seconds she smiles at the camera holding the product at chest height; then she lifts it slightly toward the lens; in the last 3 seconds she nods and lowers it.",
    "variants": [
      "she tilts the product slightly toward the light and back",
      "she brings the product to face level and lowers it slowly"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the product keeps the same side facing the camera",
    "resumo": "Uma pessoa sorri para a câmera com o produto na altura do peito, levanta um pouco o produto em direção à lente, concorda com a cabeça e abaixa.",
    "variantsPt": [
      "Ela inclina o produto para a luz e volta.",
      "Ela leva o produto à altura do rosto e abaixa devagar."
    ]
  },
  {
    "title": "Vídeo Cinematográfico e Minimalista",
    "tag": "Vídeo <b>cinematográfico</b> e minimalista",
    "em": "🎞️",
    "hue": 25,
    "scene": "a clean white surface with soft side light, the garment folded neatly in the center, nothing else in frame",
    "subject": "hands",
    "action": "for the first 2 seconds the folded garment rests alone; then the hands enter, smooth the top of the folded garment and lift one corner a few centimeters; in the last 3 seconds they set it back and exit.",
    "variants": [
      "the hands straighten the garment by its edges until it is perfectly aligned, then exit",
      "one hand slides across the fabric slowly, then exits"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the garment stays folded and keeps the same color, print and shape",
    "note": "Para mostrar a peça aberta, mande uma foto dela aberta e use como outro primeiro quadro.",
    "resumo": "Peça dobrada, sozinha, sobre uma superfície branca. Mãos entram, alisam o topo e levantam uma ponta alguns centímetros; depois devolvem e saem.",
    "variantsPt": [
      "As mãos alinham a peça pelas bordas até ficar perfeita e saem.",
      "Uma mão desliza pelo tecido devagar e sai."
    ]
  },
  {
    "title": "Vídeos Estilo Chinês",
    "tag": "Vídeos dinâmicos <b>estilo chinês</b>",
    "em": "🎥",
    "hue": 215,
    "scene": "a bright home setting where the product is used, a hand about to use it, daylight",
    "subject": "hands",
    "action": "for the first 2 seconds the hand holds the product ready; then it uses the product the way it is really used: [REAL USE: how it is used]; in the last 3 seconds it shows the result of that use and steps away.",
    "variants": [
      "the hand picks the product up, uses it once in the real way, and sets it down",
      "the hand demonstrates the main feature slowly, then lets go"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the product keeps the same shape and color and only moves as it does in real use",
    "note": "Para mostrar vários ambientes, gere uma foto por ambiente (Prompt A) e um clipe de cada.",
    "resumo": "A mão segura o produto pronto, usa do jeito que ele é usado de verdade e, no fim, mostra o resultado do uso e se afasta.",
    "variantsPt": [
      "A mão pega o produto, usa uma vez do jeito real e o apoia.",
      "A mão mostra a função principal devagar e solta."
    ]
  },
  {
    "title": "JOGANDO TINTA E MUDANDO DE COR",
    "tag": "Jogando <b>tinta</b> e mudando de cor",
    "em": "🎨",
    "hue": 335,
    "scene": "a clean bed seen from above, a white blouse laid flat, a hand holding a closed paint jar above it",
    "subject": "hands",
    "action": "for the first 2 seconds the hand holds the closed paint jar above the blouse; then the fingers of the other hand snap once; in the last 3 seconds the jar is moved away.",
    "variants": [
      "the hand taps the closed jar twice and lifts it away",
      "the fingers snap and the hand sweeps once above the blouse without touching it"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the blouse keeps exactly the same color, folds and shape in every frame and no paint touches it",
    "note": "A troca de cor é feita na EDIÇÃO: gere um clipe com a foto da peça na cor 1 e outro com a foto na cor 2 e junte com uma transição de tinta no CapCut. O Veo não deve mudar a cor da peça dentro do clipe.",
    "resumo": "Uma mão segura um pote de tinta fechado sobre a blusa branca aberta na cama; a outra estala os dedos e o pote sai. A cor da blusa NÃO muda no vídeo: a troca de cor se faz na edição.",
    "variantsPt": [
      "A mão bate duas vezes no pote fechado e o levanta.",
      "Os dedos estalam e a mão passa por cima da blusa sem tocar."
    ]
  },
  {
    "title": "Caixa de Correio + Abrindo o pacote",
    "tag": "Pacote + <b>caixa de correio</b>",
    "em": "📬",
    "hue": 200,
    "scene": "a front porch, a woman's hands holding an opened shipping package with the product visible inside it, daylight",
    "subject": "hands",
    "action": "for the first 2 seconds the hands hold the opened package steady; then one hand lifts the product a few centimeters out of the package; in the last 3 seconds the product is held still toward the camera.",
    "variants": [
      "the hands tilt the package slightly toward the camera so the product is clearly visible, then hold",
      "one hand pulls the product halfway out and pushes it back in"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the product and the package keep the same shape and colors and no extra words appear",
    "note": "A câmera nunca aparece. Só as informações de envio que já estiverem no pacote da foto podem aparecer. Para o trecho da caixa de correio, use outra foto em outro clipe.",
    "resumo": "Mãos seguram um pacote aberto com o produto visível dentro. Uma mão levanta o produto alguns centímetros para fora do pacote e o mostra parado para a câmera.",
    "variantsPt": [
      "As mãos inclinam o pacote para a câmera para o produto aparecer bem e seguram.",
      "Uma mão puxa o produto até a metade e o empurra de volta."
    ]
  },
  {
    "title": "Unboxing UGC",
    "tag": "Unboxing <b>UGC</b>",
    "em": "🎁",
    "hue": 340,
    "scene": "a simple realistic Brazilian bedroom with ordinary lighting, a woman sitting on the bed holding the opened package with the product visible",
    "subject": "woman",
    "action": "for the first 2 seconds she holds the open package looking at the camera with excitement; then she pulls the product partly out; in the last 3 seconds she holds it up toward the camera with a genuine smile.",
    "variants": [
      "she shakes the package gently, then lifts the product with a surprised smile",
      "she holds the product next to her face and nods at the camera"
    ],
    "voice": "female",
    "speaking": "onscreen",
    "integrity": "the package and the product keep the same shape, colors and details",
    "note": "Antes você enviava 3 imagens (personagem, pacote, produto). Agora use UMA foto da cena como primeiro quadro: gere-a com o Prompt A usando a foto do produto.",
    "resumo": "Uma mulher sentada na cama segura o pacote aberto e olha animada para a câmera; puxa o produto parcialmente e o levanta para a câmera com um sorriso de verdade.",
    "variantsPt": [
      "Ela sacode o pacote de leve, depois levanta o produto com um sorriso de surpresa.",
      "Ela segura o produto ao lado do rosto e acena para a câmera."
    ]
  },
  {
    "title": "Queimando com o Isqueiro",
    "tag": "Queimando com o <b>isqueiro</b>",
    "em": "🔥",
    "hue": 18,
    "scene": "a bright home background, a hand holding a transparent plastic package with the folded garment inside, the other hand holding a closed, unlit lighter",
    "subject": "hands",
    "action": "for the first 2 seconds the hand holds the package still while the other hand holds the closed, unlit lighter near it; then the free hand shakes a finger \"no\" toward the camera and puts the lighter down out of frame; in the last 3 seconds both hands tear the package open at the top.",
    "variants": [
      "the hand puts the lighter away and holds the package up toward the camera",
      "the finger wags \"no\" twice and the hand taps the package once"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the package and the garment inside keep the same shape and colors, and there is no flame, spark or heat of any kind",
    "note": "Segurança: sem chama. O isqueiro aparece apagado e some do quadro. Não peça fogo perto do produto.",
    "resumo": "Uma mão segura o pacote transparente com a peça dobrada e a outra segura um isqueiro FECHADO e apagado. A mão livre faz sinal de “não” com o dedo e larga o isqueiro fora do quadro; depois as mãos abrem o pacote. Sem fogo.",
    "variantsPt": [
      "A mão guarda o isqueiro e levanta o pacote para a câmera.",
      "O dedo faz “não” duas vezes e a mão bate no pacote uma vez."
    ]
  },
  {
    "title": "Composição e combinação de acessórios",
    "tag": "Combinação de <b>acessórios</b>",
    "em": "👗",
    "hue": 330,
    "scene": "a top-down view of a made bed with the garment laid in the center, matching accessories (bag, shoes, jewelry) arranged around it, soft daylight",
    "subject": "hands",
    "action": "for the first 2 seconds the arrangement stays still; then a hand enters and straightens one accessory by a few centimeters; in the last 3 seconds it smooths the garment once and exits.",
    "variants": [
      "a hand moves one accessory slightly closer to the garment and exits",
      "a hand taps the garment gently and exits"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "every item keeps the same shape, color and position except the one the hand adjusts",
    "note": "Ordem e quantidade dos acessórios são as da foto: não peça itens novos.",
    "resumo": "Visto de cima: a peça no centro da cama, com bolsa, sapatos e bijuterias combinando ao redor. Uma mão entra, ajeita um acessório e alisa a peça; depois sai.",
    "variantsPt": [
      "Uma mão aproxima um acessório da peça e sai.",
      "Uma mão toca a peça de leve e sai."
    ]
  },
  {
    "title": "Estalando os Dedos",
    "tag": "Estalando <b>os dedos</b>",
    "em": "🫰",
    "hue": 220,
    "scene": "a top-down POV of a bed with the clothing items laid out, a hand above them, soft daylight",
    "subject": "hands",
    "action": "for the first 2 seconds the hands hover above the items; then the fingers snap once; in the last 3 seconds one hand smooths the nearest garment and rests.",
    "variants": [
      "the hand snaps and then straightens the edge of one garment",
      "both hands snap in turn, then rest beside the items"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "no garment appears, disappears or changes color or position except where a hand touches it",
    "note": "O efeito das peças aparecendo (cama vazia e depois cheia) é feito na edição, com 2 fotos e um corte seco no estalo.",
    "resumo": "Visto de cima: peças de roupa organizadas na cama. As mãos pairam por cima, os dedos estalam e uma mão alisa a peça mais próxima. O efeito de peças “aparecendo” é feito na edição.",
    "variantsPt": [
      "A mão estala os dedos e depois endireita a borda de uma peça.",
      "As duas mãos estalam os dedos, uma depois da outra, e descansam ao lado."
    ]
  },
  {
    "title": "Óculos na Loja",
    "tag": "Prompts <b>óculos</b> em loja",
    "em": "🕶️",
    "hue": 205,
    "scene": "a modern eyewear store with softly blurred display shelves, a feminine hand holding the glasses close to the camera, warm light",
    "subject": "hands",
    "action": "for the first 2 seconds the hand holds the glasses steady toward the camera; then it tilts them slightly so the lenses catch the light; in the last 3 seconds it brings them a little closer and holds.",
    "variants": [
      "the hand opens and closes one temple arm once without letting go of the frame, then holds",
      "the other hand adjusts the bridge lightly and releases"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the frame shape, lens color and logo area never change and nothing bends",
    "resumo": "Uma mão feminina segura o óculos perto da câmera, numa loja de ópticas. Inclina o óculos para as lentes pegarem a luz e o aproxima um pouco da câmera.",
    "variantsPt": [
      "A mão abre e fecha uma haste uma vez, sem soltar a armação, e segura.",
      "A outra mão ajusta a ponte de leve e solta."
    ]
  },
  {
    "title": "Calçados Femininos",
    "tag": "Prompt <b>calçados</b> femininos",
    "em": "👡",
    "hue": 330,
    "scene": "a modern bedroom, a woman's feet wearing the sandals seen from above, a matching pair near its box on a soft round pink rug",
    "subject": "feet",
    "action": "for the first 2 seconds the feet stay still; then one foot lifts slightly and the ankle rotates a few degrees to show the sandal; in the last 3 seconds the foot sets back down.",
    "variants": [
      "she shifts her weight slowly from one foot to the other",
      "one foot slides forward a few centimeters and stops"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the sandals keep the same straps, color, sole and details",
    "resumo": "Visto de cima: pés calçando a sandália, com o outro par perto da caixa, em um tapete rosa. Um pé levanta de leve e o tornozelo gira poucos graus para mostrar a sandália; depois apoia de novo.",
    "variantsPt": [
      "Ela passa o peso de um pé para o outro devagar.",
      "Um pé desliza para a frente alguns centímetros e para."
    ]
  },
  {
    "title": "Modelo Plus Size",
    "tag": "Vídeo <b>plus size</b>",
    "em": "💃",
    "hue": 300,
    "scene": "a bright cozy bedroom, a plus size woman wearing the garment, soft natural light",
    "subject": "woman",
    "action": "for the first 2 seconds she stands still wearing the garment; then she adjusts the fit lightly with one hand; in the last 3 seconds she turns a few degrees toward the light and smiles at the camera.",
    "variants": [
      "she smooths the fabric along her side with one hand and lets go",
      "she places a hand on her waist and shifts her weight slowly"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the garment keeps the same fit, print and color",
    "note": "Descreva a peça e a pessoa só pelos traços visíveis, sem comentários sobre o corpo.",
    "resumo": "Uma mulher usa a peça, parada. Ajusta o caimento com uma mão e vira poucos graus para a luz, sorrindo para a câmera.",
    "variantsPt": [
      "Ela alisa o tecido na lateral com uma mão e solta.",
      "Ela põe a mão na cintura e muda o peso de perna devagar."
    ]
  },
  {
    "title": "Calça/Esticando/Agachando",
    "tag": "Calça: <b>esticando</b> e agachando",
    "em": "🧘",
    "hue": 190,
    "scene": "a bright bedroom, a person framed from the waist down wearing the pants",
    "subject": "faceless",
    "action": "for the first 2 seconds she stands still; then she pulls the sides of the pants outward slightly to show the stretch; in the last 3 seconds she does one small squat and rises back.",
    "variants": [
      "she walks in place for a few steps and stops",
      "she lifts one knee, then the other, slowly"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the pants keep the same fit, color and seams and never become see-through or change shape",
    "note": "O rosto nunca aparece. Não afirme elasticidade que a descrição não traz.",
    "resumo": "Pessoa enquadrada da cintura para baixo (sem rosto), com a calça. Puxa as laterais para fora de leve para mostrar a elasticidade e faz um agachamento pequeno, voltando.",
    "variantsPt": [
      "Ela anda no lugar alguns passos e para.",
      "Ela levanta um joelho e depois o outro, devagar."
    ]
  },
  {
    "title": "Loja de departamentos",
    "tag": "Utensílios + <b>loja de departamentos</b>",
    "em": "🏬",
    "hue": 50,
    "scene": "a department store aisle with home goods shelves softly blurred, hands holding the product at chest height, warm store light",
    "subject": "hands",
    "action": "for the first 2 seconds the hands hold the product steady; then one hand points to its main feature; in the last 3 seconds the hands show how it is used: [REAL USE: how it is used].",
    "variants": [
      "one hand lifts the product a few centimeters closer to the camera and holds",
      "the other hand taps the product once and both hands hold still"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the product keeps the same shape and color and no price tag, label or word appears on it",
    "resumo": "As mãos seguram o produto parado, no corredor de uma loja; uma mão aponta a característica principal e as mãos mostram como se usa.",
    "variantsPt": [
      "Uma mão levanta o produto alguns centímetros em direção à câmera e segura.",
      "A outra mão toca o produto uma vez e as duas seguram parado."
    ]
  },
  {
    "title": "Retirando a Bolsa da Caixa",
    "tag": "Retirando a <b>bolsa</b> da caixa",
    "em": "👜",
    "hue": 15,
    "scene": "a soft neutral surface with warm natural light, a woman's hands holding an open gift box with the handbag visible inside",
    "subject": "hands",
    "action": "for the first 2 seconds the hands hold the open box steady; then one hand lifts the handbag a few centimeters by its handle; in the last 3 seconds the handbag is held steady toward the camera.",
    "variants": [
      "the hands tilt the box slightly toward the camera and hold",
      "one hand lifts the handbag a little higher by the handle and lowers it back"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the handbag keeps the same shape, color, hardware and finishing",
    "resumo": "As mãos seguram uma caixa de presente aberta com a bolsa dentro; uma mão levanta a bolsa alguns centímetros pela alça e a segura parada para a câmera.",
    "variantsPt": [
      "As mãos inclinam a caixa para a câmera e seguram.",
      "Uma mão levanta a bolsa um pouco mais alto pela alça e baixa de novo."
    ]
  },
  {
    "title": "Dancinha Feminina para mostrar a calça",
    "tag": "Dancinha <b>feminina</b> (calça)",
    "em": "💃",
    "hue": 320,
    "scene": "a women's clothing store, a woman from the neck down wearing the pants and holding an identical pair up with one hand toward the camera",
    "subject": "faceless",
    "action": "for the first 2 seconds she stands still holding the second pair of pants steady toward the camera; then she does quick light dance steps, alternating her feet; in the last 3 seconds she keeps dancing while the held pair stays extended and facing the camera.",
    "variants": [
      "she shifts her weight side to side in rhythm while the pair stays still",
      "she lifts one knee, then the other, in time with a beat"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "both pairs of pants keep the same fit, color and details, and the held pair stays facing the camera",
    "resumo": "Uma mulher (sem rosto, do pescoço para baixo) usa a calça e segura outra igual esticada para a câmera. Faz passinhos de dança leves, alternando os pés, enquanto a calça na mão fica parada e virada para a câmera.",
    "variantsPt": [
      "Ela passa o peso de um lado para o outro no ritmo, com a calça parada.",
      "Ela levanta um joelho e depois o outro, no ritmo."
    ]
  },
  {
    "title": "Dancinha Masculina para mostrar a calça",
    "tag": "Dancinha <b>masculina</b> (calça)",
    "em": "🕺",
    "hue": 215,
    "scene": "a men's clothing store, a man from the neck down wearing the pants and holding an identical pair up with one hand toward the camera",
    "subject": "faceless",
    "action": "for the first 2 seconds he stands still holding the second pair of pants steady toward the camera; then he does quick light dance steps, alternating his feet; in the last 3 seconds he keeps dancing while the held pair stays extended and facing the camera.",
    "variants": [
      "he shifts his weight side to side in rhythm while the pair stays still",
      "he lifts one knee, then the other, in time with a beat"
    ],
    "voice": "male",
    "speaking": "offscreen",
    "integrity": "both pairs of pants keep the same fit, color and details, and the held pair stays facing the camera",
    "resumo": "Um homem (sem rosto, do pescoço para baixo) usa a calça e segura outra igual esticada para a câmera. Faz passinhos de dança leves, alternando os pés, enquanto a calça na mão fica parada e virada para a câmera.",
    "variantsPt": [
      "Ele passa o peso de um lado para o outro no ritmo, com a calça parada.",
      "Ele levanta um joelho e depois o outro, no ritmo."
    ]
  },
  {
    "title": "Roupa no Manequim",
    "tag": "Roupa no <b>manequim</b>",
    "em": "👕",
    "hue": 260,
    "scene": "a luxury clothing store with warm ambient light, polished marble floor and wooden wall panels, a mannequin wearing the garment, a man's hands near it",
    "subject": "hands",
    "action": "for the first 2 seconds the hands stay out of the way; then they pass over the garment, touching the collar and the fabric; in the last 3 seconds they rest at the sides.",
    "variants": [
      "one hand adjusts the collar slightly and lets go",
      "one hand slides down the sleeve slowly and rests"
    ],
    "voice": "male",
    "speaking": "offscreen",
    "integrity": "the garment keeps the same fit, print and color and the mannequin never changes",
    "resumo": "Numa loja de luxo, um manequim veste a peça e as mãos de um homem ficam perto. As mãos passam pela peça, tocando a gola e o tecido, e depois descansam.",
    "variantsPt": [
      "Uma mão ajeita a gola de leve e solta.",
      "Uma mão desliza pela manga devagar e descansa."
    ]
  },
  {
    "title": "POV de Tênis",
    "tag": "POV de <b>tênis</b>",
    "em": "👟",
    "hue": 40,
    "scene": "a living-room floor with a large black shag rug, a person seated in distressed white jeans, one hand with visible tattoos holding the shoe near the camera while the other shoe is on the foot, the shoebox behind",
    "subject": "hands",
    "action": "for the first 2 seconds the hand holds the shoe steady near the camera; then it tilts the shoe slightly toward the light; in the last 3 seconds the foot wearing the other shoe shifts a few centimeters.",
    "variants": [
      "the hand taps the side of the shoe once and holds it steady",
      "the foot wearing the other shoe lifts a little and sets down"
    ],
    "voice": "male",
    "speaking": "offscreen",
    "integrity": "both shoes keep the same shape, colors, sole and laces",
    "resumo": "Sentada no tapete, a pessoa segura um tênis perto da câmera enquanto usa o outro no pé. A mão inclina o tênis para a luz e, no fim, o pé com o outro tênis se mexe poucos centímetros.",
    "variantsPt": [
      "A mão bate de leve na lateral do tênis e segura parado.",
      "O pé com o outro tênis levanta um pouco e apoia de novo."
    ]
  },
  {
    "title": "Roupas de Cama",
    "tag": "Prompt <b>roupas de cama</b>",
    "em": "🛏️",
    "hue": 345,
    "scene": "a bright cozy bedroom, the bedding neatly folded and arranged on the bed, soft daylight",
    "subject": "hands",
    "action": "for the first 2 seconds the folded bedding rests alone; then a hand enters and smooths the top fold; in the last 3 seconds the hand pats the bedding lightly and exits.",
    "variants": [
      "a hand straightens the edge of the top fold and exits",
      "a hand runs across the surface slowly and exits"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the bedding keeps the same folds, print and color and never changes shape",
    "resumo": "A roupa de cama dobrada, sozinha, na cama. Uma mão entra, alisa a dobra de cima, dá uma batidinha e sai.",
    "variantsPt": [
      "Uma mão endireita a borda da dobra de cima e sai.",
      "Uma mão passa pela superfície devagar e sai."
    ]
  },
  {
    "title": "Formato POV + UGC",
    "tag": "Formato <b>POV + UGC</b>",
    "em": "📱",
    "hue": 270,
    "scene": "a natural home environment shot from a first-person POV, the product in view, soft natural light",
    "subject": "hands",
    "action": "for the first 2 seconds the hands hold the product steady in view; then they tilt it slightly toward the light; in the last 3 seconds they bring it a little closer to the camera.",
    "variants": [
      "one hand taps the product once and both hands hold still",
      "the hands lower the product slightly and raise it again"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the product keeps the same shape and color and the same side facing the camera",
    "note": "Não descreva o tipo de produto de memória: use só a trava visual.",
    "resumo": "Em primeira pessoa: as mãos seguram o produto parado, inclinam-no para a luz e o aproximam um pouco da câmera.",
    "variantsPt": [
      "Uma mão toca o produto uma vez e as duas seguram parado.",
      "As mãos baixam o produto um pouco e levantam de novo."
    ]
  },
  {
    "title": "Colocando sobre a cama",
    "tag": "Colocando <b>sobre a cama</b>",
    "em": "🛍️",
    "hue": 140,
    "scene": "a top-down view of a bed with several garments arranged in their positions with small natural folds and realistic shadows",
    "subject": "hands",
    "action": "for the first 2 seconds the garments rest still; then one hand enters, picks up the top garment and lifts it out of frame; in the last 3 seconds the remaining garments stay exactly where they are.",
    "variants": [
      "a hand lifts the second garment out of frame and the rest stay still",
      "a hand straightens one corner of the top garment and exits"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the remaining garments never change position, color or fold",
    "note": "Efeito de 'colocar peça por peça': gere o clipe tirando as peças e inverta o vídeo no CapCut.",
    "resumo": "Visto de cima: várias peças arranjadas na cama. Uma mão entra, pega a peça de cima e a tira do quadro; as outras ficam exatamente onde estão. Para o efeito de “colocar”, inverta o vídeo no CapCut.",
    "variantsPt": [
      "Uma mão tira a segunda peça do quadro e as outras ficam paradas.",
      "Uma mão endireita uma ponta da peça de cima e sai."
    ]
  },
  {
    "title": "Manequim na Esteira",
    "tag": "Manequim <b>na esteira</b>",
    "em": "🏃",
    "hue": 230,
    "scene": "a modern living room, a man wearing the jacket standing on a treadmill, full body in frame, soft cinematic light",
    "subject": "man",
    "action": "for the first 2 seconds he stands on the stopped treadmill; then the treadmill starts slowly and he walks in place; in the last 3 seconds he puts his hands in the jacket pockets.",
    "variants": [
      "he walks in place and zips the jacket halfway up with one hand",
      "he slows down, stops, and adjusts the collar"
    ],
    "voice": "male",
    "speaking": "offscreen",
    "integrity": "the jacket keeps the same fit, color and details",
    "resumo": "Um homem de jaqueta, de corpo inteiro, em cima de uma esteira parada. A esteira começa devagar, ele anda no lugar e, no fim, coloca as mãos nos bolsos da jaqueta.",
    "variantsPt": [
      "Ele anda no lugar e fecha o zíper até a metade com uma mão.",
      "Ele desacelera, para e ajeita a gola."
    ]
  },
  {
    "title": "Abrindo caixa de sapato",
    "tag": "Abrindo <b>caixa de sapato</b>",
    "em": "📦",
    "hue": 75,
    "scene": "an elegant shoe store, a person's hands holding an open shoebox with the sneaker inside, shelves softly blurred, warm store light",
    "subject": "hands",
    "action": "for the first 2 seconds the hands hold the open box steady; then one hand lifts the sneaker a few centimeters; in the last 3 seconds it sets the sneaker back in the box.",
    "variants": [
      "the hands tilt the box slightly toward the camera and hold",
      "one hand taps the box lightly and the other lifts the sneaker a little"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the sneaker keeps the same shape, colors, sole and laces",
    "note": "Para 'abrir a caixa', use a foto da caixa fechada em um clipe e a da caixa aberta em outro, e junte na edição.",
    "resumo": "As mãos seguram uma caixa de sapato aberta, com o tênis dentro. Uma mão levanta o tênis alguns centímetros e o coloca de volta na caixa.",
    "variantsPt": [
      "As mãos inclinam a caixa para a câmera e seguram.",
      "Uma mão bate de leve na caixa e a outra levanta um pouco o tênis."
    ]
  },
  {
    "title": "Esticando Roupa",
    "tag": "Esticando <b>roupa</b>",
    "em": "↔️",
    "hue": 130,
    "scene": "a bed with the shorts laid flat seen from above, two hands holding both ends of the garment, first-person POV",
    "subject": "hands",
    "action": "for the first 2 seconds the hands hold both ends steady; then they stretch the waistband outward a few centimeters; in the last 3 seconds they release it and it returns.",
    "variants": [
      "the hands pinch the fabric lightly and release it",
      "the hands smooth the garment flat and rest"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the garment returns to its original shape and never tears",
    "note": "Não prometa elasticidade que a descrição do produto não traz.",
    "resumo": "Em primeira pessoa: as mãos seguram as duas pontas do short sobre a cama, esticam o cós alguns centímetros para fora e soltam; ele volta ao normal.",
    "variantsPt": [
      "As mãos beliscam o tecido de leve e soltam.",
      "As mãos alisam a peça até ficar plana e descansam."
    ]
  },
  {
    "title": "Calça no apoio girando",
    "tag": "Calça no <b>apoio girando</b>",
    "em": "🌀",
    "hue": 215,
    "scene": "a luxury boutique, a black glossy lower-body mannequin wearing the pants on a matte black round platform, warm golden light",
    "subject": "none",
    "action": "for the first 2 seconds the platform stays still; then it rotates very slowly by only a few degrees so the light moves across the fabric; in the last 3 seconds it stops.",
    "variants": [
      "the platform stays still and the light shifts slightly across the fabric",
      "the platform rotates a few degrees the other way and stops"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the pants keep the same fit, color and seams and the mannequin never changes",
    "note": "O giro é de poucos graus de propósito: para mostrar a calça de costas, mande uma foto dela de costas e faça outro clipe.",
    "resumo": "A calça no manequim, sobre uma base giratória preta. A base gira bem devagar, só alguns graus, e a luz passa pelo tecido; depois para.",
    "variantsPt": [
      "A base fica parada e a luz muda levemente sobre o tecido.",
      "A base gira alguns graus para o outro lado e para."
    ]
  },
  {
    "title": "Blusas na mão andando pela loja",
    "tag": "Blusas na mão <b>pela loja</b>",
    "em": "🛒",
    "hue": 300,
    "scene": "a bright clothing store, hands holding a neat compressed stack of folded tops, softly blurred racks, warm retail light",
    "subject": "hands",
    "action": "for the first 2 seconds the hands hold the stack steady; then they lift it a few centimeters closer to the camera; in the last 3 seconds they lower it back.",
    "variants": [
      "the hands tilt the stack slightly toward the light and hold",
      "one hand pats the top of the stack once and holds still"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the tops keep the same colors, folds and order in the stack",
    "note": "Andar pela loja exige câmera em movimento, e o plano é travado. Faça a caminhada na edição, com clipes curtos.",
    "resumo": "As mãos seguram uma pilha de blusas dobradas, paradas; levantam a pilha alguns centímetros em direção à câmera e baixam de volta.",
    "variantsPt": [
      "As mãos inclinam a pilha para a luz e seguram.",
      "Uma mão dá uma batidinha no topo da pilha e segura parada."
    ]
  },
  {
    "title": "Abrindo caixa de relógio",
    "tag": "Abrindo <b>caixa de relógio</b>",
    "em": "⌚",
    "hue": 45,
    "scene": "an elegant jewelry-store counter, an open watch box with the watch inside, feminine hands with polished nails, soft warm light",
    "subject": "hands",
    "action": "for the first 2 seconds the nails tap the lid of the open box lightly; then one hand lifts the watch a few centimeters; in the last 3 seconds it sets the watch back in the box.",
    "variants": [
      "the fingers tilt the box slightly toward the camera and hold",
      "one hand lifts the watch a little higher and lowers it back"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the watch dial, hands, strap and logo never change",
    "resumo": "As unhas batem de leve na tampa da caixa aberta do relógio; depois uma mão levanta o relógio alguns centímetros e o coloca de volta na caixa.",
    "variantsPt": [
      "Os dedos inclinam a caixa para a câmera e seguram.",
      "Uma mão levanta o relógio um pouco mais alto e baixa de novo."
    ]
  },
  {
    "title": "Conjuntos esticando",
    "tag": "Prompts <b>conjunto feminino</b>",
    "em": "🩵",
    "hue": 195,
    "scene": "a top-down view of the outfit (top and shorts) laid on a bed, a spontaneous smartphone-photo look",
    "subject": "hands",
    "action": "for the first 2 seconds the outfit rests still; then one hand lifts the top a few centimeters and sets it back; in the last 3 seconds the other hand lightly stretches the waistband of the shorts and releases it.",
    "variants": [
      "both hands smooth the two pieces flat and rest",
      "one hand taps the top once and exits"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "both pieces keep the same shape, color and print, and the waistband returns to its original shape",
    "note": "Não prometa elasticidade que a descrição do produto não traz.",
    "resumo": "Visto de cima: o conjunto (top e short) na cama. Uma mão levanta o top alguns centímetros e o devolve; a outra estica de leve o cós do short e solta.",
    "variantsPt": [
      "As duas mãos alisam as duas peças e descansam.",
      "Uma mão toca o top uma vez e sai."
    ]
  },
  {
    "title": "Mostrando Variações",
    "tag": "Mostrando <b>variações</b>",
    "em": "🎽",
    "hue": 215,
    "scene": "a top-down view of several garments side by side, no people, soft light",
    "subject": "hands",
    "action": "for the first 2 seconds the garments rest side by side; then one hand enters, lifts the first garment by its side a few centimeters and sets it back; the other garments never move; in the last 3 seconds the hand exits.",
    "variants": [
      "the hand lifts the second garment by its side and sets it back",
      "the hand lifts the third garment by its side and sets it back"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the garments that are not touched never change position, color or fold",
    "note": "Gere um clipe por peça (variação) e junte na edição.",
    "resumo": "Visto de cima: várias peças lado a lado, sem pessoas. Uma mão entra, levanta a primeira peça pela lateral alguns centímetros e a devolve; as outras não se mexem. Gere um clipe por peça.",
    "variantsPt": [
      "A mão levanta a segunda peça pela lateral e a devolve.",
      "A mão levanta a terceira peça pela lateral e a devolve."
    ]
  },
  {
    "title": "Rasgando o Pacote",
    "tag": "Prompts <b>rasgando o pacote</b>",
    "em": "✂️",
    "hue": 230,
    "scene": "an overhead flat lay of the garment folded inside a transparent poly bag, centered on a clean surface, occupying 70 to 80 percent of the frame",
    "subject": "hands",
    "action": "for the first 2 seconds the packaged garment rests still; then two hands enter and tear the top of the bag open; in the last 3 seconds they pull the folded garment partly out, still folded.",
    "variants": [
      "the hands open the bag wider and hold it open",
      "one hand pulls the garment a little further out and stops"
    ],
    "voice": "female",
    "speaking": "offscreen",
    "integrity": "the garment stays folded and keeps the same color and shape, and the bag tears only at the top",
    "resumo": "Visto de cima: a peça dobrada dentro de um saco plástico transparente. Duas mãos entram, rasgam o topo do saco e puxam a peça até a metade, ainda dobrada.",
    "variantsPt": [
      "As mãos abrem mais o saco e o seguram aberto.",
      "Uma mão puxa a peça um pouco mais para fora e para."
    ]
  }
];
