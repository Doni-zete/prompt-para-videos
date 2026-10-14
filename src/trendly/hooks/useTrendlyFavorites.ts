import { useCallback } from "react";
import { usePersistentState } from "../../hooks/usePersistentState";

export function useTrendlyFavorites() {
  const [favorites, setFavorites] = usePersistentState<string[]>("trendly:favorites", []);
  const toggle = useCallback(
    (id: string) => setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setFavorites],
  );
  return { favorites, toggle };
}
