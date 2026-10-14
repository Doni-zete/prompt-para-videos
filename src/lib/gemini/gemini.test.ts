import { describe, expect, it } from "vitest";
import { parseModelJson } from "./json";
import { rankModels } from "./models";
import { classifyHttp, parseRetryDelay } from "./errors";

describe("parseModelJson", () => {
  it("lê JSON puro", () => {
    expect(parseModelJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });
  it("remove cercas de markdown e texto em volta", () => {
    expect(parseModelJson<{ a: number }>('Claro!\n```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });
  it("corrige vírgulas sobrando", () => {
    expect(parseModelJson<{ a: number[] }>('{"a":[1,2,],}')).toEqual({ a: [1, 2] });
  });
  it("falha quando não há JSON", () => {
    expect(() => parseModelJson("sem json aqui")).toThrow();
  });
});

describe("rankModels", () => {
  const m = (name: string, methods = ["generateContent"]) => ({ name: `models/${name}`, supportedGenerationMethods: methods });
  it("prioriza a lista preferida e descarta modelos que não servem", () => {
    const ranked = rankModels([
      m("gemini-2.5-flash"),
      m("gemini-3.5-flash"),
      m("gemini-3.6-flash"),
      m("gemini-3.1-flash-image"),
      m("gemini-embedding-001", ["embedContent"]),
      m("gemma-3-27b"),
      m("gemini-3.1-pro-preview"),
    ]);
    expect(ranked.slice(0, 3)).toEqual(["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash"]);
    expect(ranked).toContain("gemini-3.1-pro-preview");
    expect(ranked).not.toContain("gemini-3.1-flash-image");
    expect(ranked).not.toContain("gemma-3-27b");
    expect(ranked).not.toContain("gemini-embedding-001");
  });
  it("ordena modelos desconhecidos: flash antes de pro, versão mais nova primeiro", () => {
    const ranked = rankModels([m("gemini-4-pro"), m("gemini-4-flash"), m("gemini-3.9-flash")]);
    expect(ranked).toEqual(["gemini-4-flash", "gemini-3.9-flash", "gemini-4-pro"]);
  });
});

describe("classifyHttp", () => {
  it("reconhece chave inválida", () => {
    const e = classifyHttp(400, { error: { message: "API key not valid. Please pass a valid API key." } });
    expect(e.code).toBe("INVALID_KEY");
  });
  it("reconhece cota e lê o retryDelay", () => {
    const body = { error: { message: "quota", details: [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "12s" }] } };
    const e = classifyHttp(429, body);
    expect(e.code).toBe("QUOTA");
    expect(e.retryAfterMs).toBe(12000);
    expect(parseRetryDelay(body)).toBe(12000);
  });
  it("reconhece modelo inexistente e erro de servidor", () => {
    expect(classifyHttp(404, {}).code).toBe("MODEL_NOT_FOUND");
    expect(classifyHttp(503, {}).code).toBe("SERVER");
  });
});
