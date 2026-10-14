import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error arquivo .mjs sem tipos
import { findStale, findUnreachable } from "./stale-lib.mjs";

function project(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "stale-"));
  for (const [rel, text] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, text);
  }
  return root;
}

describe("arquivos antigos", () => {
  it("acha o que ninguém importa e segue imports dinâmicos, index e css", () => {
    const root = project({
      "src/main.tsx": 'import Root from "./Root"; import "./styles/app.css";',
      "src/Root.tsx": 'import { lazy } from "react"; const P = lazy(() => import("./pages/Page")); import { x } from "./lib"; export default P; export { x };',
      "src/pages/Page.tsx": 'import { y } from "../lib/util"; export default y;',
      "src/lib/index.ts": "export const x = 1;",
      "src/lib/util.ts": "export const y = 1;",
      "src/styles/app.css": "body{}",
      "src/trendly/pages/CreatePage.tsx": 'import "../hooks/gone";',
      "src/old.test.ts": 'import { y } from "./lib/util"; y;',
    });
    expect(findUnreachable(root)).toEqual(["src/trendly/pages/CreatePage.tsx"]);
  });
  it("inclui o vite.config.js antigo e App.jsx", () => {
    const root = project({ "src/main.tsx": "export {}", "vite.config.js": "x", "src/App.jsx": "x" });
    expect(findStale(root)).toEqual(["src/App.jsx", "vite.config.js"]);
  });
});
