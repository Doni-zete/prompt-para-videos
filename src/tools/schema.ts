/** Schema único de saída (subconjunto OpenAPI aceito pelo Gemini). */
export const OUTPUT_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING", description: "Resumo curto (1 a 2 frases) do que foi gerado." },
    sections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          items: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                label: { type: "STRING", description: "Rótulo curto do item, ex.: 'Prompt de imagem'." },
                text: { type: "STRING", description: "Conteúdo pronto para copiar." },
                hint: { type: "STRING", description: "Dica de uso opcional, 1 frase." },
              },
              required: ["text"],
            },
          },
        },
        required: ["title", "items"],
      },
    },
  },
  required: ["sections"],
} as const;
