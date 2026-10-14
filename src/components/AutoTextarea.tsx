import { useEffect, useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

/** Caixa de texto que cresce até mostrar todo o conteúdo (sem rolagem interna). */
export function AutoTextarea({ className, onInput, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  useLayoutEffect(fit, [rest.value]);
  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <textarea
      {...rest}
      ref={ref}
      rows={1}
      className={`auto-ta ${className ?? ""}`}
      onInput={(e) => {
        fit();
        onInput?.(e);
      }}
    />
  );
}
