import { describe, expect, it } from "vitest";
import { cleanUserData, isSyncedKey } from "./userDataKeys";

describe("o que entra no arquivo do projeto", () => {
  it("metas e marcações do Progresso Semanal sincronizam", () => {
    expect(isSyncedKey("progresso:goals")).toBe(true);
    expect(isSyncedKey("progresso:done")).toBe(true);
    expect(isSyncedKey("progresso:planilha")).toBe(true);
  });
  it("chave do Gemini, histórico e diagnóstico ficam de fora", () => {
    for (const k of ["gemini:key", "history", "diag:events", "recent:items", "usage"]) expect(isSyncedKey(k), k).toBe(false);
  });
  it("cleanUserData mantém só as chaves permitidas", () => {
    expect(cleanUserData({ "progresso:done": {}, "diag:events": [] })).toEqual({ "progresso:done": {} });
    expect(cleanUserData([])).toBeNull();
  });
});
