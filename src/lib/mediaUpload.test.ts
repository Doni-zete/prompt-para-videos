import { describe, expect, it } from "vitest";
import { extOf, validateFile } from "./mediaUpload";

describe("mediaUpload", () => {
  it("pega a extensão em minúsculas", () => {
    expect(extOf("Meu Video.MP4")).toBe(".mp4");
    expect(extOf("semextensao")).toBe("");
  });
  it("aceita imagem e vídeo, recusa o resto", () => {
    expect(validateFile({ name: "a.JPG", size: 10 })).toBeNull();
    expect(validateFile({ name: "a.webm", size: 10 })).toBeNull();
    expect(validateFile({ name: "a.mov", size: 10 })).toMatch(/MP4/);
    expect(validateFile({ name: "a.pdf", size: 10 })).toMatch(/não é suportado/);
    expect(validateFile({ name: "a.mp4", size: 0 })).toMatch(/vazio/);
    expect(validateFile({ name: "a.mp4", size: 101 * 1024 * 1024 })).toMatch(/100 MB/);
  });
});
