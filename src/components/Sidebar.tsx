import { NavLink, useNavigate } from "react-router-dom";
import { CalendarCheck, Images, LayoutGrid, LogOut, Plug, Send, Settings, Sparkles } from "lucide-react";
import { useGemini } from "../context/GeminiContext";
import { useTodayUsage } from "../lib/usage";
import { usePersistentState } from "../hooks/usePersistentState";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { status, disconnect, apiKey } = useGemini();
  const navigate = useNavigate();
  const used = useTodayUsage();
  const [name] = usePersistentState<string>("name", "Criador");
  const connected = status === "connected" && !!apiKey;

  return (
    <aside className="sidebar" aria-label="Menu principal">
      <div className="profile">
        <div className="avatar" aria-hidden="true">
          {(name.trim()[0] ?? "C").toUpperCase()}
        </div>
        <div>
          <span className="hello">Olá,</span>
          <strong className="uname">{name}</strong>
        </div>
      </div>

      <div className={`plan ${connected ? "is-on" : ""}`}>
        <span className="dot" aria-hidden="true" />
        <div>
          <strong>{connected ? "Gemini conectado" : "Gemini desconectado"}</strong>
          <span>{connected ? `${used} ${used === 1 ? "chamada" : "chamadas"} hoje` : "Conecte para gerar"}</span>
        </div>
      </div>

      <nav className="nav">
        <NavLink to="/" end onClick={onNavigate}>
          <LayoutGrid size={16} /> Painel
        </NavLink>
        <NavLink to="/divulgador" onClick={onNavigate}>
          <Send size={16} /> Divulgador
        </NavLink>
        <NavLink to="/geradores" onClick={onNavigate}>
          <Sparkles size={16} /> Geradores de Prompt
        </NavLink>
        <NavLink to="/galeria" onClick={onNavigate}>
          <Images size={16} /> Galeria de Prompts
        </NavLink>
        <NavLink to="/progresso" onClick={onNavigate}>
          <CalendarCheck size={16} /> Progresso Semanal
        </NavLink>
        <NavLink to="/configuracoes" onClick={onNavigate}>
          <Settings size={16} /> Configurações
        </NavLink>
      </nav>

      <div className="sidebar-foot">
        {connected ? (
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => {
              disconnect();
              onNavigate?.();
              navigate("/");
            }}
          >
            <LogOut size={14} /> Sair (remover chave)
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              navigate("/configuracoes");
              onNavigate?.();
            }}
          >
            <Plug size={14} /> Conectar Gemini
          </button>
        )}
      </div>
    </aside>
  );
}
