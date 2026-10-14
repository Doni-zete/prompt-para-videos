/** Mostra um prompt; os trechos ainda não preenchidos (entre colchetes) ficam destacados. */
const PLACEHOLDER = /(\[(?:VISUAL LOCK|SCALE LOCK|SUBJECT LOCK|SUBJECT|NARRATION|REAL USE|REAL TEST)[^\]]*\])/g;

export function PromptText({ text }: { text: string }) {
  const parts = text.split(PLACEHOLDER);
  return <pre className="ws-pre">{parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p))}</pre>;
}
