import { useCallback } from "react";
import { usePersistentState } from "./usePersistentState";

export function useFavorites() {
  const [favorites, setFavorites] = usePersistentState<string[]>("favorites", []);
  const toggle = useCallback(
    (id: string) => setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setFavorites],
  );
  return { favorites, toggle };
}
