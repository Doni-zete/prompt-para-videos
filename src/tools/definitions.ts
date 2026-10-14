import { Camera, Clapperboard, PenLine, ScanSearch, ShieldAlert, TrendingUp, Type, UserRound, Video } from "lucide-react";
import type { SelectOption, ToolDef, ToolField } from "./types";
import { BASE_SYSTEM, POLICY_NOTE, PROMPT_CRAFT } from "./knowledge";

const CATEGORY: SelectOption[] = [
  { value: "Roupas femininas", label: "Roupas femininas" },
  { value: "Roupas masculinas", label: "Roupas masculinas" },
  { value: "Roupas infantis", label: "Roupas infantis" },
  { value: "Calçados", label: "Calçados" },
  { value: "Acessórios e relógios", label: "Acessórios e relógios" },
  { value: "Beleza e skincare", label: "Beleza e skincare" },
  { value: "Casa e utilidades", label: "Casa e utilidades" },
  { value: "Cama, mesa e banho", label: "Cama, mesa e banho" },
  { value: "Eletrônicos e eletroportáteis", label: "Eletrônicos e eletroportáteis" },
  { value: "Pet", label: "Pet" },
  { value: "Brinquedos", label: "Brinquedos" },
  { value: "Outro", label: "Outro" },
];

const f = {
  product: (required = false): ToolField => ({
    id: "product",
    label: "Nome do produto",
    kind: "text",
    placeholder: "Ex.: Vestido midi evasê verde",
    required,
  }),
  category: (): ToolField => ({ id: "category", label: "Categoria", kind: "select", options: CATEGORY, defaultValue: "Roupas femininas" }),
  notes: (label = "Informações extras (opcional)", placeholder = "Diferenciais reais, preço, público, tom de voz…"): ToolField => ({
    id: "notes",
    label,
    kind: "textarea",
    placeholder,
  }),
};

const v = (values: Record<string, string>, key: string, fallback = "não informado") => values[key]?.trim() || fallback;

const IMAGE_5 = (hint: string) => ({ min: 1, max: 5, label: "Imagens do produto", hint });

/* ---------------------------------- POV ---------------------------------- */
const pov: ToolDef = {
  id: "pov",
  title: "POV",
  description: "Gerador de prompts em ponto de vista (POV) para imagem e vídeo.",
  icon: Camera,
  panelTitle: "Produto e cena",
  resultTitle: "Prompts POV",
  cta: "Gerar prompts POV",
  notice: "Teste os prompts no Flow. Cada geração de imagem e vídeo é diferente: se não gostou, gere de novo.",
  emptyTitle: "Pronto para criar",
  emptyText: "Envie a imagem do produto, escolha o modo e clique em “Gerar prompts POV”.",
  input: {
    images: IMAGE_5("Até 5 imagens do produto (de preferência uma por cor ou ângulo)."),
    fields: [
      f.product(),
      f.category(),
      {
        id: "mode",
        label: "Modo no Flow",
        kind: "select",
        options: [
          { value: "frames", label: "Frames (imagem inicial + final + movimento)" },
          { value: "elementos", label: "Elementos / Omni Flash (um prompt de vídeo)" },
        ],
        defaultValue: "frames",
      },
      {
        id: "scene",
        label: "Cenário",
        kind: "select",
        options: [
          { value: "quarto com cama arrumada, vista de cima", label: "Quarto / cama (vista de cima)" },
          { value: "loja de varejo elegante", label: "Loja elegante" },
          { value: "casa, ambiente aconchegante", label: "Casa aconchegante" },
          { value: "mesa de madeira clara", label: "Mesa de madeira" },
          { value: "rua, luz natural de dia", label: "Rua / ao ar livre" },
        ],
        defaultValue: "quarto com cama arrumada, vista de cima",
      },
      {
        id: "idea",
        label: "Ideia de gancho (opcional)",
        kind: "textarea",
        placeholder: "Ex.: estalar os dedos e a roupa aparece na cama; rasgar o pacote; mudar de cor…",
      },
      {
        id: "copy",
        label: "Fala / copy em português (opcional)",
        kind: "textarea",
        placeholder: "Se vazio, a IA sugere uma fala curta baseada no que é visível.",
      },
    ],
  },
  system: `${BASE_SYSTEM}\n\n${PROMPT_CRAFT}\n\n${POLICY_NOTE}\n\nSua tarefa: criar prompts em ponto de vista (POV, primeira pessoa, mãos aparecendo) para o produto das imagens. Gere 3 variações de conceito, cada uma como uma seção cujo título é o nome do conceito. Dentro de cada seção entregue os itens necessários para o modo escolhido, com rótulos claros:
- Modo "frames": "Prompt da imagem 1", "Prompt da imagem 2", "Prompt de movimento (Flow)" e "Observações de uso".
- Modo "elementos": "Prompt de vídeo (Omni Flash)" e "Observações de uso".
Prompts técnicos em inglês, exceto falas, que ficam em português do Brasil entre aspas. Cada prompt deve ser autossuficiente.`,
  buildPrompt: (x) =>
    `Produto: ${v(x, "product", "ver imagens")}\nCategoria: ${v(x, "category")}\nModo: ${v(x, "mode")}\nCenário: ${v(x, "scene")}\nIdeia de gancho: ${v(x, "idea", "livre, escolha ganchos fortes")}\nFala/copy do usuário: ${v(x, "copy", "sugira uma fala curta")}\n\nAnalise as imagens do produto e gere as 3 variações.`,
  temperature: 0.9,
};

/* ---------------------------------- UGC ---------------------------------- */
const ugc: ToolDef = {
  id: "ugc",
  title: "UGC",
  description: "Geradores de conteúdo UGC para TikTok Shop.",
  icon: Clapperboard,
  panelTitle: "Produto e formato",
  resultTitle: "Prompts UGC",
  cta: "Gerar prompts UGC",
  notice: "Use a saída como ponto de partida e adapte à sua persona e ao seu nicho.",
  emptyTitle: "Pronto para criar",
  emptyText: "Envie a imagem do produto e clique em “Gerar prompts UGC”.",
  input: {
    images: IMAGE_5("Até 5 imagens do produto."),
    fields: [
      f.product(),
      f.category(),
      {
        id: "format",
        label: "Formato",
        kind: "select",
        options: [
          { value: "UGC dinâmico com apresentadora", label: "UGC dinâmico com apresentadora" },
          { value: "faceless (sem rosto), só mãos e corpo do ombro para baixo", label: "Faceless (sem rosto)" },
          { value: "unboxing com reação", label: "Unboxing com reação" },
          { value: "estilo chinês: microcenas rápidas de produto em uso", label: "Estilo chinês (microcenas)" },
          { value: "ASMR com mãos e texturas", label: "ASMR" },
        ],
        defaultValue: "UGC dinâmico com apresentadora",
      },
      {
        id: "duration",
        label: "Duração",
        kind: "select",
        options: [
          { value: "8 segundos", label: "8 s" },
          { value: "10 segundos", label: "10 s" },
          { value: "15 segundos (dois clipes de 8 s)", label: "15 s" },
        ],
        defaultValue: "10 segundos",
      },
      f.notes("Fala / diferenciais reais (opcional)", "Ex.: frete grátis, tecido não amassa, 3 cores…"),
    ],
  },
  system: `${BASE_SYSTEM}\n\n${PROMPT_CRAFT}\n\n${POLICY_NOTE}\n\nSua tarefa: criar roteiros e prompts de vídeo UGC para TikTok Shop. Gere 3 conceitos diferentes, cada um uma seção. Em cada seção entregue: "Gancho (0 a 2 s)", "Prompt de vídeo (Omni Flash)" em inglês com cenas numeradas e cronometradas, "Fala em português" (curta, natural, sem promessas) e "Observações de uso".`,
  buildPrompt: (x) =>
    `Produto: ${v(x, "product", "ver imagens")}\nCategoria: ${v(x, "category")}\nFormato: ${v(x, "format")}\nDuração: ${v(x, "duration")}\nInformações do usuário: ${v(x, "notes")}\n\nGere os 3 conceitos.`,
  temperature: 0.9,
};

/* ------------------------------- Influencer ------------------------------ */
const influencer: ToolDef = {
  id: "influencer",
  title: "Gerador de Influencer Realista",
  description: "Crie prompts para gerar influencers ultra-realistas para seus conteúdos.",
  icon: UserRound,
  panelTitle: "Persona",
  resultTitle: "Prompts da influencer",
  cta: "Gerar prompts da influencer",
  notice: "Descreva uma pessoa fictícia. Não use fotos de pessoas reais sem autorização.",
  emptyTitle: "Pronto para criar",
  emptyText: "Descreva a persona e clique em “Gerar prompts da influencer”.",
  input: {
    images: { min: 0, max: 3, label: "Referências de estilo (opcional)", hint: "Fotos de ambiente, roupa ou estilo. Não envie fotos de pessoas reais para copiar o rosto." },
    fields: [
      { id: "persona", label: "Persona", kind: "textarea", required: true, placeholder: "Ex.: mulher brasileira, 28 anos, pele morena clara, cabelo castanho ondulado, estilo casual…" },
      {
        id: "scene",
        label: "Ambiente",
        kind: "select",
        options: [
          { value: "quarto moderno e aconchegante", label: "Quarto moderno" },
          { value: "banheiro com espelho e luz dourada", label: "Banheiro / espelho" },
          { value: "loja de roupas elegante", label: "Loja de roupas" },
          { value: "sala de estar clara", label: "Sala de estar" },
        ],
        defaultValue: "quarto moderno e aconchegante",
      },
      f.notes("Roupa ou produto que ela usa (opcional)"),
    ],
  },
  system: `${BASE_SYSTEM}\n\n${PROMPT_CRAFT}\n\nSua tarefa: criar prompts para gerar UMA influencer fictícia ultra-realista e consistente. Entregue seções: "Prompt de identidade (imagem base)", "Variações de pose e ângulo" (4 prompts, mantendo a mesma pessoa), "Prompt de vídeo curto com ela" e "Regras de consistência". Imagens com aparência de foto de smartphone, pele com textura real, sem filtro excessivo. Nunca descreva uma pessoa real nem use nome de celebridade. Prompts técnicos em inglês.`,
  buildPrompt: (x) => `Persona: ${v(x, "persona")}\nAmbiente: ${v(x, "scene")}\nRoupa/produto: ${v(x, "notes")}`,
  temperature: 0.9,
};

/* --------------------------------- Copy ---------------------------------- */
const copy: ToolDef = {
  id: "copy",
  title: "Gerador de Copy TikTok Shop",
  description: "Crie textos persuasivos para seus produtos no TikTok Shop.",
  icon: PenLine,
  panelTitle: "Produto",
  resultTitle: "Copy gerada",
  cta: "Gerar copy",
  notice: "Revise antes de publicar: confirme preço, prazos e características com seu fornecedor.",
  emptyTitle: "Pronto para criar",
  emptyText: "Envie imagens do produto e clique em “Gerar copy”.",
  input: {
    images: IMAGE_5("Até 5 imagens do produto."),
    fields: [f.product(), f.category(), f.notes("Diferenciais reais e público (opcional)")],
  },
  system: `${BASE_SYSTEM}\n\n${POLICY_NOTE}\n\nSua tarefa: escrever copy persuasiva para TikTok Shop em português do Brasil, tom de criadora de conteúdo, linguagem simples e direta. Entregue seções: "Títulos do anúncio" (5, até 60 caracteres), "Descrição do produto" (2 versões curtas), "Fala para vídeo" (3 versões de 15 a 25 segundos, com gancho nos 2 primeiros segundos) e "Hashtags" (1 item com 8 a 12 hashtags). Use só informações visíveis ou fornecidas.`,
  buildPrompt: (x) => `Produto: ${v(x, "product", "ver imagens")}\nCategoria: ${v(x, "category")}\nInformações do usuário: ${v(x, "notes")}`,
  temperature: 0.85,
};

/* ------------------------------ Headlines -------------------------------- */
const headlines: ToolDef = {
  id: "headlines",
  title: "Gerador de Headlines",
  description: "Gere 10 headlines com dor + solução, espontâneas e anti-violação para o TikTok Shop.",
  icon: Type,
  panelTitle: "Imagem de Referência",
  resultTitle: "Headlines Geradas",
  cta: "Gerar Headlines",
  notice: "Teste diferentes headlines no seu vídeo. A primeira frase é o que segura o usuário no TikTok.",
  emptyTitle: "Pronto para criar headlines",
  emptyText: "Anexe imagens do produto e clique em “Gerar Headlines”.",
  input: {
    images: IMAGE_5("Anexe até 5 imagens do produto. A IA vai gerar 10 headlines focadas em dor e solução, com linguagem espontânea."),
    fields: [f.product(), f.notes("Dor ou público (opcional)", "Ex.: mulheres que sofrem para achar calça que não marca…")],
  },
  system: `${BASE_SYSTEM}\n\n${POLICY_NOTE}\n\nSua tarefa: gerar EXATAMENTE 10 headlines (frases de abertura de vídeo) focadas em dor + solução, em linguagem espontânea de quem fala com uma amiga, sem cara de anúncio. Regras: até 90 caracteres; sem promessas de resultado; sem afirmações médicas; sem "antes e depois"; sem preço; sem comparar marcas; sem termos que o TikTok costuma barrar. Crie uma única seção "Headlines" com os 10 itens, em que o rótulo é o ângulo (ex.: "Curiosidade", "Dor", "Identificação", "Prova social leve", "Urgência leve") e o hint explica por que segura a atenção.`,
  buildPrompt: (x) => `Produto: ${v(x, "product", "ver imagens")}\nDor/público: ${v(x, "notes")}`,
  temperature: 0.95,
};

/* ------------------------------ Defesa ----------------------------------- */
const defesa: ToolDef = {
  id: "defesa",
  title: "Gerador de Defesa para Violações",
  description: "Gere textos de defesa profissionais para recorrer a violações no TikTok Shop.",
  icon: ShieldAlert,
  panelTitle: "Detalhes da violação",
  resultTitle: "Textos de defesa",
  cta: "Gerar defesa",
  notice: "Só recorra se tiver razão. Ajuste os fatos para o que realmente aconteceu; textos falsos pioram o caso.",
  emptyTitle: "Pronto para criar a defesa",
  emptyText: "Conte o que aconteceu e clique em “Gerar defesa”.",
  input: {
    images: { min: 0, max: 5, label: "Prints (opcional)", hint: "Print da notificação de violação, do produto ou do vídeo." },
    fields: [
      { id: "type", label: "Tipo de violação", kind: "text", required: true, placeholder: "Ex.: Informação enganosa, conteúdo proibido, direitos autorais…" },
      { id: "what", label: "O que o TikTok informou", kind: "textarea", required: true, placeholder: "Cole o texto da notificação." },
      { id: "facts", label: "O que realmente aconteceu", kind: "textarea", required: true, placeholder: "Fatos verdadeiros que sustentam sua defesa, com datas e provas que você tem." },
    ],
  },
  system: `${BASE_SYSTEM}\n\nSua tarefa: redigir recursos formais ao suporte do TikTok Shop em português do Brasil. Use SOMENTE os fatos fornecidos pelo usuário, sem inventar provas, datas ou documentos. Tom respeitoso, objetivo e técnico. Entregue seções: "Defesa curta (até 600 caracteres)", "Defesa completa", "Defesa em inglês" e "Provas para anexar" (lista do que o usuário deve juntar). Se os fatos informados indicarem que a violação procede, diga isso com gentileza no resumo e sugira corrigir o anúncio em vez de recorrer.`,
  buildPrompt: (x) => `Tipo de violação: ${v(x, "type")}\nNotificação do TikTok: ${v(x, "what")}\nFatos do usuário: ${v(x, "facts")}`,
  temperature: 0.4,
};

/* ----------------------------- Crescimento ------------------------------- */
const crescimento: ToolDef = {
  id: "crescimento",
  title: "Prompts para Crescimento de Contas",
  description: "Estratégias e prompts para crescer sua conta no TikTok.",
  icon: TrendingUp,
  panelTitle: "Sua conta",
  resultTitle: "Plano de crescimento",
  cta: "Gerar plano",
  notice: "Crescimento depende de consistência. Teste, meça e ajuste a cada semana.",
  emptyTitle: "Pronto para criar o plano",
  emptyText: "Conte sobre sua conta e clique em “Gerar plano”.",
  input: {
    fields: [
      { id: "niche", label: "Nicho", kind: "text", required: true, placeholder: "Ex.: moda feminina, casa e organização…" },
      { id: "stage", label: "Fase atual", kind: "select", options: [
        { value: "começando do zero", label: "Começando do zero" },
        { value: "até 1.000 seguidores", label: "Até 1.000 seguidores" },
        { value: "1.000 a 10.000 seguidores", label: "1.000 a 10.000" },
        { value: "mais de 10.000 seguidores", label: "Mais de 10.000" },
      ], defaultValue: "começando do zero" },
      f.notes("Situação e objetivo (opcional)", "Quantos vídeos posta por semana, o que já testou, meta de vendas…"),
    ],
  },
  system: `${BASE_SYSTEM}\n\nSua tarefa: montar um plano prático de crescimento de conta no TikTok Shop Brasil. Entregue seções: "Diagnóstico rápido", "Plano de 7 dias" (um item por dia, com formato do vídeo e gancho), "Prompts prontos para o Gemini" (5 prompts que o usuário pode colar para gerar ideias, roteiros e legendas do nicho) e "Métricas para acompanhar". Seja realista: não prometa números de seguidores nem de vendas.`,
  buildPrompt: (x) => `Nicho: ${v(x, "niche")}\nFase: ${v(x, "stage")}\nSituação: ${v(x, "notes")}`,
  temperature: 0.8,
};

/* ----------------------------- Análise de produto ------------------------ */
const analiseProduto: ToolDef = {
  id: "analise-produto",
  title: "Análise de Produto",
  description: "Análise completa do produto por imagens: público, dores e direcionamento de copy.",
  icon: ScanSearch,
  panelTitle: "Imagens do Produto",
  resultTitle: "Resultado da Análise",
  cta: "Analisar Produto",
  notice: "Use a análise como base estratégica. Sempre valide as informações com dados reais do seu nicho.",
  emptyTitle: "Pronto para analisar",
  emptyText: "Anexe imagens do produto e clique em “Analisar Produto” para receber insights estratégicos.",
  input: {
    images: IMAGE_5("Anexe até 5 imagens do produto para receber uma análise completa de público-alvo, dores e direcionamentos para copy."),
    fields: [f.product(), f.notes("Contexto (opcional)", "Preço, onde vende, concorrentes que conhece…")],
  },
  system: `${BASE_SYSTEM}\n\n${POLICY_NOTE}\n\nSua tarefa: analisar o produto das imagens como estrategista de TikTok Shop. Entregue seções: "O que o produto é" (descrição objetiva só do que se vê), "Público-alvo provável", "Dores que ele resolve", "Desejos e gatilhos", "Ângulos de vídeo" (5, com gancho), "Direcionamento de copy" e "Riscos de violação" (pontos que podem ser barrados e como evitar). Deixe claro quando algo é hipótese.`,
  buildPrompt: (x) => `Produto: ${v(x, "product", "ver imagens")}\nContexto: ${v(x, "notes")}`,
  temperature: 0.6,
};

/* ----------------------------- Autoanálise de vídeo ---------------------- */
const analiseVideo: ToolDef = {
  id: "analise-video",
  title: "Autoanálise de Vídeo",
  description: "Envie seu vídeo e receba pontos fortes, o que melhorar, risco de violação e potencial de venda.",
  icon: Video,
  panelTitle: "Seu Vídeo",
  resultTitle: "Avaliação",
  cta: "Avaliar Vídeo",
  notice: "Use a avaliação como guia. Adapte ao seu produto e nicho.",
  emptyTitle: "Pronto para avaliar",
  emptyText: "Envie seu vídeo e clique em “Avaliar Vídeo” para receber a avaliação completa.",
  input: {
    video: { maxMB: 100, label: "Clique para enviar vídeo", hint: "MP4, MOV, WEBM (máx. 100MB)" },
    fields: [f.product(), f.notes("Objetivo do vídeo (opcional)", "Ex.: vender no TikTok Shop, gerar tráfego…")],
  },
  system: `${BASE_SYSTEM}\n\nSua tarefa: avaliar um vídeo curto de venda para TikTok Shop assistindo imagem e áudio. Entregue seções: "Nota geral" (item com nota de 0 a 10 e justificativa), "Pontos fortes", "O que melhorar" (com ação concreta), "Gancho e retenção" (análise dos primeiros 3 segundos e do ritmo), "Risco de violação" (frases ou cenas que podem ser barradas, citando o trecho aproximado em segundos), "Público provável" e "Potencial de venda" (hipótese, sem prometer números). Seja direto e específico.`,
  buildPrompt: (x) => `Produto: ${v(x, "product")}\nObjetivo: ${v(x, "notes")}\n\nAvalie o vídeo anexado.`,
  temperature: 0.5,
};

export const AI_TOOLS: ToolDef[] = [pov, ugc, influencer, copy, headlines, defesa, crescimento, analiseProduto, analiseVideo];

export const getTool = (id: string) => AI_TOOLS.find((t) => t.id === id);
