import { useEffect, useState } from "react";
import { Brain } from "lucide-react";

/** Tela de espera com mensagens que mudam enquanto o Gemini trabalha. */
export function ThinkingOverlay({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 2400);
    return () => clearInterval(t);
  }, [messages.length]);
  return (
    <div className="tw-overlay" role="status" aria-live="polite">
      <div className="tw-think">
        <span className="tw-think-ic" aria-hidden="true">
          <Brain size={26} />
        </span>
        <p>{messages[i]}</p>
        <span className="tw-dots" aria-hidden="true">
          <i /><i /><i />
        </span>
      </div>
    </div>
  );
}
