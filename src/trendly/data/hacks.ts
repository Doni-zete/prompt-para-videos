export type HackId = "cartomante" | "religioso" | "frutas";

export interface Hack {
  id: HackId;
  title: string;
  description: string;
  emoji: string;
  /** Gradiente do banner. */
  colors: [string, string];
  characterKind: "avatar" | "fruit";
  tiktokQuery: string;
  themes: string[];
  /** Regras de conteúdo aplicadas a todos os textos gerados e mostradas ao usuário. */
  rules: string[];
}

export interface Fruit {
  id: string;
  name: string;
  emoji: string;
}

export const FRUITS: Fruit[] = [
  { id: "manga", name: "Manga", emoji: "🥭" },
  { id: "goiaba", name: "Goiaba", emoji: "🍈" },
  { id: "banana", name: "Banana", emoji: "🍌" },
  { id: "melancia", name: "Melancia", emoji: "🍉" },
  { id: "alho", name: "Alho", emoji: "🧄" },
  { id: "limao", name: "Limão", emoji: "🍋" },
  { id: "melao", name: "Melão", emoji: "🍈" },
  { id: "milho", name: "Milho", emoji: "🌽" },
  { id: "cenoura", name: "Cenoura", emoji: "🥕" },
  { id: "jaca", name: "Jaca", emoji: "🍈" },
];

export const PERSONALITIES = [
  "bravo e engraçado",
  "simpático e animado",
  "sábio e calmo",
  "dramático e exagerado",
] as const;

const COMMON_RULES = [
  "Conteúdo feito com IA: ative o rótulo de conteúdo gerado por IA do TikTok ao publicar.",
  "Não use a imagem ou a voz de pessoas reais sem autorização, nem se passe por uma pessoa real.",
  "Sem pedidos de seguir/curtir em troca de beijo, namoro ou favores, e sem promessas de dinheiro, cura ou resultado garantido.",
];

export const HACKS: Hack[] = [
  {
    id: "cartomante",
    title: "Estilo Cartomante",
    description: "Vídeos de leitura de cartas e previsões que geram alta curiosidade e compartilhamento.",
    emoji: "🔮",
    colors: ["#7c3aed", "#4f46e5"],
    characterKind: "avatar",
    tiktokQuery: "leitura de cartas",
    themes: ["Mensagem do dia para o seu signo", "Leitura de 3 cartas: amor, trabalho e energia", "A carta do dia: o que ela pede de você", "Ritual simples para começar a semana"],
    rules: [
      ...COMMON_RULES,
      "Tom de entretenimento: nada de previsões sobre saúde, morte, gravidez, dinheiro ou decisões importantes.",
    ],
  },
  {
    id: "religioso",
    title: "Estilo Religioso",
    description: "Mensagens de fé e passagens bíblicas que possuem alcance viral massivo e fidelização.",
    emoji: "🙏",
    colors: ["#2563eb", "#0d9488"],
    characterKind: "avatar",
    tiktokQuery: "mensagem de fé",
    themes: ["Mensagem de esperança para hoje", "Palavra de conforto para quem está cansado", "Gratidão e recomeço", "Um versículo para começar o dia"],
    rules: [
      ...COMMON_RULES,
      "Trate a fé com respeito: sem milagres prometidos, sem pedir doações e sem usar a imagem de líderes religiosos reais.",
    ],
  },
  {
    id: "frutas",
    title: "Estilo Frutas Falantes",
    description: "Crie vídeos divertidos e com alta retenção de frutas dando dicas e conselhos de alimentação.",
    emoji: "🍎",
    colors: ["#16a34a", "#059669"],
    characterKind: "fruit",
    tiktokQuery: "frutas falantes",
    themes: ["Mito ou verdade sobre a fruta", "Dica rápida de como escolher e guardar", "Receita simples com a fruta", "A fruta reclamando de ser esquecida na fruteira"],
    rules: [
      ...COMMON_RULES,
      "Sem alegações de saúde: nada de dizer que a fruta cura, previne ou trata doenças. Só dicas gerais e curiosidades.",
    ],
  },
];

export const getHack = (id: string | undefined): Hack | undefined => HACKS.find((h) => h.id === id);
