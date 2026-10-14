import {
  Activity, BedDouble, BookOpen, Bath, Camera, ChefHat, Crown, Dumbbell, Gamepad2, Layers, Leaf, Maximize, Monitor, Package, ShoppingBag, Shirt, Sparkles, Sun, UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export interface Option {
  id: string;
  label: string;
  desc?: string;
  icon: LucideIcon;
}

/** UGC e Provador: cenário de fundo. */
export const SCENES: Option[] = [
  { id: "quarto", label: "Quarto", icon: BedDouble },
  { id: "estudio", label: "Estúdio", icon: Camera },
  { id: "ar-livre", label: "Ao ar livre", icon: Sun },
  { id: "academia", label: "Academia", icon: Dumbbell },
  { id: "cozinha", label: "Cozinha", icon: UtensilsCrossed },
  { id: "escritorio", label: "Escritório", icon: Monitor },
  { id: "banheiro", label: "Banheiro", icon: Bath },
  { id: "loja", label: "Loja", icon: ShoppingBag },
  { id: "natureza", label: "Natureza", icon: Leaf },
  { id: "custom", label: "Personalizado", icon: Sparkles },
];

export const INTERACTIONS: Option[] = [
  { id: "frontal", label: "Câmera Frontal", desc: "Fala e mostra o produto direto para a câmera.", icon: Camera },
  { id: "espelho", label: "No Espelho", desc: "Selfie no espelho, mostrando o look e o produto.", icon: Maximize },
];

export const POSES: Option[] = [
  { id: "corpo-inteiro", label: "Em pé, corpo inteiro", desc: "Da cabeça aos pés.", icon: Shirt },
  { id: "cintura", label: "Em pé, cintura para cima", desc: "Enquadramento médio.", icon: Camera },
  { id: "sentado", label: "Sentado(a)", desc: "Sentado em um sofá ou cama.", icon: BedDouble },
];

/** POV: cenário. */
export const POV_SCENES: Option[] = [
  { id: "bancada-marmore", label: "Bancada de Mármore", icon: ChefHat },
  { id: "setup-tech", label: "Setup Gamer / Tech", icon: Gamepad2 },
  { id: "mesa-escritorio", label: "Mesa de Escritório", icon: BookOpen },
  { id: "closet", label: "Closet & Maquiagem", icon: Shirt },
  { id: "unboxing", label: "Unboxing (Madeira)", icon: Package },
  { id: "custom", label: "Personalizado", icon: Sparkles },
];

export const POV_HANDS: Option[] = [
  { id: "luvas", label: "Mãos com luvas brancas", desc: "Exibe mãos usando luvas brancas.", icon: Layers },
  { id: "masculina", label: "Mãos naturais masculina", desc: "Exibe mãos masculinas com aparência natural.", icon: Layers },
  { id: "feminina", label: "Mãos naturais feminina", desc: "Exibe mãos femininas com aparência natural.", icon: Layers },
  { id: "sem-maos", label: "Sem mãos", desc: "Nenhuma mão visível na cena.", icon: Layers },
];

export const POV_PRESENTATIONS: Option[] = [
  { id: "textura", label: "Textura do material", desc: "Qualidade física e toque.", icon: Layers },
  { id: "acabamento", label: "Acabamento / Design", desc: "Estética geral do item.", icon: Sparkles },
  { id: "premium", label: "Detalhes premium", desc: "Mostrando o produto e acabamentos.", icon: Crown },
  { id: "escala", label: "Tamanho real", desc: "Noção de escala na mão.", icon: Maximize },
  { id: "funcionalidade", label: "Funcionalidade", desc: "Produto em ação e uso.", icon: Activity },
];

/** 8 s por take: 1 a 5 takes. */
export const DURATIONS = [1, 2, 3, 4, 5].map((takes) => ({ takes, label: `${takes * 8}s`, sub: `${takes} ${takes === 1 ? "TAKE" : "TAKES"}` }));

export const TONES = ["Grave", "Médio", "Agudo", "Doce", "Energético", "Sábio"] as const;
export const VOICES = [
  { id: "feminino", label: "Feminino" },
  { id: "masculino", label: "Masculino" },
] as const;
export type VoiceId = (typeof VOICES)[number]["id"];

export const labelOf = (list: Option[], id: string) => list.find((o) => o.id === id)?.label ?? id;
