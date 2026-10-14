import { useEffect, useState } from "react";
import { storage } from "./storage";

const EVENT = "ppv:usage";
const day = () => new Date().toISOString().slice(0, 10);
const slot = () => `usage:${day()}`;

export function recordRequest(): void {
  storage.set(slot(), storage.get<number>(slot(), 0) + 1);
  window.dispatchEvent(new Event(EVENT));
}

/** Contador local de chamadas feitas hoje por este navegador (a cota oficial fica no Google AI Studio). */
export function useTodayUsage(): number {
  const [count, setCount] = useState(() => storage.get<number>(slot(), 0));
  useEffect(() => {
    const update = () => setCount(storage.get<number>(slot(), 0));
    window.addEventListener(EVENT, update);
    return () => window.removeEventListener(EVENT, update);
  }, []);
  return count;
}
