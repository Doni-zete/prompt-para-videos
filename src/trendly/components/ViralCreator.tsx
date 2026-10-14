import { useState } from "react";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { ConnectPanel } from "../../components/ConnectPanel";
import { Modal } from "../../components/Modal";
import { ResultView } from "../../components/ResultView";
import { useGemini } from "../../context/GeminiContext";
import { useGenerate } from "../../hooks/useGenerate";
import type { Part } from "../../lib/gemini";
import { FRUITS, PERSONALITIES, type Hack } from "../data/hacks";
import { media } from "../../lib/media";
import { avatarNames } from "../data/avatars";
import { useAvatars } from "../hooks/useAvatars";
import { mediaItemToPart } from "../lib/mediaPart";
import { scriptsSystem, scriptsUser, videoSystem, videoUser } from "../lib/prompts";
import { AvatarPicker } from "./AvatarPicker";

interface Props {
  hack: Hack;
  open: boolean;
  onClose: () => void;
}

/** "Criador de Vídeo Viral": 1) personagem, 2) roteiro, 3) prompts do vídeo. */
export function ViralCreator({ hack, open, onClose }: Props) {
  const { status } = useGemini();
  const { avatars } = useAvatars();
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [freeChar, setFreeChar] = useState("");
  const [fruitId, setFruitId] = useState<string | null>(null);
  const [personality, setPersonality] = useState<string>(PERSONALITIES[0]);
  const [theme, setTheme] = useState<string>(hack.themes[0] ?? "");
  const [pick, setPick] = useState<number | "custom" | null>(null);
  const [custom, setCustom] = useState("");

  const scripts = useGenerate();
  const video = useGenerate();

  const avatar = avatars.find((a) => a.id === avatarId);
  const fruit = FRUITS.find((f) => f.id === fruitId);

  let character = "";
  if (hack.characterKind === "fruit") {
    if (fruit) character = `${fruit.name} antropomórfica(o) com rosto expressivo, personalidade ${personality}, em um cenário de cozinha realista`;
  } else if (avatar) {
    character = `${avatar.name.trim() || "Avatar"}${avatar.description.trim() ? `. ${avatar.description.trim()}` : ""}`;
  } else if (freeChar.trim()) {
    character = freeChar.trim();
  }

  const options = scripts.state.output?.sections.flatMap((s) => s.items) ?? [];
  const chosenScript = pick === "custom" ? custom.trim() : typeof pick === "number" ? (options[pick]?.text ?? "") : "";

  const makeScripts = () => {
    setPick(null);
    video.reset();
    void scripts.run({
      system: scriptsSystem(hack),
      temperature: 0.95,
      build: async () => ({ parts: [{ text: scriptsUser({ hack, character, theme }) }] }),
    });
  };

  const makeVideo = () => {
    void video.run({
      system: videoSystem(hack),
      temperature: 0.8,
      build: async () => {
        const parts: Part[] = [];
        if (hack.characterKind === "avatar" && avatar) {
          const photo = await mediaItemToPart(media.resolve("avatars", avatarNames(avatar)));
          if (photo) parts.push(photo);
        }
        parts.push({ text: videoUser({ hack, character, theme, script: chosenScript }) });
        return { parts };
      },
    });
  };

  const runningScripts = scripts.state.status === "running";
  const runningVideo = video.state.status === "running";

  return (
    <Modal open={open} onClose={onClose} title="Criador de Vídeo Viral" wide>
      {status !== "connected" ? (
        <ConnectPanel />
      ) : (
        <div className="stack tl-viral">
          <div className="tl-rules" role="note">
            <strong><ShieldCheck size={15} aria-hidden="true" /> Regras deste estilo</strong>
            <ul>{hack.rules.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>

          <div className="tl-step">
            <h3>{hack.characterKind === "fruit" ? "1. Escolha uma fruta" : "1. Escolha um rosto (ator)"}</h3>
            {hack.characterKind === "fruit" ? (
              <>
                <div className="tl-fruits" role="radiogroup" aria-label="Escolha uma fruta">
                  {FRUITS.map((f) => (
                    <button key={f.id} type="button" role="radio" aria-checked={fruitId === f.id} className={`tl-fruit ${fruitId === f.id ? "on" : ""}`} onClick={() => setFruitId(f.id)}>
                      <span aria-hidden="true">{f.emoji}</span>
                      {f.name}
                    </button>
                  ))}
                </div>
                <div className="field">
                  <label htmlFor="vc-pers">Personalidade</label>
                  <select id="vc-pers" value={personality} onChange={(e) => setPersonality(e.target.value)}>
                    {PERSONALITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <AvatarPicker avatars={avatars} selectedId={avatarId} onSelect={setAvatarId} />
                <div className="field">
                  <label htmlFor="vc-free">Ou descreva o personagem (fictício)</label>
                  <input id="vc-free" value={freeChar} disabled={!!avatar} placeholder="Ex.: mulher de 40 anos, cabelo preso, ambiente aconchegante" onChange={(e) => setFreeChar(e.target.value)} />
                </div>
              </>
            )}
          </div>

          <div className="tl-step">
            <h3>2. O que a pessoa vai falar?</h3>
            <div className="tl-chips" role="group" aria-label="Temas sugeridos">
              {hack.themes.map((t) => (
                <button key={t} type="button" className={`tl-chip ${theme === t ? "on" : ""}`} aria-pressed={theme === t} onClick={() => setTheme(t)}>{t}</button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="vc-theme">Tema (você pode editar)</label>
              <input id="vc-theme" value={theme} onChange={(e) => setTheme(e.target.value)} />
            </div>
            <button type="button" className="btn btn-ghost" onClick={makeScripts} disabled={!character || !theme.trim() || runningScripts}>
              {runningScripts ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} {options.length ? "Gerar outros roteiros" : "Gerar roteiros com IA"}
            </button>
            {!character && <p className="tl-hint">Escolha o personagem para liberar os roteiros.</p>}
            {scripts.state.status === "error" && <p className="alert alert-error" role="alert">{scripts.state.error}</p>}

            {(options.length > 0 || scripts.state.status === "done") && (
              <div className="tl-scripts" role="radiogroup" aria-label="Escolha um roteiro">
                {options.map((o, i) => (
                  <button key={i} type="button" role="radio" aria-checked={pick === i} className={`tl-script ${pick === i ? "on" : ""}`} onClick={() => setPick(i)}>
                    <small>{o.label ?? `Roteiro ${i + 1}`}</small>
                    {o.text}
                  </button>
                ))}
                <div className={`tl-script tl-script-custom ${pick === "custom" ? "on" : ""}`}>
                  <small>Escrever o meu</small>
                  <textarea rows={3} value={custom} aria-label="Escrever o meu roteiro" placeholder="Digite a fala do personagem…" onFocus={() => setPick("custom")} onChange={(e) => { setCustom(e.target.value); setPick("custom"); }} />
                </div>
              </div>
            )}
          </div>

          <button type="button" className="btn btn-primary btn-lg" onClick={makeVideo} disabled={!chosenScript || runningVideo}>
            {runningVideo ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} {runningVideo ? "Gerando…" : "3. Gerar prompts do vídeo"}
          </button>
          {video.state.status === "error" && <p className="alert alert-error" role="alert">{video.state.error}</p>}
          {video.state.status === "done" && video.state.output && (
            <ResultView output={video.state.output} model={video.state.model} filename={`trendly-${hack.id}`} onRegenerate={makeVideo} busy={runningVideo} />
          )}
        </div>
      )}
    </Modal>
  );
}
