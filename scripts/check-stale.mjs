import { findStale, removeFiles } from "./stale-lib.mjs";

const root = process.cwd();
const stale = findStale(root);
const fix = process.argv.includes("--fix");

if (stale.length && fix) {
  removeFiles(root, stale);
  console.log(`\n✔ Removidos ${stale.length} arquivo(s) de versões antigas:`);
  stale.forEach((f) => console.log("   - " + f));
  console.log("");
} else if (stale.length) {
  console.warn("\n⚠  Arquivos de uma versão antiga (ninguém usa mais). O build ignora, mas vale apagar:");
  stale.forEach((f) => console.warn("   - " + f));
  console.warn("   Para apagar tudo de uma vez: npm run clean:stale\n");
} else if (fix) {
  console.log("Nada para limpar.");
}
