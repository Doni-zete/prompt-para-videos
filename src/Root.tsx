import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { GeminiProvider, useGemini } from "./context/GeminiContext";
import { ToastProvider } from "./context/ToastContext";
import { titleFor } from "./lib/pageTitle";
import { isTrackedTool, recordRecent } from "./lib/recent";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Shell } from "./components/Shell";
import Dashboard from "./pages/Dashboard";
import Welcome from "./pages/Welcome";

const ToolPage = lazy(() => import("./pages/ToolPage"));
const GeneratorsPage = lazy(() => import("./pages/GeneratorsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SoonPage = lazy(() => import("./pages/SoonPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HumanoPage = lazy(() => import("./humano/pages/HumanoPage"));
const Seguidores2kPage = lazy(() => import("./seguidores2k/pages/Seguidores2kPage"));
const DivulgadorPage = lazy(() => import("./divulgador/pages/DivulgadorPage"));
const StorefrontPage = lazy(() => import("./divulgador/pages/StorefrontPage"));
const ManequinsPage = lazy(() => import("./manequins/pages/ManequinsPage"));
const TrendlyLayout = lazy(() => import("./trendly/TrendlyLayout"));
const TrendlyReels = lazy(() => import("./trendly/pages/ReelsHome"));
const TrendlyWizard = lazy(() => import("./trendly/pages/WizardPage"));
const GaleriaPage = lazy(() => import("./galeria/pages/GaleriaPage"));
const ProgressoPage = lazy(() => import("./progresso/pages/ProgressoPage"));
const TrendlyInfluencer = lazy(() => import("./trendly/pages/InfluencerPage"));
const TrendlyProducts = lazy(() => import("./trendly/pages/ProductsPage"));
const TrendlyAgent = lazy(() => import("./trendly/pages/AgentPage"));
const TrendlyMediaMap = lazy(() => import("./trendly/pages/MediaMapPage"));
const TrendlyHacks = lazy(() => import("./trendly/pages/HacksPage"));
const TrendlyHackStyle = lazy(() => import("./trendly/pages/HackStylePage"));

/** Os links antigos #/biblioteca/<coleção> agora abrem a Galeria de Prompts já filtrada. */
function LibraryRedirect() {
  const { id = "" } = useParams();
  const [sp] = useSearchParams();
  const pasta = sp.get("cat");
  const to = ["videos", "prontas", "movimentos"].includes(id) ? `/galeria?c=${id}${pasta ? `&pasta=${encodeURIComponent(pasta)}` : ""}` : "/galeria";
  return <Navigate to={to} replace />;
}

function LegacyCreate() {
  const { style } = useParams();
  return <Navigate to={`/trendly/reels/${style ?? ""}`} replace />;
}

/** Atualiza o título da aba do navegador a cada troca de tela. */
function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = titleFor(pathname);
  }, [pathname]);
  return null;
}

/** Guarda as ferramentas abertas para o "Continue de onde parou" do painel. */
function RecentSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!isTrackedTool(pathname)) return;
    const title = titleFor(pathname).split(" | ")[0];
    if (title !== "Página não encontrada") recordRecent({ kind: "tool", id: pathname, title, to: pathname });
  }, [pathname]);
  return null;
}

function Splash() {
  return (
    <div className="splash" role="status" aria-label="Carregando">
      <Loader2 size={28} className="spin accent" />
    </div>
  );
}

function Gate() {
  const { status, skipped } = useGemini();
  const { pathname } = useLocation();
  if (pathname.startsWith("/ofertas/")) return <ErrorBoundary resetKey={pathname}><Suspense fallback={<Splash />}><Routes>
    <Route path="ofertas/:slug" element={<StorefrontPage />} />
    <Route path="ofertas/:slug/:productId" element={<StorefrontPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes></Suspense></ErrorBoundary>;
  if (status === "booting") return <Splash />;
  if (status === "disconnected" && !skipped) return <Welcome />;
  return (
    <ErrorBoundary resetKey={pathname}>
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="divulgador" element={<DivulgadorPage />} />
          <Route path="geradores" element={<GeneratorsPage />} />
          <Route path="ferramenta/:id" element={<ToolPage />} />
          <Route path="biblioteca/:id" element={<LibraryRedirect />} />
          <Route path="em-breve/:id" element={<SoonPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="humano" element={<HumanoPage />} />
          <Route path="manequins" element={<ManequinsPage />} />
          <Route path="2k-seguidores" element={<Seguidores2kPage />} />
          <Route path="galeria" element={<GaleriaPage />} />
          <Route path="progresso" element={<ProgressoPage />} />
          <Route path="trendly" element={<TrendlyLayout />}>
            <Route index element={<Navigate to="/trendly/reels" replace />} />
            <Route path="reels" element={<TrendlyReels />} />
            <Route path="reels/:style" element={<TrendlyWizard />} />
            <Route path="agente" element={<TrendlyAgent />} />
            <Route path="influencer" element={<TrendlyInfluencer />} />
            <Route path="galeria" element={<Navigate to="/galeria" replace />} />
            <Route path="hacks" element={<TrendlyHacks />} />
            <Route path="hacks/:id" element={<TrendlyHackStyle />} />
            <Route path="produtos" element={<TrendlyProducts />} />
            <Route path="midia" element={<TrendlyMediaMap />} />
            <Route path="criar/:style" element={<LegacyCreate />} />
            <Route path="avatares" element={<Navigate to="/trendly/influencer" replace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}

export default function Root() {
  return (
    <ToastProvider>
      <GeminiProvider>
        <HashRouter>
          <TitleSync />
          <RecentSync />
          <Gate />
        </HashRouter>
      </GeminiProvider>
    </ToastProvider>
  );
}
