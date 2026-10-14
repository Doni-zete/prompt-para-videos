import { useEffect, useRef, useState } from "react";

/**
 * `seen` fica true quando o elemento chega perto da tela (evita baixar dezenas de vídeos de uma vez).
 * `visible` acompanha se ele está na tela agora (para tocar e pausar vídeos).
 */
export function useInView<T extends Element>(margin = "300px") {
  const ref = useRef<T>(null);
  const noObserver = typeof IntersectionObserver === "undefined";
  const [seen, setSeen] = useState(noObserver);
  const [visible, setVisible] = useState(noObserver);
  useEffect(() => {
    const el = ref.current;
    if (!el || noObserver) return;
    const io = new IntersectionObserver(
      (entries) => {
        const on = entries.some((e) => e.isIntersecting);
        setVisible(on);
        if (on) setSeen(true);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin, noObserver]);
  return [ref, seen, visible] as const;
}
