// Verifica se o site publicado está no ar e abre normalmente.
// Uso: node scripts/check-site.mjs <url-do-site>
// Saída: código 0 = ok; 1 = problema (a lista vai para o arquivo indicado em SITE_CHECK_REPORT, se existir).
import { writeFileSync } from "node:fs";
import { describeFailure, findAssets, looksLikeApp } from "./site-check-lib.mjs";

const site = (process.argv[2] ?? "").trim();
if (!/^https?:\/\//.test(site)) {
  console.error("Informe o endereço do site, por exemplo: node scripts/check-site.mjs https://usuario.github.io/projeto/");
  process.exit(2);
}
const base = site.endsWith("/") ? site : `${site}/`;
const TRIES = Number(process.env.SITE_CHECK_TRIES ?? 3);
const WAIT_MS = Number(process.env.SITE_CHECK_WAIT_MS ?? 20000);

async function get(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctl.signal, redirect: "follow", headers: { "user-agent": "site-check/1.0", "cache-control": "no-cache" } });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(t);
  }
}

async function once() {
  const problems = [];
  let home;
  try {
    home = await get(base);
  } catch (e) {
    return [`Não consegui abrir ${base} (${e?.name === "AbortError" ? "demorou mais de 20 s" : e?.message ?? e}).`];
  }
  if (!home.ok) return [`${base} respondeu ${home.status}.`];
  if (!looksLikeApp(home.text)) problems.push("A página abriu, mas não parece ser o app (faltam o ponto de montagem ou os scripts).");
  for (const url of findAssets(home.text, base)) {
    try {
      const r = await get(url);
      if (!r.ok) problems.push(`Arquivo do app não carregou: ${url} (${r.status}).`);
      else if (!r.text.trim()) problems.push(`Arquivo do app veio vazio: ${url}.`);
    } catch (e) {
      problems.push(`Arquivo do app não carregou: ${url} (${e?.message ?? e}).`);
    }
  }
  return problems;
}

let problems = [];
for (let i = 1; i <= TRIES; i++) {
  problems = await once();
  if (!problems.length) break;
  console.log(`Tentativa ${i}/${TRIES} falhou:\n${describeFailure(problems)}`);
  if (i < TRIES) await new Promise((r) => setTimeout(r, WAIT_MS));
}
if (problems.length) {
  if (process.env.SITE_CHECK_REPORT) writeFileSync(process.env.SITE_CHECK_REPORT, describeFailure(problems));
  console.error(`PROBLEMA em ${base}\n${describeFailure(problems)}`);
  process.exit(1);
}
console.log(`OK: ${base} está no ar e os arquivos do app carregam.`);
