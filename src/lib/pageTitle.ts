import { CATALOG, GENERATORS, SOON } from "../data/catalog";
import { STYLES } from "../trendly/data/styles";

export const APP_NAME = "Prompt para Vídeo";

const STATIC: Record<string, string> = {
  "/": "Painel",
  "/divulgador": "Divulgador",
  "/galeria": "Galeria de Prompts",
  "/geradores": "Geradores de Prompt",
  "/progresso": "Progresso Semanal",
  "/manequins": "Manequins",
  "/2k-seguidores": "2K DE SEGUIDORES",
  "/humano": "Humanizar IA",
  "/configuracoes": "Configurações",
  "/trendly/reels": "Reels Studio",
  "/trendly/agente": "Agente IA",
  "/trendly/influencer": "Influencer Studio",
  "/trendly/hacks": "Hacks Virais",
  "/trendly/produtos": "Produtos",
  "/trendly/midia": "Mapa de mídia",
};

const HACKS: Record<string, string> = { cartomante: "Cartomante", religioso: "Religioso", frutas: "Frutas Falantes" };

/** Título da aba do navegador para cada tela (ajuda a distinguir várias abas abertas e quem usa leitor de tela). */
export function titleFor(pathname: string): string {
  const p = pathname.replace(/\/+$/, "") || "/";
  let name: string | undefined = STATIC[p];
  if (p.startsWith("/ofertas/")) name = "Promoções";
  if (!name) name = [...CATALOG, ...GENERATORS].find((c) => c.to === p)?.title;
  if (!name) {
    const m = p.match(/^\/trendly\/reels\/([^/]+)$/);
    if (m) {
      const s = STYLES.find((x) => x.id === m[1]);
      if (s) name = `Reels Studio: ${s.title}`;
    }
  }
  if (!name) {
    const m = p.match(/^\/trendly\/hacks\/([^/]+)$/);
    if (m && HACKS[m[1]]) name = `Hacks Virais: ${HACKS[m[1]]}`;
  }
  if (!name) {
    const m = p.match(/^\/em-breve\/([^/]+)$/);
    if (m && SOON[m[1]]) name = SOON[m[1]].title;
  }
  if (!name) name = "Página não encontrada";
  return p === "/" ? `${APP_NAME} | TikTok Shop Creator` : `${name} | ${APP_NAME}`;
}
