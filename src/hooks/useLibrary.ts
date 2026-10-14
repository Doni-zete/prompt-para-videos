import { useCallback, useMemo } from "react";
import type { LibraryItem } from "../data/types";
import { uniqueSlug } from "../lib/slug";
import { usePersistentState } from "./usePersistentState";

export type LibraryPatch = { title?: string; prompt?: string; obs?: string };
type Override = { title?: string; prompt?: string; obs?: string };

/** Mescla itens embutidos, edições do usuário sobre eles e prompts cadastrados pelo usuário. */
export function useLibrary(collectionId: string, builtin: LibraryItem[]) {
  const [overrides, setOverrides] = usePersistentState<Record<string, Override>>(`overrides:${collectionId}`, {});
  const [custom, setCustom] = usePersistentState<LibraryItem[]>(`custom:${collectionId}`, []);

  const items = useMemo(
    () => [...custom, ...builtin].map((i) => ({ ...i, ...(overrides[i.id] ?? {}) })),
    [builtin, custom, overrides],
  );

  const edit = useCallback(
    (id: string, patch: LibraryPatch) => {
      if (custom.some((c) => c.id === id)) {
        setCustom((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      } else {
        // nos prompts que já vêm no app a edição fica à parte (o original continua intacto e dá para restaurar)
        setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
      }
    },
    [custom, setCustom, setOverrides],
  );

  const add = useCallback(
    (data: Omit<LibraryItem, "id" | "source">) => {
      setCustom((prev) => {
        const id = uniqueSlug(`user-${data.title}`, prev.map((c) => c.id), "user-prompt");
        return [{ ...data, id, source: "user" }, ...prev];
      });
    },
    [setCustom],
  );

  const remove = useCallback((id: string) => setCustom((prev) => prev.filter((c) => c.id !== id)), [setCustom]);

  const reset = useCallback(
    (id: string) =>
      setOverrides((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }),
    [setOverrides],
  );

  return { items, edit, add, remove, reset, overrides };
}
