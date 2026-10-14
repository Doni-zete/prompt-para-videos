import { useCallback, useState } from "react";
import { storage } from "../lib/storage";

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => storage.get<T>(key, initial));
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        storage.set(key, resolved);
        return resolved;
      });
    },
    [key],
  );
  return [value, update] as const;
}
