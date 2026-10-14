export type Demand = "alta" | "em-alta" | "";

export interface Product {
  /** Também é o nome do arquivo da foto: public/media/products/<id>.jpg */
  id: string;
  name: string;
  demand: Demand;
  /** Item de exemplo que veio com o app (não são dados reais de vendas). */
  example?: boolean;
}

const ex = (id: string, name: string, demand: Demand): Product => ({ id, name, demand, example: true });

/** Lista de exemplo para o passo "Selecione o Produto Viral". Edite em Produtos. */
export const SEED_PRODUCTS: Product[] = [
  ex("camera-wifi", "Câmera Wi-Fi 360 com visão noturna", "alta"),
  ex("spray-bucal", "Spray bucal 15 ml (kit com 2)", "alta"),
  ex("calca-feminina", "Calça feminina cintura alta casual", "alta"),
  ex("capinha-celular", "Capinha de celular estampada", "em-alta"),
  ex("bolsa-termica", "Bolsa térmica expansível", "em-alta"),
  ex("blusa-dry-fit", "Blusa dry fit feminina para academia", "em-alta"),
  ex("corrente-cadeado", "Corrente com cadeado 4 mm", "em-alta"),
  ex("bone-liso", "Boné liso de algodão", "em-alta"),
  ex("meia-cano-alto", "Meia cano alto (kit com pares)", "em-alta"),
  ex("relogio-inteligente", "Relógio inteligente tela ampla", "em-alta"),
  ex("mochila-notebook", "Mochila impermeável para notebook", "em-alta"),
  ex("conjunto-fitness", "Conjunto fitness canelado", "em-alta"),
];
