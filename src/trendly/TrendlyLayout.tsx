import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronDown, Images } from "lucide-react";
import "./trendly.css";

const TOOLS = [
  { to: "/trendly/reels", label: "Reels Studio", dot: true },
  { to: "/trendly/agente", label: "Agente IA", dot: true },
  { to: "/trendly/influencer", label: "Influencer Studio", dot: true },
  { to: "/trendly/hacks", label: "Hacks Virais", dot: false },
];

function ToolsMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="tl-menu" ref={ref}>
      <button type="button" className={`tl-menu-btn ${active ? "on" : ""}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Ferramentas <ChevronDown size={14} className={open ? "flip" : ""} aria-hidden="true" />
      </button>
      {open && (
        <div className="tl-menu-list" role="menu">
          {TOOLS.map((t) => (
            <NavLink key={t.to} to={t.to} role="menuitem" className={({ isActive }) => (isActive ? "on" : "")}>
              {t.label}
              {t.dot && <i className="tl-dot" aria-hidden="true" />}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

/** Layout da aba Tendências: navegação própria no topo, separada do resto do app. */
export default function TrendlyLayout() {
  const { pathname } = useLocation();
  const toolsActive = TOOLS.some((t) => pathname.startsWith(t.to));
  return (
    <div className="tl">
      <header className="tl-top">
        <Link to="/" className="tl-exit" aria-label="Voltar ao painel">
          <ArrowLeft size={16} /> Painel
        </Link>
        <nav className="tl-nav" aria-label="Tendências">
          <NavLink to="/trendly/produtos" className={({ isActive }) => (isActive ? "on" : "")}>
            Produtos
          </NavLink>
          <ToolsMenu active={toolsActive} />
        </nav>
        <Link to="/trendly/midia" className="tl-brand" aria-label="Mapa de mídia" title="Mapa de mídia">
          <Images size={14} aria-hidden="true" /> Mídia
        </Link>
      </header>
      <div className="tl-body">
        <Outlet />
      </div>
    </div>
  );
}
