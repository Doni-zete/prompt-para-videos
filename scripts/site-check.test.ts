import { describe, expect, it } from "vitest";
// @ts-expect-error arquivo .mjs sem tipos
import { describeFailure, findAssets, looksLikeApp } from "./site-check-lib.mjs";

const HTML = `<!doctype html><html><head>
<link rel="icon" href="./favicon.svg">
<link rel="stylesheet" href="./assets/index-abc.css">
<link rel="modulepreload" href="./assets/vendor-1.js">
<script type="module" crossorigin src="./assets/index-abc.js"></script></head>
<body><div id="root"></div></body></html>`;

describe("verificação do site", () => {
  it("lista só scripts e estilos, com o endereço completo", () => {
    expect(findAssets(HTML, "https://u.github.io/app/")).toEqual([
      "https://u.github.io/app/assets/index-abc.css",
      "https://u.github.io/app/assets/vendor-1.js",
      "https://u.github.io/app/assets/index-abc.js",
    ]);
  });
  it("reconhece o index do app e rejeita página de erro", () => {
    expect(looksLikeApp(HTML)).toBe(true);
    expect(looksLikeApp("<html><body><h1>404 There isn't a GitHub Pages site here.</h1></body></html>")).toBe(false);
  });
  it("monta o texto do aviso", () => {
    expect(describeFailure(["a", "b"])).toBe("- a\n- b");
  });
});
