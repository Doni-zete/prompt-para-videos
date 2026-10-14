// Lógica da verificação do site publicado (sem rede, para poder testar).

/** Endereços dos scripts e estilos que o index.html carrega, já completos a partir de `base`. */
export function findAssets(html, base) {
  const out = new Set();
  const re = /<(?:script|link)\b[^>]*?(?:src|href)=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0].toLowerCase();
    const url = m[1];
    const isCode = tag.startsWith("<script") || /rel=["']?(?:stylesheet|modulepreload)/.test(tag);
    if (!isCode || /^(?:data:|mailto:)/.test(url)) continue;
    out.add(new URL(url, base).href);
  }
  return [...out];
}

/** O index.html parece o do app? (tem o ponto de montagem e pelo menos um script). */
export function looksLikeApp(html) {
  return /id=["']root["']/.test(html) && /<script\b/i.test(html);
}

/** Resumo legível de uma falha, para o texto do aviso. */
export function describeFailure(problems) {
  return problems.map((p) => `- ${p}`).join("\n");
}
