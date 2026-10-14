import type { LibraryItem, PromptMode } from "./types";

export const PRONTAS_CATEGORIES = [
  "Ganchos Especiais",
  "Maquiagem, Skincare e acessórios",
  "Relógios",
  "Roupas Masculinas",
  "Roupas Femininas",
  "Calçados Masculinos",
  "Calçados Femininos",
] as const;

const NO_JUNK = "Sem textos, interfaces, elementos de rede social, logos ou mãos deformadas.";

function mk(
  id: string,
  category: (typeof PRONTAS_CATEGORIES)[number],
  title: string,
  mode: PromptMode | undefined,
  prompt: string,
  obs: string,
  hue: number,
  emoji: string,
): LibraryItem {
  return { id: `pronta-${id}`, category, title, mode, prompt, obs, cover: { emoji, hue, tag: title }, draft: true, source: "builtin" };
}

/**
 * "Prompts Prontas": a gravação original mostra 48 prompts, mas só trechos de cada um.
 * Estes são prompts de partida escritos no mesmo padrão. Edite, adapte com o Gemini ou
 * cadastre os seus em "Novo prompt".
 */
export const PRONTAS: LibraryItem[] = [
  mk("g1", "Ganchos Especiais", "Recebendo entrega, roupa de cama e estralando os dedos", "elementos",
    "Crie um vídeo vertical 9:16, estilo UGC/POV para TikTok Shop, usando exatamente o jogo de cama da imagem de referência, preservando cor, acabamento e aparência do produto.\nO vídeo deve ser rápido, dinâmico e natural.\nCena 1: a campainha toca. Em POV, a pessoa vai até a porta para atender.\nCena 2: ao abrir a porta, aparece um entregador de preto segurando um pacote preto de entrega do TikTok Shop. Ele fala em português do Brasil: \"COLOQUE SUA COPY AQUI\".\nCena 3: em POV, a pessoa abre o pacote sobre a cama e estala os dedos, e o jogo de cama aparece perfeitamente arrumado sobre a cama.\n" + NO_JUNK,
    "Suba a imagem do jogo de cama no modo elementos, modelo Omni Flash. Pode personalizar a fala do entregador, está na cena 2.", 340, "📦"),
  mk("g2", "Ganchos Especiais", "Roupa de cama e estralando os dedos", "elementos",
    "Crie um vídeo vertical 9:16, estilo UGC/POV, usando exatamente o jogo de cama rosa da imagem de referência.\nO vídeo deve ser rápido, dinâmico e natural.\nCena 1: em POV, a pessoa está com uma embalagem preta de entrega sobre a cama. Ela abre a embalagem e retira o jogo de cama dobrado.\nCena 2: ela estala os dedos e, no mesmo instante, a cama aparece completamente arrumada com o jogo de cama.\n" + NO_JUNK,
    "Suba a imagem do jogo de cama no modo elementos. Modelo Omni Flash, pode personalizar a copy, fica no final do prompt.", 330, "🛏️"),
  mk("g3", "Ganchos Especiais", "Tinta na Roupa V1", "frames",
    "Vídeo POV, mãos femininas com joias e unhas feitas, vira um pote de tinta rosa sobre a camisa BRANCA manchando a roupa, estrala os dedos e rapidamente a tinta some, revelando a camisa já na cor rosa. A câmera acompanha de cima, sem deformar a roupa.",
    "Gere as duas imagens (apenas mudando a cor da roupa) e personalize no prompt a parte da cor da tinta/roupa. Use o modo frames e modelo Omni Flash.", 320, "🎨"),
  mk("g4", "Ganchos Especiais", "Tinta na Roupa V2", "frames",
    "Vídeo POV, mãos femininas com joias e unhas feitas, vira um pote de tinta BRANCA manchando a camisa ROSA, estrala os dedos, e a mesma tinta suja tudo e a tela fica coberta; num corte seco para a segunda imagem, a camisa já aparece limpa e branca. A câmera permanece de cima, sem deformar a roupa.",
    "Gere as duas imagens (apenas mudando a cor da roupa) e personalize no prompt a parte da cor da tinta/roupa, use o modo frames e modelo Omni Flash.", 300, "🖌️"),
  mk("g5", "Ganchos Especiais", "De toalha e mudando a roupa", "frames",
    "Influencer aparece na cena, de uma roda balançando levemente o corpo, bem solta, e aproxima a palma da mão até a tela cobrindo-a totalmente; ao afastar a mão, ela está vestida com o produto, sorrindo.",
    "Gere a imagem da sua influencer usando a roupa, depois use a mesma imagem e gere ela de toalha na cabeça e roupão. Use no Flow, modelo Omni Flash, Frames, e aplique o prompt acima.", 200, "🛁"),
  mk("g6", "Ganchos Especiais", "Deixando de comprar na loja para comprar no TikTok Shop", "elementos",
    "Vídeo POV, na loja de relógios, só o relógio, vai para pegar, mas para e faz sinal de \"não\" com o dedo, pega o celular e compra online no TikTok Shop, corte de cima para a cama, a pessoa abre o pacote e mostra o produto com orgulho.",
    "Use modelo Omni para melhor resultado, se quiser mudar o produto, troque a primeira imagem e mude a peça no prompt.", 45, "📱"),
  mk("g7", "Ganchos Especiais", "Mudando as cores da roupa dinamicamente", "elementos",
    "Vídeo dinâmico sem falas, com cortes rápidos e fluídos. A influencer mostra a roupa nos 2 primeiros segundos; quando a segunda (blusa) passa no corpo ela imediatamente vira a cor seguinte, e assim por diante, em movimento contínuo.",
    "Use modelo Omni para melhor resultado. Suba a imagem da roupa em todas as cores no Elementos.", 150, "🌈"),
  mk("g8", "Ganchos Especiais", "Comprando pelo Outdoor", "elementos",
    "Vídeo POV, de dentro do carro, vendo um anúncio em um Outdoor, do relógio em ânimo, pega o celular e compra online no TikTok Shop, corte de cima, entregador fala, tá na porta, abre o pacote e mostra o relógio com orgulho.",
    "Use modelo Omni para melhor resultado, se quiser mudar o produto, troque a primeira imagem e coloque sua característica.", 215, "🚗"),

  mk("m1", "Maquiagem, Skincare e acessórios", "Skincare (espelho do banheiro)", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, mostrando a modelo da imagem de referência diante do espelho de um banheiro iluminado pela luz dourada do pôr do sol. Preserve fielmente rosto, tom de pele, cabelo e características. Ela veste um roupão rosa e uma toalha branca enrolada na cabeça, enquanto aplica o cosmético no rosto e segura a embalagem próxima ao corpo.\nUtilize EXATAMENTE o cosmético da imagem de referência, preservando fielmente a embalagem. O reflexo corresponde à animação na frente do espelho.\n" + NO_JUNK,
    "Coloque em anexo o produto e a influencer.\n\nSugestão para vídeo: influencer entregando o creme no rosto e falando \"SUA COPY AQUI\", sem virar ou modificar a embalagem do cosmético.", 330, "🧴"),
  mk("m2", "Maquiagem, Skincare e acessórios", "Skincare (selfie)", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, mostrando a influencer de referência em um ambiente moderno, iluminado pela luz dourada do pôr do sol. Preserve fielmente seu rosto, formato dos olhos, tom e textura da pele, cabelo, características faciais e proporções, sem alterar sua identidade.\nEla veste um roupão branco texturizado e uma toalha branca enrolada na cabeça. Com uma das mãos, segura o pote do produto próximo ao rosto, sorrindo.\n" + NO_JUNK,
    "Coloque em anexo o produto e a influencer.", 300, "🪞"),
  mk("m3", "Maquiagem, Skincare e acessórios", "Pincéis de maquiagem", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em perspectiva POV. Uma mão feminina com unhas bem-cuidadas segura o kit de pincéis de maquiagem em frente a uma penteadeira bem iluminada.\nUtilize EXATAMENTE o kit da imagem de referência, preservando a quantidade e os modelos dos pincéis, tamanhos, formatos das cerdas, cores, cabos, acabamentos metálicos, materiais, estilos de tecido, laços, texturas e proporções. Não modifique, substitua ou invente elementos.\n" + NO_JUNK,
    "mostrando os pincéis", 140, "💄"),

  mk("r1", "Relógios", "Relógio no punho com celular", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em POV: uma mão segura um celular mostrando a página do relógio da imagem de referência na loja do TikTok Shop, enquanto o relógio real aparece em destaque ao fundo, no pulso, com foco nítido nos detalhes do mostrador e da pulseira. Preserve exatamente o design do relógio.\n" + NO_JUNK,
    "Comando de vídeo: mostrando o relógio sutilmente.", 45, "⌚"),
  mk("r2", "Relógios", "Relógio dentro do carro", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em POV dentro de um carro: pela janela se vê um outdoor com o relógio da imagem de referência, e a mão do motorista segura um celular com o anúncio. O relógio real aparece no pulso. Preserve o relógio exatamente.\n" + NO_JUNK,
    "Comando de vídeo: mostrando o relógio sutilmente.", 30, "🚘"),

  mk("h1", "Roupas Masculinas", "Camisa polo na cama", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em POV de cima, de uma camisa polo da imagem de referência, perfeitamente dobrada sobre uma cama com lençol claro. Preserve fielmente modelo, formato, cor, tecido, textura, costuras, caimento, acabamentos e proporções, sem modificar ou inventar detalhes. Fotografia espontânea de smartphone, luz natural suave vinda da janela.\n" + NO_JUNK,
    "Passando a mão na camiseta e mostrando sutilmente os detalhes.", 30, "👔"),
  mk("h2", "Roupas Masculinas", "Roupas em cima da mesa", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em POV de cima, das peças de roupa da imagem de referência, organizadas sobre uma mesa de madeira clara. Ao fundo, elementos decorativos com folhagens verdes e flores rosas. Fotografia espontânea de smartphone, iluminação natural suave, nitidez e texturas realistas. Sem pessoas vestindo as peças. " + NO_JUNK,
    "Passando a mão na camiseta e mostrando sutilmente.", 220, "🪑"),

  mk("f1", "Roupas Femininas", "Vestido na cama (verde)", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em POV de cima, do vestido da imagem de referência estendido sobre uma cama de lençol claro, com duas mãos ajustando a barra da saia. Preserve fielmente modelo, formato, cor, tecido, textura, corte, costuras, caimento, acabamentos e proporções, sem modificar, substituir ou inventar detalhes.\nFotografia espontânea de smartphone, lente grande-angular, iluminação natural suave vinda da janela, alta nitidez e texturas realistas. Sem pessoa vestindo a peça, roupas extras, cabides, textos, logos, interfaces, elementos de rede social, mãos ou dedos deformados.",
    "Passando a mão na camiseta e mostrando sutilmente os detalhes.", 110, "👗"),
  mk("f2", "Roupas Femininas", "Blusa polo bege na cama", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em POV de cima, da blusa polo bege da imagem de referência estendida sobre a cama, com as duas mãos segurando as extremidades. Preserve fielmente modelo, cor, tecido, textura e acabamentos. Fotografia espontânea de smartphone, iluminação natural suave.\n" + NO_JUNK,
    "Passando a mão na camiseta e mostrando sutilmente os detalhes.", 35, "👚"),
  mk("f3", "Roupas Femininas", "Conjunto fitness sobre a mesa", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em POV de cima, do conjunto fitness azul estampado da imagem de referência, dobrado e organizado sobre uma mesa clara, com mãos femininas segurando as extremidades. Preserve exatamente estampa, cor e proporções. Fotografia espontânea de smartphone.\n" + NO_JUNK,
    "Passando a mão no conjunto e mostrando sutilmente.", 225, "🏋️"),

  mk("cm1", "Calçados Masculinos", "Mostrando tênis masculino", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em perspectiva POV de um homem sentado. Em primeiro plano, uma mão masculina segura um tênis próximo à câmera. As pernas aparecem parcialmente, com os pés usando meias brancas, e o homem usa um relógio metálico discreto.\nUtilize EXATAMENTE o tênis da imagem de referência, preservando seu modelo, formato, cores, materiais, texturas, solado, costuras e proporções.\nAmbiente de loja sofisticada e acolhedora, com balcão de madeira, prateleiras de calçados e iluminação interna quente, fotografia espontânea de smartphone, foco extremamente nítido no calçado. " + NO_JUNK,
    "Comando de vídeo mostrando o calçado sutilmente.", 355, "👟"),
  mk("cm2", "Calçados Masculinos", "Sapato masculino social", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em POV: uma mão masculina de punho elegante segura o sapato social da imagem de referência, próximo à câmera, em um escritório moderno. Ao fundo, mesa grande de madeira, cadeira executiva preta e janelas amplas com paisagem urbana desfocada. Preserve exatamente o sapato. " + NO_JUNK,
    "Comando de vídeo mostrando o calçado sutilmente.", 20, "👞"),
  mk("cm3", "Calçados Masculinos", "Tênis sobre tapete com caixa", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, com câmera de smartphone posicionada acima das mãos e inclinada diagonalmente para baixo. Duas mãos tatuadas seguram o tênis da imagem de referência; ao fundo, a caixa branca sobre um tapete felpudo preto, com piso de madeira. Preserve exatamente o tênis. " + NO_JUNK,
    "Comando de vídeo mostrando o calçado sutilmente.", 0, "🥾"),

  mk("cf1", "Calçados Femininos", "Sandália feminina na mão", undefined,
    "Câmera posicionada acima do colo e inclinada diagonalmente para baixo, com o calçado da mão em primeiro plano e o pé mais afastado. Unhas femininas bem-cuidadas ao fundo, com elementos decorativos discretos. Fotografia espontânea de smartphone, iluminação interna suave, alta nitidez e perspectiva natural. Utilize EXATAMENTE a sandália da imagem de referência. " + NO_JUNK,
    "Comando de vídeo mostrando o calçado sutilmente.", 330, "👡"),
  mk("cf2", "Calçados Femininos", "Tênis na mão", undefined,
    "Crie uma fotografia vertical 9:16, ultra-realista, em POV: uma mão feminina segura o tênis amarelo da imagem de referência próximo à câmera, em um ambiente moderno e acolhedor, com iluminação suave, tapete e objetos decorativos discretos. Preserve exatamente o tênis. " + NO_JUNK,
    "Comando de vídeo mostrando o calçado sutilmente.", 50, "👟"),
  mk("cf3", "Calçados Femininos", "Sandália dourada de salto", undefined,
    "Create a vertical 9:16 ultra-realistic POV photograph of a woman's hands holding the exact heeled sandal from the reference image, preserving its exact model, shape, colors, materials, texture, sole, stitching, decorations, logos and proportions, without modifications. Include manicured nails, delicate rings, bracelet and anklet. Place the box on a soft, round pink rug in a modern bedroom. Candid smartphone photography, soft natural lighting and high sharpness. No text, interfaces, extra footwear, extra fingers or deformed hands.",
    "Comando de vídeo mostrando o calçado sutilmente.", 45, "👠"),
];
