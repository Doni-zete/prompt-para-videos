import { describe, expect, it } from "vitest";
import { addEvent, buildReport, fmtBytes, MAX_EVENTS, sanitize, type DiagEvent } from "./diagnostics";

describe("diagnóstico: sanitize", () => {
  it("remove chave do Gemini em qualquer formato", () => {
    const key = "AIzaSyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q";
    expect(sanitize(`falhou com ${key}`)).not.toContain(key);
    const url = sanitize(`GET https://x/models?key=${key}&alt=json`);
    expect(url).not.toContain(key);
    expect(url).toContain("&alt=json");
    expect(sanitize("GET https://x/m?key=segredo123&a=1")).toBe("GET https://x/m?key=[removido]&a=1");
    expect(sanitize(`x-goog-api-key: ${key}`)).not.toContain(key);
    expect(sanitize("Authorization: Bearer abcdefghijklmnop1234")).not.toContain("abcdefghijklmnop1234");
  });
  it("limita o tamanho e junta espaços", () => {
    expect(sanitize("a   b\n c")).toBe("a b c");
    expect(sanitize("x".repeat(1000)).length).toBe(300);
  });
});

const ev = (m: string, where = "/galeria") => ({ kind: "video" as const, message: m, where });

describe("diagnóstico: lista de problemas", () => {
  it("o mesmo problema vira uma linha com contador e sobe para o topo", () => {
    let l: DiagEvent[] = [];
    l = addEvent(l, ev("a"), 1);
    l = addEvent(l, ev("b"), 2);
    l = addEvent(l, ev("a"), 3);
    expect(l.map((e) => e.message)).toEqual(["a", "b"]);
    expect(l[0]).toMatchObject({ count: 2, first: 1, last: 3 });
  });
  it("na outra tela é outro problema", () => {
    let l: DiagEvent[] = [];
    l = addEvent(l, ev("a", "/x"), 1);
    l = addEvent(l, ev("a", "/y"), 2);
    expect(l).toHaveLength(2);
  });
  it("guarda no máximo 100", () => {
    let l: DiagEvent[] = [];
    for (let i = 0; i < MAX_EVENTS + 20; i++) l = addEvent(l, ev(`m${i}`), i);
    expect(l).toHaveLength(MAX_EVENTS);
    expect(l[0].message).toBe(`m${MAX_EVENTS + 19}`);
  });
});

describe("diagnóstico: relatório", () => {
  it("traz versão, estado e problemas, sem chave", () => {
    const text = buildReport({
      version: "6.7.0", builtAt: "2026-10-09", geminiConnected: true, autoplay: true, userAgent: "Chrome AIzaSyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q", viewport: "1500x950",
      usage: { keys: 3, bytes: 2048, biggest: [{ key: "favorites", bytes: 1500 }] },
      events: [{ kind: "gemini", message: "QUOTA: limite", where: "/ferramenta/ugc", first: 1, last: 2, count: 2 }],
    });
    expect(text).toContain("Versão: 6.7.0");
    expect(text).toContain("Gemini: conectado");
    expect(text).toContain("[Falha do Gemini] QUOTA: limite");
    expect(text).toContain("2.0 KB");
    expect(text).not.toContain("AIzaSyA1b2");
  });
  it("formata bytes", () => {
    expect(fmtBytes(10)).toBe("10 B");
    expect(fmtBytes(1536)).toBe("1.5 KB");
  });
});
