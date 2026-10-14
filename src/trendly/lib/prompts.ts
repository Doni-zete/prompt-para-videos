import { BASE_SYSTEM, POLICY_NOTE, PROMPT_CRAFT } from "../../tools/knowledge";
import type { Hack } from "../data/hacks";
import type { StyleId } from "../data/styles";
import { MAX_WORDS, MIN_WORDS, TAKE_SECONDS } from "./words";

export interface AvatarInfo {
  name: string;
  gender: "f" | "m";
  description: string;
  hasPhoto: boolean;
}

export interface WizardInput {
  style: StyleId;
  avatar?: AvatarInfo;
  product: { name: string; details: string; hasImage: boolean };
  scene?: { label: string; interaction: string; pose: string };
  pov?: { scene: string; hands: string; presentation: string };
  movement?: { title: string; prompt: string };
  voice?: { gender: string; tone: string };
  takes?: string[];
}

const RESTRICTIONS = "Sempre inclua a restrição final: sem texto, legendas, logos, marcas d'água, interface de rede social ou ícone de carrinho na imagem.";

function avatarLine(a?: AvatarInfo): string {
  if (!a) return "Avatar: nenhum (crie uma pessoa fictícia genérica).";
  return (
    `Avatar: ${a.name.trim() || "sem nome"} (${a.gender === "f" ? "feminino" : "masculino"}). ` +
    (a.description.trim() ? `Descrição: ${a.description.trim()}. ` : "") +
    (a.hasPhoto ? "A foto do avatar é a primeira imagem enviada: preserve rosto, tom de pele, cabelo e proporções exatamente." : "Não há foto: descreva a pessoa só pelo texto.")
  );
}

function productLine(p: WizardInput["product"]): string {
  return `Produto: ${p.name.trim() || "ver imagem"}. Detalhes reais: ${p.details.trim() || "não informado (use só o que é visível)"}. ${p.hasImage ? "As imagens do produto vêm depois da foto do avatar." : "Sem imagem do produto: use só o nome."}`;
}

function sceneLines(i: WizardInput): string[] {
  const out: string[] = [];
  if (i.scene) out.push(`Cenário: ${i.scene.label}. Interação com o produto: ${i.scene.interaction}. Pose do avatar: ${i.scene.pose}.`);
  if (i.pov) out.push(`Cenário: ${i.pov.scene}. Mãos: ${i.pov.hands}. Estilo de apresentação: ${i.pov.presentation}.`);
  return out;
}

function takeLines(takes: string[] = []): string[] {
  return takes.map((t, n) => `TAKE ${n + 1}/${takes.length} (${TAKE_SECONDS}s) — fala exata: "${t.trim()}"`);
}

export function wizardUserPrompt(i: WizardInput): string {
  const lines = [`Estilo: ${i.style.toUpperCase()}`, productLine(i.product)];
  if (i.style !== "pov") lines.push(avatarLine(i.avatar));
  lines.push(...sceneLines(i));
  if (i.movement) lines.push("", `MOVIMENTO BASE ESCOLHIDO (${i.movement.title}) — adapte ao produto:`, i.movement.prompt);
  if (i.voice) lines.push(`Voz: ${i.voice.gender}, tonalidade ${i.voice.tone}.`);
  if (i.takes?.length) lines.push("", "ROTEIRO DO USUÁRIO:", ...takeLines(i.takes));
  return lines.join("\n");
}

/* ----------------------------- UGC e POV: direção ----------------------------- */

const STYLE_BRIEF: Record<StyleId, string> = {
  ugc: "Estilo UGC: o avatar aparece, fala direto para a câmera com sincronia labial perfeita e interage com o produto, como numa gravação de celular.",
  pov: "Estilo POV: vídeo em primeira pessoa mostrando o produto SEM mostrar rosto. Só mãos (conforme a configuração) ou nenhuma mão. Se há fala, é voz off-screen.",
  provador: "Estilo Provador: o avatar usa a peça e se move para mostrar o caimento do tecido. Vídeo mudo, só movimento.",
};

export function directionSystem(style: "ugc" | "pov"): string {
  return `${BASE_SYSTEM}

${PROMPT_CRAFT}

${POLICY_NOTE}

${STYLE_BRIEF[style]}

Sua tarefa: transformar a configuração e o roteiro do usuário em um storyboard técnico para o Google Flow / Veo 3.

Regras de saída:
- Seção "Roteiro de Direção (Veo 3)": UM item por take, com o rótulo "Take N/M". Cada item é o prompt completo do take, em inglês, para um vídeo vertical 9:16 de ${TAKE_SECONDS} segundos.
- A fala de cada take vai em português do Brasil, entre aspas, EXATAMENTE como o usuário escreveu (não altere nenhuma palavra), com a voz e a tonalidade pedidas.
- ${style === "ugc" ? "O avatar fala olhando para a câmera, lip sync perfeito, gestos naturais, preservando rosto e roupa da foto de referência." : "Ninguém aparece falando: a voz é off-screen. Mostre o produto conforme o cenário, as mãos e o estilo de apresentação escolhidos."}
- Mantenha continuidade entre os takes: mesma pessoa/mãos, mesmo cenário, mesma luz, e o fim de cada take deve emendar com o início do seguinte.
- O produto deve ficar idêntico às imagens de referência em todos os takes.
- Seção "Resumo da direção": 1 item de 2 a 3 frases em português explicando as escolhas.
- ${RESTRICTIONS}`;
}

export function frameSystem(style: StyleId): string {
  return `${BASE_SYSTEM}

${PROMPT_CRAFT}

${STYLE_BRIEF[style]}

Sua tarefa: escrever o prompt da imagem estática que serve de PRIMEIRO FRAME do vídeo, para um gerador de imagem. Uma seção "Prompt do primeiro frame" com 1 item, em inglês, vertical 9:16, fotorrealista com aparência de foto de celular, com ${style === "pov" ? "o produto nas mãos/ambiente conforme a configuração, sem rosto" : "o avatar preservado igual à foto de referência"} e o produto idêntico às imagens. ${RESTRICTIONS}`;
}

/* ------------------------------ Provador: kit Veo 3 ------------------------------ */

export function kitSystem(): string {
  return `${BASE_SYSTEM}

${PROMPT_CRAFT}

${STYLE_BRIEF.provador}

Sua tarefa: criar o kit de dois passos para o Veo 3.
- Seção "Prompt do Frame": 1 item, em inglês. É o prompt da imagem de referência (frame) com o avatar usando a peça do produto, no cenário, interação e pose escolhidos. Preserve o rosto da foto do avatar e a peça idêntica às imagens do produto.
- Seção "Prompt do Vídeo": 1 item, em inglês, de ${TAKE_SECONDS} segundos, que ANIMA esse frame usando o movimento base escolhido, adaptado à peça (troque o que depende do produto, mantenha câmera e ritmo). Vídeo mudo: "Audio: none. Silent video."
- Descreva o caimento, a física do tecido e os detalhes reais da peça, sem inventar tamanho, modelagem ou material que não esteja visível.
- ${RESTRICTIONS}`;
}

/* ------------------------------ Roteiro (takes) ------------------------------ */

export function autoScriptSystem(takes: number): string {
  return `${BASE_SYSTEM}

${POLICY_NOTE}

Sua tarefa: escrever as falas de um vídeo de TikTok Shop em português do Brasil, em linguagem natural de quem fala com um amigo.
- Exatamente ${takes} ${takes === 1 ? "take" : "takes"} de ${TAKE_SECONDS} segundos, cada um com ${MIN_WORDS} a ${MAX_WORDS} palavras.
- Só as falas, sem descrições de cena. Sem promessas de resultado, sem alegações de saúde, sem preço ou desconto inventado.
- O último take termina com uma chamada para clicar no carrinho laranja do TikTok Shop.
- Entregue uma seção "Roteiro" com ${takes} ${takes === 1 ? "item" : "itens"} rotulados "Take 1", "Take 2"…`;
}

export function autoScriptUser(i: { product: string; details: string; style: StyleId }): string {
  return `Estilo do vídeo: ${i.style.toUpperCase()}\nProduto: ${i.product.trim() || "produto do vídeo"}\nDetalhes reais: ${i.details.trim() || "não informado"}\n\nEscreva o roteiro.`;
}

/** Texto que o usuário pode colar no ChatGPT ou no Gemini para criar o roteiro. */
export function scriptCopyPrompt(product: string, takes: number): string {
  const seconds = takes * TAKE_SECONDS;
  return `Create a script, in Brazilian Portuguese, containing ONLY the spoken lines that my influencer will say, of up to ${seconds}s for a video on TikTok Shop. It must be separated into ${TAKE_SECONDS}-second takes, meaning (${MIN_WORDS} to ${MAX_WORDS} words) maximum per take. The script must make sense to sell this product: "${product.trim() || "my product"}". Follow all TikTok Shop guidelines and restrictions so I do not get a violation: no health claims, no guaranteed results and no invented prices. At the very end, include a strong Call-To-Action (CTA) directing the viewer to tap the orange shopping cart.`;
}

/* ----------------------------------- Hacks ----------------------------------- */

export interface ViralInput {
  hack: Hack;
  character: string;
  theme: string;
  script?: string;
}

const hackRules = (hack: Hack): string => hack.rules.map((r) => `- ${r}`).join("\n");

export function scriptsSystem(hack: Hack): string {
  return `${BASE_SYSTEM}

Sua tarefa: escrever roteiros curtos para um vídeo no ${hack.title} (${hack.description}).

Regras de conteúdo OBRIGATÓRIAS (nunca as quebre, mesmo que o tema peça):
${hackRules(hack)}

Formato: gere uma única seção "Roteiros" com 4 itens. Cada item tem o rótulo "Roteiro N" e o texto da fala em português do Brasil, com 15 a 25 segundos de duração falada, linguagem natural, gancho forte na primeira frase e fechamento leve. No campo "hint" diga em uma frase o tom do roteiro.`;
}

export const scriptsUser = (i: ViralInput): string => `Personagem: ${i.character}\nTema: ${i.theme}\n\nEscreva os 4 roteiros.`;

export function videoSystem(hack: Hack): string {
  return `${BASE_SYSTEM}

${PROMPT_CRAFT}

Sua tarefa: criar os prompts de vídeo para o ${hack.title}, com o personagem falando o roteiro escolhido, para o Google Flow / Veo.

Regras de conteúdo OBRIGATÓRIAS (nunca as quebre):
${hackRules(hack)}

Entregue seções: "Prompt da imagem do personagem" (1 item, em inglês), "Prompt do vídeo (Flow/Veo)" (1 item, em inglês, com a fala em português do Brasil entre aspas e sincronia labial perfeita), "Legenda e hashtags" (1 legenda de até 150 caracteres e 5 hashtags) e "Checklist antes de publicar" (itens curtos: rotular como conteúdo de IA, conferir se a fala não tem promessa de resultado, conferir direitos de música).
O personagem não é uma pessoa real. Nunca descreva alguém real nem use nomes de celebridades.`;
}

export const videoUser = (i: ViralInput): string => `Personagem: ${i.character}\nTema: ${i.theme}\nRoteiro escolhido:\n${i.script ?? ""}\n\nGere os prompts.`;

/* ------------------------------------ Agente ------------------------------------ */

export const AGENT_SYSTEM = `${BASE_SYSTEM}

Você é o Agente IA de Tendências: um assistente de chat para criadores de TikTok Shop no Brasil. Ajuda com ideias de vídeo, ganchos, roteiros curtos, legendas, hashtags e dúvidas de conteúdo. Responda em português do Brasil, de forma direta, em texto corrido e listas curtas quando ajudar. Quando fizer sentido, sugira usar as ferramentas do app: Reels Studio (UGC, POV e Provador), Galeria de Prompts e Hacks Virais. Não invente dados de vendas nem tendências; diga quando não sabe. Não escreva promessas de resultado nem alegações de saúde.`;
