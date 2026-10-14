// Descobre arquivos antigos que sobraram numa pasta (ex.: ao descompactar uma versão nova por cima de outra).
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".json"];
const IMPORT_RE = /(?:from\s*|import\s*\(\s*|import\s+)["']([^"']+)["']/g;

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = resolve(dirname(fromFile), spec);
  const candidates = [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => join(base, "index" + e))];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

/** Arquivos de src/ que ninguém importa a partir de main.tsx (nem de um teste). */
export function findUnreachable(root) {
  const src = join(root, "src");
  if (!existsSync(src)) return [];
  const all = walk(src);
  const entries = all.filter((f) => /\.test\.ts$/.test(f) || f.endsWith(join("src", "main.tsx")));
  const seen = new Set(entries);
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop();
    if (!/\.(tsx?|jsx?|mjs|css)$/.test(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(IMPORT_RE)) {
      const target = resolveImport(file, m[1]);
      if (target && !seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }
  return all.filter((f) => !seen.has(f) && !f.endsWith(".d.ts")).map((f) => relative(root, f).split("\\").join("/")).sort();
}

/** Arquivos de versões antigas do projeto que atrapalham (o vite.config.js antigo ganha do .ts). */
export const KNOWN_STALE = ["src/App.jsx", "src/App.tsx", "src/main.jsx", "src/data.js", "src/styles.css", "vite.config.js"];

export function findStale(root) {
  const known = KNOWN_STALE.filter((f) => existsSync(join(root, f)));
  const set = new Set([...known, ...findUnreachable(root)]);
  return [...set].sort();
}

export function removeFiles(root, files) {
  for (const f of files) rmSync(join(root, f), { force: true });
  // remove pastas vazias dentro de src
  const prune = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) prune(join(dir, e.name));
    if (dir !== join(root, "src") && readdirSync(dir).length === 0) rmSync(dir, { recursive: true, force: true });
  };
  prune(join(root, "src"));
}
