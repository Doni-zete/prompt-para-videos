import { Sparkles } from "lucide-react";
import { ConnectPanel } from "../components/ConnectPanel";
import { useGemini } from "../context/GeminiContext";

export default function Welcome() {
  const { skip } = useGemini();
  return (
    <div className="welcome">
      <div className="welcome-copy">
        <span className="pill"><Sparkles size={14} /> TikTok Shop Creator</span>
        <h1>Prompts de vídeo prontos em segundos, com o seu Gemini</h1>
        <p>
          Envie a foto do produto e gere prompts POV e UGC, headlines, copy e análises. Tudo roda com a sua chave gratuita do Google AI
          Studio, sem mensalidade.
        </p>
        <button type="button" className="link-btn" onClick={skip}>
          Explorar a biblioteca de prompts sem conectar
        </button>
      </div>
      <section className="welcome-card" aria-labelledby="connect-title">
        <h2 id="connect-title">Conectar o Gemini gratuito</h2>
        <ConnectPanel />
      </section>
    </div>
  );
}
