import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, CalendarCheck, ChevronDown, Clock, Images, KeyRound, MapPin, Pencil, Plug, Plus, Search, Star, Wand2, Heart } from "lucide-react";
import { CATALOG, type CatalogEntry } from "../data/catalog";
import { useFavorites } from "../hooks/useFavorites";
import { useGemini } from "../context/GeminiContext";
import { usePersistentState } from "../hooks/usePersistentState";
import { useDiagEvents } from "../lib/diagnostics";
import { useRecent } from "../lib/recent";
import { useTodayUsage } from "../lib/usage";
import { DEFAULT_GOALS, rangeStat, toIso, type DoneMap, type Goal } from "../progresso/lib/progresso";
import { useTrendlyFavorites } from "../trendly/hooks/useTrendlyFavorites";
import { useLibrary } from "../hooks/useLibrary";
import { buildItems } from "../galeria/lib/galeria";
import { MOVIMENTOS } from "../data/movimentos";
import { PRONTAS } from "../data/promptsProntas";
import { VIDEO_PROMPTS } from "../data/videoPrompts";
import { media } from "../lib/media";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function ToolCard({ entry, starred, onStar }: { entry: CatalogEntry; starred: boolean; onStar: () => void }) {
  const [open, setOpen] = useState(false);
  const Icon = entry.icon;
  return (
    <article className={`tcard ${entry.badge === "Em breve" ? "is-soon" : ""}`}>
      <button type="button" className={`star ${starred ? "on" : ""}`} onClick={onStar} aria-pressed={starred} aria-label={starred ? `Remover ${entry.title} dos favoritos` : `Favoritar ${entry.title}`}>
        <Star size={14} fill={starred ? "currentColor" : "none"} />
      </button>
      <Link to={entry.to} className="tcard-main">
        <span className="tcard-icon"><Icon size={20} /></span>
        <h2>{entry.title}</h2>
        <p>{entry.description}</p>
        {entry.badge && <span className={`badge ${entry.badge === "Novo" ? "badge-new" : "badge-soon"}`}>{entry.badge}</span>}
      </Link>
      {entry.children && (
        <>
          <button type="button" className="tcard-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Opções de ${entry.title}`}>
            <ChevronDown size={16} className={open ? "flip" : ""} />
          </button>
          {open && (
            <ul className="tcard-sub">
              {entry.children.map((c) => (
                <li key={c.to}>
                  <Link to={c.to}><c.icon size={14} /> {c.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </article>
  );
}

type Overrides = Record<string, unknown>;

function Tile({ to, icon: Icon, label, value, hint }: { to: string; icon: typeof Star; label: string; value: string; hint: string }) {
  return (
    <Link to={to} className="dtile">
      <span className="dtile-icon"><Icon size={16} aria-hidden="true" /></span>
      <span className="dtile-label">{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </Link>
  );
}

export default function Dashboard() {
  const { favorites, toggle } = useFavorites();
  const { status, apiKey } = useGemini();
  const used = useTodayUsage();
  const recent = useRecent();
  const problems = useDiagEvents().length;
  const trendlyFav = useTrendlyFavorites();
  const [edits] = usePersistentState<Overrides>("galeria:edits", {});
  const [ovV] = usePersistentState<Overrides>("overrides:videos", {});
  const [ovP] = usePersistentState<Overrides>("overrides:prontas", {});
  const [ovM] = usePersistentState<Overrides>("overrides:movimentos", {});
  const [goals] = usePersistentState<Goal[]>("progresso:goals", DEFAULT_GOALS);
  const [doneMap] = usePersistentState<DoneMap>("progresso:done", {});
  const todayGoals = useMemo(() => rangeStat(goals, doneMap, [toIso(new Date())], toIso(new Date())), [goals, doneMap]);
  const [q, setQ] = useState("");
  const connected = status === "connected" && !!apiKey;

  // "favorites" também guarda a estrela dos cards deste painel; aqui contam só os prompts
  const toolIds = useMemo(() => new Set(CATALOG.map((c) => c.id)), []);
  // só conta o que a Galeria realmente consegue mostrar (ids antigos ou de arquivos que sumiram ficam de fora)
  const libVideos = useLibrary("videos", VIDEO_PROMPTS);
  const libProntas = useLibrary("prontas", PRONTAS);
  const libMov = useLibrary("movimentos", MOVIMENTOS);
  const promptFavs = useMemo(() => {
    const libIds = new Set([...libVideos.items, ...libProntas.items, ...libMov.items].map((i) => i.id));
    const galleryIds = new Set(buildItems(media.idsIn("gallery"), (n) => media.resolve("gallery", [n])?.kind ?? "image").map((i) => i.id));
    return favorites.filter((id) => !toolIds.has(id) && libIds.has(id)).length + trendlyFav.favorites.filter((id) => galleryIds.has(id)).length;
  }, [favorites, trendlyFav.favorites, toolIds, libVideos.items, libProntas.items, libMov.items]);
  const editedCount = Object.keys(edits).length + Object.keys(ovV).length + Object.keys(ovP).length + Object.keys(ovM).length;

  const list = useMemo(() => {
    const n = norm(q.trim());
    // o que já está no menu lateral (Geradores, Galeria) não repete aqui como card
    const base = CATALOG.filter((c) => !c.inMenu);
    const filtered = n ? base.filter((c) => norm(`${c.title} ${c.description} ${c.keywords ?? ""}`).includes(n)) : base;
    return [...filtered].sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)));
  }, [q, favorites]);

  return (
    <div className="page">
      <header className="dash-head">
        <div>
          <h1 className="display">Painel de ferramentas</h1>
          <p className="lede">Seu ponto de partida: o que você abriu por último, seus favoritos e atalhos. Geradores, Galeria e Progresso ficam no menu ao lado.</p>
        </div>
      </header>

      {status !== "connected" && (
        <div className="banner">
          <Plug size={18} aria-hidden="true" />
          <p>Conecte sua chave gratuita do Gemini para usar os geradores de IA. A biblioteca de prompts funciona sem chave.</p>
          <Link className="btn btn-primary" to="/configuracoes">Conectar Gemini</Link>
        </div>
      )}

      <section className="dtiles" aria-label="Resumo">
        <Tile to="/configuracoes" icon={KeyRound} label="Gemini" value={connected ? "Conectado" : "Desconectado"} hint={connected ? `${used} ${used === 1 ? "chamada" : "chamadas"} hoje` : "Conecte para gerar"} />
        <Tile to="/progresso?aba=metas" icon={CalendarCheck} label="Metas de hoje" value={`${todayGoals.done} de ${goals.length}`} hint="Abrir Progresso Semanal" />
        <Tile to="/galeria?v=fav" icon={Heart} label="Prompts favoritos" value={String(promptFavs)} hint="Ver na Galeria" />
        <Tile to="/galeria?v=edited" icon={Pencil} label="Editados por mim" value={String(editedCount)} hint="Nomes e textos que você mudou" />
        <Tile to="/configuracoes" icon={Activity} label="Diagnóstico" value={problems ? `${problems} ${problems === 1 ? "problema" : "problemas"}` : "Tudo certo"} hint="Erros registrados neste navegador" />
      </section>

      <section className="dsec" aria-labelledby="dcont">
        <h2 id="dcont" className="dsec-title"><Clock size={15} aria-hidden="true" /> Continue de onde parou</h2>
        {recent.length === 0 ? (
          <p className="muted" data-testid="recent-empty">Nada por aqui ainda. As ferramentas e os prompts que você abrir aparecem neste lugar.</p>
        ) : (
          <ul className="drecent" data-testid="recent-list">
            {recent.map((r) => (
              <li key={`${r.kind}:${r.id}`}>
                <Link to={r.to}>
                  <span className="dtile-icon">{r.kind === "prompt" ? <Images size={15} aria-hidden="true" /> : <Wand2 size={15} aria-hidden="true" />}</span>
                  <span className="drecent-text"><strong>{r.title}</strong><small>{r.kind === "prompt" ? "Prompt da Galeria" : "Ferramenta"}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dsec" aria-labelledby="dshort">
        <h2 id="dshort" className="dsec-title"><Plus size={15} aria-hidden="true" /> Atalhos</h2>
        <div className="row">
          <Link className="btn btn-primary" to="/galeria?novo=1"><Plus size={14} /> Novo prompt</Link>
          <Link className="btn btn-ghost" to="/trendly/midia"><MapPin size={14} /> Mapa de mídia</Link>
          <Link className="btn btn-ghost" to="/galeria?v=new"><Images size={14} /> Novos na minha mídia</Link>
        </div>
      </section>

      <section className="dsec" aria-labelledby="dmore">
        <div className="dsec-head">
          <h2 id="dmore" className="dsec-title">Mais ferramentas</h2>
          <label className="search">
            <Search size={16} aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ferramenta" aria-label="Buscar ferramenta" />
          </label>
        </div>
        <div className="tgrid">
          {list.map((c) => (
            <ToolCard key={c.id} entry={c} starred={favorites.includes(c.id)} onStar={() => toggle(c.id)} />
          ))}
        </div>
        {list.length === 0 && <p className="empty-inline">Nenhuma ferramenta encontrada para “{q}”. Geradores, Galeria e Progresso ficam no menu ao lado.</p>}
      </section>
    </div>
  );
}
