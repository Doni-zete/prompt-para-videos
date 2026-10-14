import { useCallback, useState } from "react";
import { slug, uniqueSlug } from "../../lib/slug";
import { storage } from "../../lib/storage";
import { usePersistentState } from "../../hooks/usePersistentState";
import { SEED_PRODUCTS, type Demand, type Product } from "../data/products";

/** Lê linhas "nome" ou "nome;alta" / "nome;em-alta". */
export function parseProductLines(text: string): { name: string; demand: Demand }[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, flag = ""] = line.split(/[;\t]/).map((p) => p.trim());
      const f = flag.toLowerCase();
      const demand: Demand = f === "alta" ? "alta" : f === "em-alta" || f === "em alta" ? "em-alta" : "";
      return { name: name.slice(0, 120), demand };
    })
    .filter((p) => p.name);
}

/** Versões antigas usavam ids aleatórios; agora o id é o nome do arquivo da foto. */
function initial(): Product[] {
  const old = storage.get<Product[] | null>("trendly:products-v1", null);
  if (!old) return SEED_PRODUCTS;
  const used = new Set<string>();
  const seedIds = new Set(SEED_PRODUCTS.map((p) => p.id));
  return old.map((p) => {
    const keep = /^[a-z0-9-]+$/.test(p.id) && !used.has(p.id) && (seedIds.has(p.id) || !/^[0-9a-f]{8}-/.test(p.id));
    const id = keep ? p.id : uniqueSlug(p.name, used, "produto");
    used.add(id);
    return { ...p, id };
  });
}

export function useProducts() {
  const [start] = useState(initial);
  const [products, setProducts] = usePersistentState<Product[]>("trendly:products-v2", start);

  const add = useCallback(
    (name: string, demand: Demand = "em-alta") => {
      let id = "";
      setProducts((prev) => {
        id = uniqueSlug(name, prev.map((p) => p.id), "produto");
        return [{ id, name: name.trim(), demand }, ...prev];
      });
      return id;
    },
    [setProducts],
  );

  const update = useCallback(
    (id: string, patch: Partial<Omit<Product, "id">>) => setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [setProducts],
  );

  const remove = useCallback((id: string) => setProducts((prev) => prev.filter((p) => p.id !== id)), [setProducts]);

  const importLines = useCallback(
    (text: string) => {
      const parsed = parseProductLines(text);
      if (!parsed.length) return 0;
      setProducts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const added: Product[] = parsed.map((p) => {
          const id = uniqueSlug(p.name, ids, "produto");
          ids.add(id);
          return { id, name: p.name, demand: p.demand };
        });
        return [...added, ...prev];
      });
      return parsed.length;
    },
    [setProducts],
  );

  return { products, add, update, remove, importLines, slug };
}
