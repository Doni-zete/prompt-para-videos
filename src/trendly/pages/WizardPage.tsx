import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { ConnectPanel } from "../../components/ConnectPanel";
import { Modal } from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { useGemini } from "../../context/GeminiContext";
import { useGenerate } from "../../hooks/useGenerate";
import type { Part } from "../../lib/gemini";
import NotFound from "../../pages/NotFound";
import { AvatarStep } from "../components/AvatarStep";
import { DirectionResult } from "../components/DirectionResult";
import { KitResult } from "../components/KitResult";
import { MovementStep } from "../components/MovementStep";
import { PovConfigStep, type PovState } from "../components/PovConfigStep";
import { ProductStep, type ProductState } from "../components/ProductStep";
import { SceneStep, type SceneState } from "../components/SceneStep";
import { ScriptModal } from "../components/ScriptModal";
import { ScriptStep, type VoiceState } from "../components/ScriptStep";
import { Stepper, WizardCard } from "../components/Stepper";
import { ThinkingOverlay } from "../components/ThinkingOverlay";
import { media } from "../../lib/media";
import { avatarNames } from "../data/avatars";
import { GALLERY } from "../data/gallery";
import { INTERACTIONS, POSES, POV_HANDS, POV_PRESENTATIONS, POV_SCENES, SCENES, labelOf } from "../data/options";
import { getStyle, type StyleMeta } from "../data/styles";
import { useAvatars } from "../hooks/useAvatars";
import { useProducts } from "../hooks/useProducts";
import { takeItems } from "../lib/direction";
import { FLOWS, stepLabel, type StepId } from "../lib/flow";
import { mediaItemToPart } from "../lib/mediaPart";
import { autoScriptSystem, autoScriptUser, directionSystem, frameSystem, kitSystem, scriptCopyPrompt, wizardUserPrompt, type WizardInput } from "../lib/prompts";
import { countWords, MAX_WORDS, normalizeTakes } from "../lib/words";

type State = ProductState & SceneState & PovState & VoiceState & { avatarId: string | null; movementId: string | null; takes: string[] };

const INITIAL: State = {
  avatarId: null,
  source: null,
  productId: null,
  ownImages: [],
  ownName: "",
  ownDetails: "",
  scene: "quarto",
  sceneCustom: "",
  interaction: "frontal",
  pose: "corpo-inteiro",
  povScene: "bancada-marmore",
  povSceneCustom: "",
  povHands: "feminina",
  povPresentation: "textura",
  durationTakes: 1,
  voice: "feminino",
  tone: "Médio",
  movementId: null,
  takes: [],
};

const SUBTITLES: Partial<Record<StepId, string>> = {
  avatar: "Escolha um dos avatares abaixo ou importe o seu próprio personagem para atuar nos seus vídeos gerados por IA.",
  movimento: "Escolha o estilo de movimento para a geração do vídeo baseado na nossa galeria de prompts.",
};

const CARD_TITLES: Record<StepId, string> = {
  avatar: "Selecione o Influencer",
  produto: "Selecione o Produto Viral",
  cena: "Configuração da Cena",
  visual: "Configuração do Vídeo",
  roteiro: "Áudio & Roteiro",
  movimento: "Selecione um Prompt de Movimento",
};

const THINKING = {
  direction: ["Lendo seu roteiro...", "Escolhendo o melhor cenário...", "Ajustando a direção de câmera...", "Montando os prompts..."],
  kit: ["Analisando o produto...", "Escolhendo o melhor cenário...", "Ajustando o movimento...", "Montando os prompts..."],
};

const dataUrlOf = (part: Part): string | undefined => ("inlineData" in part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : undefined);

function Wizard({ style }: { style: StyleMeta }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { status } = useGemini();
  const { avatars } = useAvatars();
  const { products } = useProducts();
  const flow = FLOWS[style.id];
  const [s, setS] = useState<State>(INITIAL);
  const [stepIdx, setStepIdx] = useState(0);
  const [connectOpen, setConnectOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const gen = useGenerate();
  const frameGen = useGenerate();
  const scriptGen = useGenerate();
  const patch = (p: Partial<State>) => setS((prev) => ({ ...prev, ...p }));

  const step = flow.steps[stepIdx];
  const isLast = stepIdx === flow.steps.length - 1;
  const takesCount = style.id === "ugc" ? 2 : s.durationTakes;
  const takes = normalizeTakes(s.takes, takesCount);

  const avatar = avatars.find((a) => a.id === s.avatarId);
  const catalogProduct = products.find((p) => p.id === s.productId);
  const productName = (s.source === "own" ? s.ownName.trim() : catalogProduct?.name.trim()) || "Produto";
  const productDetails = s.source === "own" ? s.ownDetails : "";
  const movement = GALLERY.find((g) => g.id === s.movementId);
  const avatarItem = avatar ? media.resolve("avatars", avatarNames(avatar)) : null;
  const catalogItem = catalogProduct ? media.resolve("products", [catalogProduct.id]) : null;

  useEffect(() => {
    const out = scriptGen.state.output;
    if (scriptGen.state.status === "done" && out) {
      const items = takeItems(out);
      setS((prev) => ({ ...prev, takes: normalizeTakes(items.map((i) => i.text.trim()), takesCount) }));
    }
  }, [scriptGen.state.status, scriptGen.state.output, takesCount]);

  const need = (fn: () => void) => {
    if (status !== "connected") {
      setConnectOpen(true);
      return;
    }
    fn();
  };

  async function collect(): Promise<{ parts: Part[]; hasPhoto: boolean; hasImage: boolean }> {
    const parts: Part[] = [];
    let hasPhoto = false;
    let hasImage = false;
    if (style.usesAvatar && avatar) {
      const p = await mediaItemToPart(avatarItem);
      if (p) {
        parts.push(p);
        hasPhoto = true;
      }
    }
    if (s.source === "own") {
      s.ownImages.forEach((i) => {
        parts.push(i.part);
        hasImage = true;
      });
    } else if (catalogProduct) {
      const p = await mediaItemToPart(catalogItem);
      if (p) {
        parts.push(p);
        hasImage = true;
      }
    }
    return { parts, hasPhoto, hasImage };
  }

  function buildInput(hasPhoto: boolean, hasImage: boolean): WizardInput {
    const input: WizardInput = {
      style: style.id,
      product: { name: productName, details: productDetails, hasImage },
      avatar: style.usesAvatar && avatar ? { name: avatar.name, gender: avatar.gender, description: avatar.description, hasPhoto } : undefined,
    };
    if (style.id === "pov") {
      input.pov = {
        scene: s.povScene === "custom" ? s.povSceneCustom.trim() || "personalizado" : labelOf(POV_SCENES, s.povScene),
        hands: labelOf(POV_HANDS, s.povHands),
        presentation: labelOf(POV_PRESENTATIONS, s.povPresentation),
      };
    } else {
      input.scene = {
        label: s.scene === "custom" ? s.sceneCustom.trim() || "personalizado" : labelOf(SCENES, s.scene),
        interaction: labelOf(INTERACTIONS, s.interaction),
        pose: labelOf(POSES, s.pose),
      };
    }
    if (style.id === "provador" && movement) input.movement = { title: movement.title, prompt: movement.prompt };
    if (style.id !== "provador") {
      input.voice = { gender: s.voice, tone: s.tone };
      input.takes = takes;
    }
    return input;
  }

  const generate = () =>
    need(() => {
      frameGen.reset();
      void gen.run({
        system: style.id === "provador" ? kitSystem() : directionSystem(style.id),
        temperature: 0.8,
        build: async () => {
          const { parts, hasPhoto, hasImage } = await collect();
          parts.push({ text: wizardUserPrompt(buildInput(hasPhoto, hasImage)) });
          return { parts };
        },
      });
    });

  const makeFrame = () =>
    need(() => {
      void frameGen.run({
        system: frameSystem(style.id),
        temperature: 0.8,
        build: async () => {
          const { parts, hasPhoto, hasImage } = await collect();
          parts.push({ text: wizardUserPrompt(buildInput(hasPhoto, hasImage)) });
          return { parts };
        },
      });
    });

  const autoFill = () =>
    need(() => {
      void scriptGen.run({
        system: autoScriptSystem(takesCount),
        temperature: 0.9,
        build: async () => ({ parts: [{ text: autoScriptUser({ product: productName, details: productDetails, style: style.id }) }] }),
      });
    });

  const valid: Record<StepId, boolean> = {
    avatar: !!s.avatarId,
    produto: s.source === "own" ? s.ownImages.length > 0 : s.source === "catalog" && !!s.productId,
    cena: s.scene !== "custom" || !!s.sceneCustom.trim(),
    visual: s.povScene !== "custom" || !!s.povSceneCustom.trim(),
    roteiro: takes.every((t) => countWords(t) > 0 && countWords(t) <= MAX_WORDS + 10),
    movimento: !!s.movementId,
  };

  const back = () => (stepIdx === 0 ? navigate("/trendly/reels") : setStepIdx((i) => i - 1));
  const next = () => (isLast ? generate() : setStepIdx((i) => i + 1));
  const resetAll = () => {
    gen.reset();
    frameGen.reset();
    scriptGen.reset();
    setS(INITIAL);
    setStepIdx(0);
  };

  const running = gen.state.status === "running";
  const result = gen.state.status === "done" ? gen.state.output : undefined;

  const productRef = {
    label: productName,
    url: s.source === "own" && s.ownImages[0] ? dataUrlOf(s.ownImages[0].part) : undefined,
    item: catalogItem,
  };
  const avatarRef = avatar ? { label: avatar.name.trim() || "Avatar", item: avatarItem } : undefined;

  let body;
  if (result) {
    body =
      style.id === "provador" ? (
        <KitResult avatar={avatarRef} product={productRef} movementTitle={movement?.title ?? "Movimento"} output={result} onRedo={() => gen.reset()} />
      ) : (
        <DirectionResult style={style.id as "ugc" | "pov"} avatar={avatarRef} product={productRef} output={result} expectedTakes={takesCount} frame={frameGen.state} onFrame={makeFrame} onNew={resetAll} />
      );
  } else {
    const nextLabel = isLast ? (style.id === "provador" ? "Gerar" : "Gerar Prompt & Visual") : "Próximo";
    body = (
      <>
        <Stepper label={stepLabel(style.id, stepIdx)} title={step.title} total={flow.total} filled={step.filled} />
        <WizardCard
          title={CARD_TITLES[step.id]}
          subtitle={SUBTITLES[step.id]}
          onBack={back}
          footer={
            <>
              {gen.state.status === "error" && <p className="alert alert-error tw-foot-alert" role="alert">{gen.state.error}</p>}
              <button type="button" className={isLast && style.id !== "provador" ? "tw-go" : "tw-next"} disabled={!valid[step.id] || running} onClick={next}>
                {isLast && style.id !== "provador" ? <Sparkles size={15} aria-hidden="true" /> : null}
                {nextLabel}
                {!isLast && <ArrowRight size={15} aria-hidden="true" />}
              </button>
            </>
          }
        >
          {step.id === "avatar" && <AvatarStep avatars={avatars} value={s.avatarId} onChange={(avatarId) => patch({ avatarId })} />}
          {step.id === "produto" && <ProductStep products={products} value={s} onChange={patch} />}
          {step.id === "cena" && <SceneStep value={s} onChange={patch} />}
          {step.id === "visual" && <PovConfigStep value={s} onChange={patch} />}
          {step.id === "movimento" && <MovementStep value={s.movementId} onChange={(movementId) => patch({ movementId })} />}
          {step.id === "roteiro" && (
            <ScriptStep
              value={s}
              takes={takes}
              onVoice={(p) => patch(p)}
              onTake={(i, text) => patch({ takes: takes.map((t, n) => (n === i ? text : t)) })}
              onAutoFill={autoFill}
              autoBusy={scriptGen.state.status === "running"}
              onCreateScript={() => setScriptOpen(true)}
            />
          )}
          {step.id === "roteiro" && scriptGen.state.status === "error" && <p className="alert alert-error" role="alert">{scriptGen.state.error}</p>}
        </WizardCard>
      </>
    );
  }

  return (
    <div className="tw">
      {body}
      {running && <ThinkingOverlay messages={style.id === "provador" ? THINKING.kit : THINKING.direction} />}
      <ScriptModal open={scriptOpen} onClose={() => setScriptOpen(false)} prompt={scriptCopyPrompt(productName, takesCount)} />
      <Modal open={connectOpen} onClose={() => setConnectOpen(false)} title="Conecte o Gemini para gerar">
        <ConnectPanel
          onConnected={() => {
            setConnectOpen(false);
            toast("Gemini conectado! Clique para gerar de novo.");
          }}
        />
      </Modal>
    </div>
  );
}

export default function WizardPage() {
  const { style: id } = useParams();
  const style = getStyle(id);
  if (!style) return <NotFound />;
  return <Wizard key={style.id} style={style} />;
}
