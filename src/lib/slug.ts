/** "Calça Feminina (Cintura Alta)" -> "calca-feminina-cintura-alta" */
export function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function uniqueSlug(text: string, existing: Iterable<string>, fallback = "item"): string {
  const taken = new Set(existing);
  const base = slug(text) || fallback;
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
