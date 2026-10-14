import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanMedia } from "./media-scan";

function media(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "media-"));
  for (const [rel, text] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, text);
  }
  return dir;
}

describe("scanMedia", () => {
  it("devolve vazio quando a pasta não existe", () => {
    expect(scanMedia("/caminho/que/nao/existe").items).toEqual({});
  });
  it("usa o caminho sem extensão em minúsculas como chave", () => {
    const m = scanMedia(media({ "gallery/Giro-360.MP4": "v", "avatars/carolina.jpg": "i" }));
    expect(Object.keys(m.items).sort()).toEqual(["avatars/carolina", "gallery/giro-360"]);
    expect(m.items["gallery/giro-360"].video).toMatch(/^gallery\/Giro-360\.MP4\?v=[0-9a-f]{8}$/);
  });
  it("junta vídeo e imagem do mesmo nome (a imagem vira capa)", () => {
    const m = scanMedia(media({ "gallery/a.mp4": "v", "gallery/a.jpg": "i" }));
    expect(m.items["gallery/a"].video).toBeTruthy();
    expect(m.items["gallery/a"].image).toBeTruthy();
  });
  it("o hash muda só quando o conteúdo muda", () => {
    const a = scanMedia(media({ "x/a.png": "um" })).items["x/a"].image;
    const b = scanMedia(media({ "x/a.png": "um" })).items["x/a"].image;
    const c = scanMedia(media({ "x/a.png": "dois" })).items["x/a"].image;
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
  it("avisa de .mov, formato desconhecido e arquivo grande; ignora .gitkeep e .md", () => {
    const m = scanMedia(media({ "a/x.mov": "m", "a/y.xyz": "z", "a/.gitkeep": "", "a/LEIA.md": "t", "a/grande.mp4": "0123456789" }), { maxFileBytes: 5 });
    expect(m.ignored.sort()).toEqual(["a/x.mov", "a/y.xyz"]);
    expect(m.warnings.some((w) => w.includes(".mov"))).toBe(true);
    expect(m.warnings.some((w) => w.includes("100 MB"))).toBe(true);
    expect(m.items["a/grande"]).toBeTruthy();
  });
  it("avisa quando o total passa do limite", () => {
    const m = scanMedia(media({ "a/1.jpg": "12345", "a/2.jpg": "12345" }), { maxTotalBytes: 8 });
    expect(m.warnings.some((w) => w.includes("1 GB"))).toBe(true);
  });
});
