import { useCallback } from "react";
import type { ToolOutput } from "../lib/gemini";
import { usePersistentState } from "./usePersistentState";

export interface HistoryEntry {
  id: string;
  at: number;
  model: string;
  label: string;
  output: ToolOutput;
}

const MAX = 10;

export function useHistory(toolId: string) {
  const [entries, setEntries] = usePersistentState<HistoryEntry[]>(`history:${toolId}`, []);
  const push = useCallback(
    (output: ToolOutput, model: string, label: string) =>
      setEntries((prev) => [{ id: crypto.randomUUID(), at: Date.now(), model, label, output }, ...prev].slice(0, MAX)),
    [setEntries],
  );
  const remove = useCallback((id: string) => setEntries((prev) => prev.filter((e) => e.id !== id)), [setEntries]);
  const clear = useCallback(() => setEntries([]), [setEntries]);
  return { entries, push, remove, clear };
}
