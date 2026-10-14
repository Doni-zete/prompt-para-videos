import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isSyncedKey } from "../src/lib/userDataKeys";
import { saveUserData } from "./user-data";

describe("userDataKeys", () => {
  it("sincroniza prompts, edições e favoritos, e nunca chave, histórico ou conversas", () => {
    for (const k of ["custom:prontas", "overrides:videos", "galeria:edits", "favorites", "trendly:favorites", "trendly:products-v2"]) expect(isSyncedKey(k)).toBe(true);
    for (const k of ["key", "apikey", "history:pov", "trendly:agent", "usage:2026", "gemini-key", "model", "name"]) expect(isSyncedKey(k)).toBe(false);
  });
});

describe("saveUserData", () => {
  const file = () => join(mkdtempSync(join(tmpdir(), "ud-")), "src", "data", "userData.json");
  it("grava só as chaves permitidas e carimba a data", () => {
    const f = file();
    const r = saveUserData(f, JSON.stringify({ data: { "custom:prontas": [{ id: "a" }], favorites: ["x"], "gemini-key": "SEGREDO", "history:pov": [1] } }), new Date("2026-01-02T03:04:05Z"));
    expect(r).toEqual({ ok: true, savedAt: "2026-01-02T03:04:05.000Z", keys: 2 });
    const txt = readFileSync(f, "utf8");
    expect(txt).not.toContain("SEGREDO");
    expect(JSON.parse(txt).data["custom:prontas"]).toEqual([{ id: "a" }]);
  });
  it("recusa JSON quebrado, formato errado e arquivo gigante", () => {
    const f = file();
    expect(saveUserData(f, "{nope").ok).toBe(false);
    expect(saveUserData(f, JSON.stringify({ data: [1] })).ok).toBe(false);
    expect(saveUserData(f, JSON.stringify({ data: { favorites: "x".repeat(6 * 1024 * 1024) } })).ok).toBe(false);
  });
});
