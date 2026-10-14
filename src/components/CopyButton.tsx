import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "../lib/clipboard";
import { useToast } from "../context/ToastContext";

interface Props {
  text: string | (() => string);
  label?: string;
  variant?: "primary" | "ghost" | "quiet";
  disabled?: boolean;
}

export function CopyButton({ text, label = "Copiar", variant = "ghost", disabled }: Props) {
  const toast = useToast();
  const [done, setDone] = useState(false);

  const onClick = async () => {
    const ok = await copyText(typeof text === "function" ? text() : text);
    if (ok) {
      setDone(true);
      toast("Copiado!");
      setTimeout(() => setDone(false), 1400);
    } else {
      toast("Não foi possível copiar. Selecione o texto e use Ctrl+C.", "error");
    }
  };

  return (
    <button type="button" className={`btn btn-${variant} ${done ? "is-done" : ""}`} onClick={onClick} disabled={disabled}>
      {done ? <Check size={14} /> : <Copy size={14} />}
      <span>{done ? "Copiado" : label}</span>
    </button>
  );
}
