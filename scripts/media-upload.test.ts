import { mkdtempSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { saveMedia } from "./media-upload";

const dir = () => mkdtempSync(join(tmpdir(), "media-"));
const buf = Buffer.from("x");

describe("saveMedia", () => {
  it("grava na pasta certa e cria a pasta", () => {
    const d = dir();
    expect(saveMedia(d, "poses", "sentado", ".MP4", buf)).toEqual({ ok: true, saved: "poses/sentado.mp4", replaced: [] });
    expect(existsSync(join(d, "poses", "sentado.mp4"))).toBe(true);
  });
  it("troca o vídeo antigo, mas mantém a capa em imagem", () => {
    const d = dir();
    mkdirSync(join(d, "poses"));
    writeFileSync(join(d, "poses", "sentado.webm"), "a");
    writeFileSync(join(d, "poses", "Sentado.jpg"), "b");
    const r = saveMedia(d, "poses", "sentado", ".mp4", buf);
    expect(r.ok && r.replaced).toEqual(["sentado.webm"]);
    expect(readdirSync(join(d, "poses")).sort()).toEqual(["Sentado.jpg", "sentado.mp4"]);
  });
  it("recusa caminho fora de public/media, nome estranho e formato não suportado", () => {
    const d = dir();
    expect(saveMedia(d, "..", "a", ".jpg", buf).ok).toBe(false);
    expect(saveMedia(d, "poses/../..", "a", ".jpg", buf).ok).toBe(false);
    expect(saveMedia(d, "poses", "../a", ".jpg", buf).ok).toBe(false);
    expect(saveMedia(d, "poses", "a b", ".jpg", buf).ok).toBe(false);
    expect(saveMedia(d, "poses", "a", ".mov", buf).ok).toBe(false);
    expect(saveMedia(d, "poses", "a", ".exe", buf).ok).toBe(false);
    expect(saveMedia(d, "poses", "a", ".jpg", Buffer.alloc(0)).ok).toBe(false);
  });
});
