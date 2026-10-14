import { logEvent } from "./diagnostics";
import type { MediaCategory } from "./mediaResolver";

export const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"];
export const VIDEO_EXTS = [".mp4", ".webm", ".m4v"];
export const ACCEPT = [...IMAGE_EXTS, ...VIDEO_EXTS].join(",");
export const MAX_BYTES = 100 * 1024 * 1024;

export const extOf = (fileName: string) => {
  const i = fileName.lastIndexOf(".");
  return i > 0 ? fileName.slice(i).toLowerCase() : "";
};

/** Mensagem de erro em português, ou null quando o arquivo pode subir. */
export function validateFile(file: Pick<File, "name" | "size">): string | null {
  const e = extOf(file.name);
  if (e === ".mov") return "Vídeo .mov (iPhone) não toca no navegador. Converta para MP4 (H.264) e tente de novo.";
  if (!IMAGE_EXTS.includes(e) && !VIDEO_EXTS.includes(e)) return `Formato "${e || "sem extensão"}" não é suportado. Use ${[...IMAGE_EXTS, ...VIDEO_EXTS].join(" ")}.`;
  if (file.size === 0) return "O arquivo está vazio.";
  if (file.size > MAX_BYTES) return "O arquivo passa de 100 MB (limite do GitHub). Comprima antes de subir.";
  return null;
}

export type UploadMode = "dev" | "download";
export interface UploadOutcome {
  mode: UploadMode;
  /** Caminho relativo ao projeto, ex.: public/media/poses/sentado.mp4 */
  path: string;
}

// ---------- 1) npm run dev: o servidor grava direto em public/media ----------
const devUrl = (p: string) => new URL(p, document.baseURI).toString();
let devOk: Promise<boolean> | null = null;
export const hasDevUpload = () =>
  (devOk ??= fetch(devUrl("__media/ping"), { headers: { "x-media-upload": "1" } })
    .then((r) => r.ok && (r.headers.get("content-type") || "").includes("json"))
    .catch(() => false));

async function viaDev(category: string, name: string, file: File): Promise<UploadOutcome> {
  const q = new URLSearchParams({ category, name, ext: extOf(file.name) });
  const r = await fetch(devUrl(`__media/upload?${q}`), { method: "POST", headers: { "x-media-upload": "1" }, body: file });
  const j = (await r.json().catch(() => null)) as { ok: boolean; saved?: string; error?: string } | null;
  if (!j?.ok) throw new Error(j?.error || "Não foi possível salvar o arquivo.");
  return { mode: "dev", path: `public/media/${j.saved}` };
}

// ---------- 2) Site publicado (GitHub Pages, Vercel) ou qualquer navegador sem npm run dev ----------
// Um site publicado não consegue escrever no projeto: baixa o arquivo já com o nome certo.
// (Escolher a pasta do projeto pelo navegador não dá: ele só abre o seletor logo após um clique, e aqui o clique já foi gasto escolhendo o arquivo.)
function viaDownload(category: string, name: string, file: File): UploadOutcome {
  const a = document.createElement("a");
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = `${name}${extOf(file.name)}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { mode: "download", path: `public/media/${category}/${name}${extOf(file.name)}` };
}

/** Coloca o arquivo em public/media/<categoria>/<nome>.<ext>: pelo servidor do npm run dev ou, no site publicado, por download. */
export async function uploadMedia(category: MediaCategory, name: string, file: File): Promise<UploadOutcome> {
  const bad = validateFile(file);
  if (bad) {
    logEvent("envio", `${category}/${name}: ${bad}`);
    throw new Error(bad);
  }
  try {
    if (await hasDevUpload()) return await viaDev(category, name, file);
    return viaDownload(category, name, file);
  } catch (e) {
    logEvent("envio", `${category}/${name}: ${(e as Error).message}`);
    throw e;
  }
}

/** Texto do aviso depois de enviar, conforme o caminho usado. */
export function outcomeMessage(r: UploadOutcome): string {
  if (r.mode === "dev") return `Salvo em ${r.path}. A página recarrega sozinha.`;
  return `Este site publicado não grava no projeto. Baixei ${r.path.split("/").pop()}: coloque em ${r.path.replace(/[^/]+$/, "")} no seu computador e faça o commit.`;
}
