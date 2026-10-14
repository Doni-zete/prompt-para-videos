import {
  CalendarCheck,
  Camera,
  Clapperboard,
  Radar,
  Images,
  ScanFace,
  Shirt,
  PenLine,
  ScanSearch,
  ShieldAlert,
  WandSparkles,
  Sparkles,
  UsersRound,
  Trophy,
  TrendingUp,
  Type,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";

export interface CatalogEntry {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  needsGemini: boolean;
  badge?: string;
  /** Palavras extras para a busca do painel. */
  keywords?: string;
  /** Já tem item no menu lateral: não repete como card no painel. */
  inMenu?: boolean;
  children?: { title: string; to: string; icon: LucideIcon }[];
}

/** Ordem e textos seguem o painel original, com as ferramentas agora ligadas ao Gemini. */
export const CATALOG: CatalogEntry[] = [
  { id: "trendly", title: "Tendências", description: "Estilos UGC, POV e Provador, avatares e hacks de vídeo.", icon: WandSparkles, to: "/trendly", needsGemini: false, badge: "Novo" },
  { id: "humano", title: "Humanizar IA", description: "Prompts que tiram a cara de IA de fotos e vídeos, com comparação Original × Realista.", icon: ScanFace, to: "/humano", needsGemini: false, badge: "Novo" },
  { id: "manequins", title: "Manequins", description: "10 vídeos de roupa em manequim (5 de frente e 5 de costas) e o prompt para vestir o manequim com a sua peça.", icon: Shirt, to: "/manequins", needsGemini: false, badge: "Novo" },
  { id: "2k-seguidores", title: "2K DE SEGUIDORES", description: "Kit para crescer um perfil de personagem no TikTok: 13 prompts de criação de perfil, a base obrigatória e 50 ideias de vídeo prontas para copiar.", icon: UsersRound, to: "/2k-seguidores", needsGemini: false, badge: "Novo", keywords: "seguidores tiktok perfil personagem modelo profissao videos roteiro 2k crescimento" },
  { id: "galeria", title: "Galeria de Prompts", description: "Prompts de imagem e vídeo para influencer IA e os Prompts prontos (Vídeos do TikTok, Prompts Prontas e Movimentos Especiais), com filtros, favoritos, edição e vídeos novos pela pasta de mídia.", icon: Images, to: "/galeria", needsGemini: false, badge: "Novo", inMenu: true },
  { id: "progresso", title: "Progresso Semanal", description: "Metas diárias, planilhas Excel/CSV editáveis e relatórios de afiliados com gráficos coloridos.", icon: CalendarCheck, to: "/progresso", needsGemini: false, badge: "Novo", inMenu: true, keywords: "metas semana habitos checklist calendario rotina planilha excel relatorio afiliados comissao graficos" },
  {
    id: "geradores",
    title: "Geradores de Prompt",
    description: "Todos os geradores num só lugar: POV, UGC, influencer, copy, análise, headlines, defesa e crescimento.",
    icon: Sparkles,
    to: "/geradores",
    needsGemini: true,
    inMenu: true,
    keywords: "pov ugc influencer realista copy tiktok shop analisador conteudo headlines defesa violacoes crescimento contas",
  },
  { id: "mais-vendidos", title: "Produtos mais vendidos", description: "Descubra os produtos que mais vendem no TikTok Shop.", icon: Trophy, to: "/em-breve/mais-vendidos", needsGemini: false, badge: "Em breve" },
  { id: "radar", title: "Radar de Produto em Alta", description: "Análise de produtos via Kalodata.", icon: Radar, to: "/em-breve/radar", needsGemini: false, badge: "Em breve" },
];

export const SOON: Record<string, { title: string; text: string }> = {
  "mais-vendidos": {
    title: "Produtos mais vendidos",
    text: "Este painel precisa de uma fonte de dados de vendas do TikTok Shop, e o Gemini gratuito não tem acesso a esses números. Por enquanto, cadastre ou cole a lista de produtos em Tendências > Produtos (“Importar lista”): ela alimenta o passo “Selecione o Produto Viral”.",
  },
  radar: {
    title: "Radar de Produto em Alta",
    text: "Um radar de produtos em alta precisa de uma fonte de dados de vendas de fora do app. A Kalodata oferece uma API cobrada por créditos (consulte a página de preços dela); como a chave de uma API não pode ficar guardada no navegador, a integração exigiria uma tarefa agendada ou um servidor. Enquanto isso, cadastre os produtos na lista de Tendências e use “Análise de Produto” para avaliar qualquer produto por imagem.",
  },
};

/** Geradores de IA reunidos na página "Geradores de Prompt" (as rotas /ferramenta/:id continuam valendo). */
export const GENERATORS: CatalogEntry[] = [
  { id: "pov", title: "POV", description: "Geradores de prompt em ponto de vista (POV) para imagens e vídeos.", icon: Camera, to: "/ferramenta/pov", needsGemini: true },
  { id: "ugc", title: "UGC", description: "Geradores de conteúdo UGC para TikTok Shop.", icon: Clapperboard, to: "/ferramenta/ugc", needsGemini: true },
  { id: "influencer", title: "Gerador de Influencer Realista", description: "Crie prompts para gerar influencers ultra-realistas para seus conteúdos.", icon: UserRound, to: "/ferramenta/influencer", needsGemini: true },
  { id: "copy", title: "Gerador de Copy TikTok Shop", description: "Crie textos persuasivos para seus produtos no TikTok Shop.", icon: PenLine, to: "/ferramenta/copy", needsGemini: true },
  { id: "analise-produto", title: "Análise de Produto", description: "Analisa um produto por texto ou imagem e diz se vale a pena vender.", icon: ScanSearch, to: "/ferramenta/analise-produto", needsGemini: true },
  { id: "analise-video", title: "Autoanálise de Vídeo", description: "Avalia um vídeo viral ou o seu e aponta o que repetir e o que melhorar.", icon: Video, to: "/ferramenta/analise-video", needsGemini: true },
  { id: "headlines", title: "Gerador de Headlines", description: "Gere 10 headlines com dor + solução, espontâneas e anti-violação para o TikTok Shop.", icon: Type, to: "/ferramenta/headlines", needsGemini: true },
  { id: "defesa", title: "Gerador de Defesa para Violações", description: "Gere textos de defesa profissionais para recorrer a violações no TikTok Shop.", icon: ShieldAlert, to: "/ferramenta/defesa", needsGemini: true },
  { id: "crescimento", title: "Prompts para Crescimento de Contas", description: "Estratégias e prompts para crescer sua conta no TikTok.", icon: TrendingUp, to: "/ferramenta/crescimento", needsGemini: true },
];
