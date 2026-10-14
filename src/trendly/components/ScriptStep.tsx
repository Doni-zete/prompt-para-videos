import { Info, Loader2, Star } from "lucide-react";
import { TONES, VOICES, type VoiceId } from "../data/options";
import { MAX_WORDS, MIN_WORDS, TAKE_SECONDS, countWords, wordState } from "../lib/words";
import { SectionLabel } from "./Choice";

export interface VoiceState {
  voice: VoiceId;
  tone: string;
}

interface Props {
  value: VoiceState;
  takes: string[];
  onVoice: (patch: Partial<VoiceState>) => void;
  onTake: (index: number, text: string) => void;
  onAutoFill: () => void;
  autoBusy: boolean;
  onCreateScript: () => void;
}

const COUNTER_LABEL = { empty: "", short: "curto", ok: "", long: "passou do limite" } as const;

export function ScriptStep({ value, takes, onVoice, onTake, onAutoFill, autoBusy, onCreateScript }: Props) {
  return (
    <div className="tw-stack">
      <div className="tw-voice-row">
        <div>
          <SectionLabel>Voz do avatar</SectionLabel>
          <div className="tw-segment" role="radiogroup" aria-label="Voz do avatar">
            {VOICES.map((v) => (
              <button key={v.id} type="button" role="radio" aria-checked={value.voice === v.id} className={value.voice === v.id ? "on" : ""} onClick={() => onVoice({ voice: v.id })}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel>Tonalidade</SectionLabel>
          <div className="tw-tones" role="radiogroup" aria-label="Tonalidade">
            {TONES.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={value.tone === t} className={`tw-tone ${value.tone === t ? "on" : ""}`} onClick={() => onVoice({ tone: t })}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tw-script-head">
        <SectionLabel>Roteiro (copy)</SectionLabel>
        <div className="tw-script-actions">
          <button type="button" className="tw-ghost-sm" onClick={onCreateScript}>
            <Info size={12} aria-hidden="true" /> CRIAR ROTEIRO
          </button>
          <button type="button" className="tw-pink-sm" onClick={onAutoFill} disabled={autoBusy}>
            {autoBusy ? <Loader2 size={12} className="spin" /> : <Star size={12} aria-hidden="true" />} PREENCHER AUTOMÁTICO
          </button>
        </div>
      </div>

      {takes.map((text, i) => {
        const n = countWords(text);
        const st = wordState(n);
        return (
          <div key={i} className="tw-take">
            <label htmlFor={`take-${i}`}>
              TAKE {i + 1} ({TAKE_SECONDS}S)
            </label>
            <div className={`tw-take-box ${st}`}>
              <textarea id={`take-${i}`} rows={3} value={text} placeholder={`Digite o roteiro do Take ${i + 1}...`} onChange={(e) => onTake(i, e.target.value)} />
              <span className={`tw-counter ${st}`}>
                {n} / {MAX_WORDS} palavras{COUNTER_LABEL[st] ? ` · ${COUNTER_LABEL[st]}` : ""}
              </span>
            </div>
          </div>
        );
      })}
      <p className="tw-hint tw-hint-i">
        <Info size={12} aria-hidden="true" /> Para preencher {TAKE_SECONDS}s, o ideal é de {MIN_WORDS} a {MAX_WORDS} palavras por take.
      </p>
    </div>
  );
}
