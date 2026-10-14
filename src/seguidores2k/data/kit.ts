/** Conteúdo do kit "2K DE SEGUIDORES NO TIKTOK" (textos em inglês para o gerador; falas em português do Brasil). */
export interface Perfil { id: string; title: string; text: string }
export interface Cena { id: string; title: string; text: string }

export const PERFIL_DICA = "O principal é sempre repetir: “smartphone photo, natural Brazilian environment, real skin texture, no cinematic lighting, no studio photoshoot, no AI-perfect skin.” Isso deve aproximar muito mais do real.";

export const PERFIS: Perfil[] = [
  {
    "id": "01",
    "title": "MULHER POLICIAL",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian woman, 25 years old, wearing a realistic Brazilian police-style uniform. She should look natural, confident and attractive, like a real person posting casual content for TikTok in Brazil. The scene should feel authentic, with a simple Brazilian urban background, natural daylight, normal phone camera perspective, real skin texture and everyday details. Avoid cinematic lighting, studio photoshoot, luxury look or AI-perfect skin."
  },
  {
    "id": "02",
    "title": "MULHER DA ROÇA / FAZENDEIRA",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian countryside woman, 25 years old, wearing a simple farm outfit such as jeans, fitted plaid shirt, boots and a hat. She should look like a real Brazilian woman from the countryside, natural and attractive, with an authentic rural background like a farm, dirt road, plants or a simple backyard. Natural daylight, casual phone photo, realistic skin texture, no cinematic or polished photoshoot look."
  },
  {
    "id": "03",
    "title": "MULHER ENFERMEIRA",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian nurse, 25 years old, wearing a simple clean nurse uniform. She should look natural, friendly, attractive and professional, like a real Brazilian woman recording content during her routine. Use a realistic clinic or hospital corridor background, simple lighting, phone camera quality, real skin texture and natural facial features. Avoid glamour photoshoot, cinematic lighting or artificial AI appearance."
  },
  {
    "id": "04",
    "title": "ATENDENTE DE SUPERMERCADO",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian supermarket cashier, 25 years old, wearing a realistic supermarket employee uniform. She is standing near a checkout counter in a normal Brazilian supermarket, looking friendly, natural and attractive. The image should look like a casual phone photo for TikTok, with natural store lighting, realistic background details, real skin texture and no cinematic or studio look."
  },
  {
    "id": "05",
    "title": "MULHER ADVOGADA",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian lawyer, 27 years old, wearing a simple elegant work outfit with blazer and blouse. She should look confident, intelligent and attractive, but still natural and realistic, like a real Brazilian professional taking a casual photo at work. Use a normal office background, natural indoor lighting, phone camera perspective, real skin texture and no luxury photoshoot or cinematic style."
  },
  {
    "id": "06",
    "title": "MULHER ENGENHEIRA",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian engineer, 26 years old, wearing a construction helmet, safety vest and simple work clothes. She should look natural, confident and attractive, like a real Brazilian engineer at a construction site. Use a realistic Brazilian construction background, daylight, casual phone camera look, real skin texture, natural facial features and no dramatic cinematic lighting or perfect AI look."
  },
  {
    "id": "07",
    "title": "PERSONAL TRAINER",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian personal trainer, 25 years old, wearing realistic gym clothes. She should look healthy, confident and attractive, like a real Brazilian woman taking a casual TikTok photo at the gym. Use a normal Brazilian gym background, natural indoor lighting, phone camera style, real skin texture, realistic body proportions and no overly polished fitness photoshoot look."
  },
  {
    "id": "08",
    "title": "MULHER GÓTICA",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian goth woman, 25 years old, wearing a stylish black gothic outfit with dark makeup and accessories. She should look natural, attractive and alternative, like a real Brazilian woman posting casual TikTok content. Use a simple urban Brazilian background, natural or normal street lighting, phone camera perspective, real skin texture and no cinematic fantasy look."
  },
  {
    "id": "09",
    "title": "DONA DE CASA",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian housewife, 28 years old, wearing a casual home outfit. She should look natural, warm, attractive and realistic, like a real Brazilian woman taking a casual photo at home. Use a simple Brazilian home background, natural daylight from a window, phone camera style, real skin texture, normal everyday details and no polished studio or influencer photoshoot look."
  },
  {
    "id": "10",
    "title": "MULHER FAXINEIRA",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian cleaning woman, 28 years old, wearing a simple realistic cleaning uniform and holding basic cleaning supplies. She should look natural, hardworking, friendly and attractive, like a real Brazilian woman in her daily work routine. Use a simple home, apartment or office background, natural lighting, phone camera perspective, real skin texture and no cinematic or artificial AI look."
  },
  {
    "id": "11",
    "title": "MULHER PROFESSORA",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian teacher, 27 years old, wearing a simple professional outfit suitable for a classroom. She should look natural, intelligent, friendly and attractive, like a real Brazilian teacher taking a casual photo at school. Use a normal classroom background, natural indoor lighting, phone camera look, realistic skin texture and no cinematic, luxury or overly polished style."
  },
  {
    "id": "12",
    "title": "MULHER AEROMOÇA",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian flight attendant, 25 years old, wearing a realistic airline uniform. She should look natural, elegant, professional and attractive, like a real Brazilian woman taking a casual photo before work. Use a realistic airport or airplane cabin background, normal indoor lighting, phone camera style, real skin texture and no cinematic photoshoot or AI-perfect appearance."
  },
  {
    "id": "13",
    "title": "MULHER GAMER",
    "text": "Create a highly realistic vertical smartphone photo of a beautiful adult Brazilian gamer woman, 25 years old, wearing casual stylish clothes and headphones at a realistic gaming setup. She should look natural, attractive and charismatic, like a real Brazilian woman posting casual gaming content on TikTok. Use a normal bedroom or home office background, realistic RGB lights but not too cinematic, phone camera perspective, real skin texture and no artificial AI look."
  }
];

export const BASE_OBRIGATORIA = "Use the uploaded image as the first frame and main visual reference. The woman in the uploaded image is the only character. Preserve her exact face, hairstyle, skin tone, body proportions, outfit, uniform, colors, accessories and overall appearance throughout the entire video. Do not redesign her clothes. Do not change her profession. Do not change the uniform.\n\nCreate a realistic vertical 9:16 smartphone video, as if recorded naturally on a phone in Brazil. Natural lighting, handheld camera, casual real-life movement, simple Brazilian environment, no cinematic look, no studio lighting, no glamour photoshoot, no artificial beauty filter.\n\nNo background music. No sound effects. No app interface. No TikTok logo. No watermark. No likes, comments, share icons, buttons, captions, subtitles, usernames, emojis or engagement symbols on screen. No text overlays. Fully clothed, professional, casual, family-friendly and non-suggestive.\n\nIf she speaks, the dialogue must be in Brazilian Portuguese.";

export const NEGATIVE_PROMPT = "TikTok interface, watermark, logo, username, likes, comments, share icons, app buttons, captions, subtitles, text overlay, emojis, background music, sound effects, cinematic lighting, studio lighting, glamour photoshoot, outfit change, different uniform, different woman, different face, body-focused camera, suggestive posing, revealing clothes, dancing sexually, unrealistic AI skin, plastic skin, extra people, brand logos";

export const CENAS: Cena[] = [
  {
    "id": "01",
    "title": "CHEGANDO NO TRABALHO",
    "text": "She arrives at her workplace, holding the phone naturally at arm's length. She smiles and says in Brazilian Portuguese: “Cheguei pra mais um dia de trabalho, bora comigo?” Keep the same exact outfit and uniform from the uploaded image during the entire video."
  },
  {
    "id": "02",
    "title": "ARRUME-SE COMIGO",
    "text": "Show a natural morning preparation scene at home. She gently fixes her hair, checks herself in the mirror, picks up her bag and gets ready to leave. She says in Brazilian Portuguese: “Se arruma comigo pra trabalhar hoje.” Keep the exact same outfit from the uploaded image."
  },
  {
    "id": "03",
    "title": "INDO TRABALHAR",
    "text": "She walks naturally on a Brazilian street or hallway as if going to work. The camera is handheld and realistic. She looks at the camera and says in Brazilian Portuguese: “Partiu trabalhar, mais um dia começando.” Keep the exact same clothes and uniform."
  },
  {
    "id": "04",
    "title": "MINI VLOG DA ROTINA",
    "text": "Create a natural short vlog showing her normal routine: arriving, organizing things, drinking coffee and starting work. Brazilian Portuguese voiceover: “Mais um dia da minha rotina por aqui.” No music, only natural ambient silence."
  },
  {
    "id": "05",
    "title": "FALANDO COM SEGUIDORES",
    "text": "She records herself in selfie mode and speaks naturally to the camera in Brazilian Portuguese: “Vocês pediram pra eu mostrar mais da minha rotina, então hoje vou levar vocês comigo.” Keep the video simple, realistic and without any app interface."
  },
  {
    "id": "06",
    "title": "COMEÇANDO O EXPEDIENTE",
    "text": "She enters the workplace, puts her bag down, organizes herself and looks at the camera with a friendly smile. She says in Brazilian Portuguese: “Começando o expediente agora.” Keep the same exact outfit and professional appearance."
  },
  {
    "id": "07",
    "title": "ME ACOMPANHA POR UM DIA",
    "text": "She gestures naturally for the viewer to follow her and shows a few calm moments of her workday. Brazilian Portuguese voiceover: “Me acompanha em mais um dia da minha rotina.” Realistic phone video, no music, no text, no overlays."
  },
  {
    "id": "08",
    "title": "BOM DIA NATURAL",
    "text": "She looks at the camera in a simple Brazilian environment and says in Brazilian Portuguese: “Bom dia, gente. Hoje o dia começou cedo por aqui.” Natural face, natural movement, no beauty filter, same exact outfit from the uploaded image."
  },
  {
    "id": "09",
    "title": "COISAS DA PROFISSÃO",
    "text": "She speaks naturally to the camera in her workplace and says in Brazilian Portuguese: “Três coisas que quase ninguém sabe sobre essa profissão...” She gestures with her hands in a casual and friendly way. No text overlays."
  },
  {
    "id": "10",
    "title": "BASTIDORES SIMPLES",
    "text": "Show her preparing her workspace, checking small details and getting ready to start. Brazilian Portuguese voiceover: “Um pouquinho dos bastidores que quase ninguém vê.” Keep everything realistic and simple."
  },
  {
    "id": "11",
    "title": "ANTES DE SAIR DE CASA",
    "text": "She records herself at home before leaving for work, adjusts her bag, checks the door and smiles at the camera. She says in Brazilian Portuguese: “Saindo agora, me desejem sorte.” Keep the same outfit and uniform."
  },
  {
    "id": "12",
    "title": "ENTRANDO EM CENA",
    "text": "She walks naturally toward the camera in her work environment, smiles and waves. No dialogue, no music, no overlays. Just a realistic phone video with natural Brazilian lighting."
  },
  {
    "id": "13",
    "title": "RESPONDENDO PERGUNTA",
    "text": "She looks at the camera as if answering a follower question and says in Brazilian Portuguese: “Muita gente pergunta como é minha rotina, então vou mostrar um pedacinho.” Then show quick natural work moments."
  },
  {
    "id": "14",
    "title": "DIA CORRIDO",
    "text": "Show a realistic busy but normal workday: walking, checking something, organizing tasks and drinking coffee. Brazilian Portuguese voiceover: “Hoje foi corrido, mas deu tudo certo.” No music, no interface, no text."
  },
  {
    "id": "15",
    "title": "LOOK DE TRABALHO",
    "text": "She records a simple mirror video showing her work outfit naturally, without posing suggestively. She says in Brazilian Portuguese: “Look de trabalho de hoje.” Keep the exact same outfit from the uploaded image."
  },
  {
    "id": "16",
    "title": "EU AMO MEU TRABALHO",
    "text": "She looks at the camera with a friendly expression and says in Brazilian Portuguese: “Quando me perguntam se eu gosto do que eu faço...” Then she smiles and says: “Eu amo.” Natural handheld phone video."
  },
  {
    "id": "17",
    "title": "ROTINA DA MANHÃ",
    "text": "Show a calm morning routine: coffee, checking the phone, picking up keys, getting ready to leave. Brazilian Portuguese voiceover: “Minha manhã antes do trabalho.” Keep the exact same visual identity from the uploaded image."
  },
  {
    "id": "18",
    "title": "COMEÇANDO COM CAFÉ",
    "text": "She drinks coffee before work in a simple Brazilian home or workplace. She looks at the camera and says in Brazilian Portuguese: “Sem café eu não começo o dia.” Natural ambient silence, no music."
  },
  {
    "id": "19",
    "title": "APRESENTAÇÃO DO PERFIL",
    "text": "She speaks directly to the camera and says in Brazilian Portuguese: “Pra quem chegou agora, eu sou a [PROFESSION] que aparece por aqui.” She smiles naturally and waves. No text, no app interface, no logo."
  },
  {
    "id": "20",
    "title": "PROFISSÃO EM POUCOS SEGUNDOS",
    "text": "Show a few quick but natural clips of her work environment, outfit and daily routine. Brazilian Portuguese voiceover: “Minha profissão em poucos segundos.” Keep it realistic, calm and natural, without music."
  },
  {
    "id": "21",
    "title": "VLOG NO ESPELHO",
    "text": "She films herself in the mirror wearing the exact same outfit from the uploaded image, adjusts her hair and says in Brazilian Portuguese: “Partiu mais um dia, né?” No interface, no captions, no music."
  },
  {
    "id": "22",
    "title": "O QUE LEVO NA BOLSA",
    "text": "She shows what she carries in her bag before work: phone, keys, wallet and simple work items. She says in Brazilian Portuguese: “O que eu levo na bolsa pra trabalhar.” Natural lifestyle video."
  },
  {
    "id": "23",
    "title": "CHEGANDO EM CIMA DA HORA",
    "text": "She enters the workplace in a slight hurry, fixes her bag and smiles at the camera. She says in Brazilian Portuguese: “Eu não tô atrasada... eu tô no meu horário alternativo.” Light humor, realistic phone video."
  },
  {
    "id": "24",
    "title": "MOTIVACIONAL NATURAL",
    "text": "She walks calmly in her work environment looking focused and confident. Brazilian Portuguese voiceover: “Um passo de cada vez, mas sempre seguindo em frente.” No music, no cinematic look."
  },
  {
    "id": "25",
    "title": "PEQUENA COMEMORAÇÃO",
    "text": "She finishes a task, smiles and makes a small happy gesture with her hands. She says in Brazilian Portuguese: “Missão cumprida por aqui.” Keep it natural, professional and fully clothed."
  },
  {
    "id": "26",
    "title": "UM DIA COMIGO",
    "text": "Show a natural day-in-my-life sequence: coffee, leaving home, arriving at work, lunch break and finishing the day. Brazilian Portuguese voiceover: “Um dia comigo trabalhando como [PROFESSION].” No music, no overlays."
  },
  {
    "id": "27",
    "title": "GANCHO DE CURIOSIDADE",
    "text": "She looks at the camera and says in Brazilian Portuguese: “Posso falar uma verdade sobre essa profissão?” Then she smiles and continues speaking naturally, as if starting a story. Realistic phone video."
  },
  {
    "id": "28",
    "title": "VIROU MINHA ROTINA",
    "text": "She appears at home, then at work, keeping the same outfit from the uploaded image when working. Brazilian Portuguese voiceover: “O que era só um sonho virou minha rotina.” Natural and emotional, no music."
  },
  {
    "id": "29",
    "title": "RESPONDENDO CRÍTICA",
    "text": "She reacts calmly to an imaginary comment and says in Brazilian Portuguese: “Falar é fácil, quero ver viver a rotina.” Then show normal clips of her working. Keep it respectful and realistic."
  },
  {
    "id": "30",
    "title": "TENTANDO SER SÉRIA",
    "text": "She tries to keep a serious face at work but almost laughs. She looks at the camera and says in Brazilian Portuguese: “Eu tentando ser séria no trabalho.” Casual humor, natural phone camera."
  },
  {
    "id": "31",
    "title": "COISAS QUE AMO",
    "text": "She speaks to the camera in Brazilian Portuguese: “Três coisas que eu amo no meu trabalho.” She counts on her fingers and gestures naturally. Keep the same outfit and simple realistic environment."
  },
  {
    "id": "32",
    "title": "COISAS QUE IRRITAM",
    "text": "She says in Brazilian Portuguese: “Três coisas que me irritam no trabalho, mas eu finjo costume.” Use playful facial expressions and natural gestures. No text overlays, no music."
  },
  {
    "id": "33",
    "title": "PAUSA PRO CAFÉ",
    "text": "She takes a short coffee break, sits or stands naturally and says in Brazilian Portuguese: “Pausa rápida pro café e já volto pra rotina.” Realistic Brazilian environment, natural lighting."
  },
  {
    "id": "34",
    "title": "ENERGIA DO DIA",
    "text": "She starts with a tired expression, then smiles and makes a small cheerful movement. She says in Brazilian Portuguese: “Minha energia hoje tá assim.” No music, no dance, just natural body language."
  },
  {
    "id": "35",
    "title": "ENCONTRANDO ALGUÉM",
    "text": "The camera is POV as if someone recognized her in a public place. She smiles, waves and says in Brazilian Portuguese: “Oi, gente! Tudo bem com vocês?” Friendly, natural, no interface elements."
  },
  {
    "id": "36",
    "title": "NINGUÉM IMAGINA",
    "text": "She looks at the camera with a curious smile and says in Brazilian Portuguese: “Ninguém imagina o que acontece nos bastidores...” Then show a few normal workplace moments. Keep it safe and realistic."
  },
  {
    "id": "37",
    "title": "PRESENÇA PROFISSIONAL",
    "text": "She walks calmly toward the camera in her exact same outfit from the uploaded image, smiles and waves. Elegant, confident and friendly, not sensual. Natural phone video with no music."
  },
  {
    "id": "38",
    "title": "ORGANIZANDO A MESA",
    "text": "She organizes her desk or work station, places items neatly, checks her phone and starts working. Brazilian Portuguese voiceover: “Organizando tudo antes de começar.” Clean, satisfying, natural."
  },
  {
    "id": "39",
    "title": "ROUPA DE TRABALHO",
    "text": "She adjusts small details of the exact same work outfit from the uploaded image and says in Brazilian Portuguese: “Quando coloco essa roupa, a rotina começa de verdade.” No outfit change, no redesign."
  },
  {
    "id": "40",
    "title": "FOTOS CASUAIS",
    "text": "She takes a few casual photos in her workplace, smiles naturally and laughs. Behind-the-scenes style, realistic phone footage, no glamour photoshoot, no suggestive poses, no overlays."
  },
  {
    "id": "41",
    "title": "CASA E TRABALHO",
    "text": "Show her casual at home and then working in the exact same outfit from the uploaded image. Brazilian Portuguese voiceover: “Minha versão de casa e minha versão no trabalho.” Natural transition, no music."
  },
  {
    "id": "42",
    "title": "STORYTIME RÁPIDO",
    "text": "She speaks directly to the camera in Brazilian Portuguese: “Storytime rápido de uma coisa que aconteceu hoje no trabalho...” Make her expressive, friendly and natural, with handheld phone framing."
  },
  {
    "id": "43",
    "title": "VOCÊ TERIA CORAGEM?",
    "text": "She looks at the camera and says in Brazilian Portuguese: “Você teria coragem de viver essa rotina?” Then show quick natural clips of her normal workday. No music, no captions, no interface."
  },
  {
    "id": "44",
    "title": "PÓS-TRABALHO",
    "text": "She arrives home after work, puts her bag down, drinks water or tea and relaxes. Brazilian Portuguese voiceover: “Depois de um dia puxado, minha rotina é assim.” Cozy, natural, no music."
  },
  {
    "id": "45",
    "title": "TRABALHO E PERSONALIDADE",
    "text": "Show her focused at work, then laughing naturally in a relaxed moment. Brazilian Portuguese voiceover: “No trabalho eu tento manter a postura... mas eu também sou gente.” Safe, funny and natural."
  },
  {
    "id": "46",
    "title": "EXPRESSÕES NO TRABALHO",
    "text": "She changes facial expressions naturally: focused, confused, playful, surprised and smiling. Brazilian Portuguese voiceover: “Eu tentando controlar minhas expressões no trabalho.” Funny and relatable."
  },
  {
    "id": "47",
    "title": "TUTORIAL SIMPLES",
    "text": "She demonstrates a simple and safe general task related to her profession. She says in Brazilian Portuguese: “Vou te mostrar rapidinho como eu faço isso.” Friendly, educational and realistic."
  },
  {
    "id": "48",
    "title": "DETALHE DA PROFISSÃO",
    "text": "She looks at the camera and says in Brazilian Portuguese: “Um detalhe da minha profissão que pouca gente percebe...” Then show quick normal workplace clips. No music, no text, no overlays."
  },
  {
    "id": "49",
    "title": "OBJETO DE TRABALHO",
    "text": "She holds a safe object related to her profession and explains it casually to the camera. She says in Brazilian Portuguese: “Isso aqui faz parte da minha rotina todo dia.” Keep it simple, natural and realistic."
  },
  {
    "id": "50",
    "title": "FINAL DE EXPEDIENTE",
    "text": "She finishes work, organizes her things, grabs her bag, looks at the camera and says in Brazilian Portuguese: “Fim de expediente... amanhã tem mais.” Warm natural light, relaxed smile, no music, no interface. "
  }
];
