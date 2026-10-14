import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function Shell() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className={`shell ${open ? "nav-open" : ""}`}>
      <button type="button" className="menu-btn icon-btn" onClick={() => setOpen((o) => !o)} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <Sidebar onNavigate={() => setOpen(false)} />
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      <main className="main" id="conteudo">
        <Outlet />
        <footer className="foot">Otimizado para TikTok Shop Brasil</footer>
      </main>
    </div>
  );
}
