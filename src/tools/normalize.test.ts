import { describe, expect, it } from "vitest";
import { normalizeOutput, outputToText } from "./normalize";

describe("normalizeOutput", () => {
  it("descarta itens vazios e seções sem itens", () => {
    const out = normalizeOutput({
      summary: " ok ",
      sections: [
        { title: "A", items: [{ text: " um " }, { text: "" }, { label: "L", text: "dois", hint: "h" }] },
        { title: "B", items: [] },
        { items: [{ text: "x" }] },
      ],
    });
    expect(out.summary).toBe("ok");
    expect(out.sections).toHaveLength(2);
    expect(out.sections[0].items.map((i) => i.text)).toEqual(["um", "dois"]);
    expect(out.sections[1].title).toBe("Resultado");
  });
  it("tolera lixo", () => {
    expect(normalizeOutput(null).sections).toEqual([]);
    expect(normalizeOutput({ sections: "x" }).sections).toEqual([]);
  });
  it("gera texto para exportação", () => {
    const text = outputToText(normalizeOutput({ sections: [{ title: "T", items: [{ label: "L", text: "corpo", hint: "dica" }] }] }));
    expect(text).toContain("=== T ===");
    expect(text).toContain("[L]\ncorpo");
    expect(text).toContain("Dica: dica");
  });
});
