import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { IMAGE_EXTS, VIDEO_EXTS } from "./media-scan";

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // o GitHub bloqueia arquivos acima de 100 MB
const CATEGORY = /^[a-z0-9-]{1,32}$/;
const NAME = /^[a-z0-9][a-z0-9._-]{0,120}$/i;

export type UploadResult = { ok: true; saved: string; replaced: string[] } | { ok: false; error: string };

/**
 * Grava um arquivo em public/media/<categoria>/<nome><ext>, trocando o arquivo antigo do mesmo tipo
 * (vídeo troca vídeo, imagem troca imagem; um .jpg ao lado do .mp4 continua sendo a capa).
 */
export function saveMedia(mediaDir: string, category: string, name: string, ext: string, data: Buffer): UploadResult {
  const e = ext.toLowerCase();
  const isVideo = VIDEO_EXTS.includes(e);
  const isImage = IMAGE_EXTS.includes(e);
  if (!CATEGORY.test(category)) return { ok: false, error: "Pasta inválida." };
  if (!NAME.test(name) || name.includes("..")) return { ok: false, error: "Nome de arquivo inválido." };
  if (!isVideo && !isImage) return { ok: false, error: `Formato "${e || "?"}" não é suportado. Use ${[...IMAGE_EXTS, ...VIDEO_EXTS].join(" ")}.` };
  if (!data.length) return { ok: false, error: "O arquivo está vazio." };
  if (data.length > MAX_UPLOAD_BYTES) return { ok: false, error: "O arquivo passa de 100 MB (limite do GitHub). Comprima antes de subir." };

  const root = resolve(mediaDir);
  const dir = resolve(root, category);
  if (dir !== join(root, category) || !dir.startsWith(root + sep)) return { ok: false, error: "Pasta inválida." };
  mkdirSync(dir, { recursive: true });

  const kinds = isVideo ? VIDEO_EXTS : IMAGE_EXTS;
  const replaced: string[] = [];
  for (const f of readdirSync(dir)) {
    const fe = extname(f).toLowerCase();
    if (f.slice(0, f.length - fe.length).toLowerCase() === name.toLowerCase() && kinds.includes(fe)) {
      unlinkSync(join(dir, f));
      replaced.push(f);
    }
  }
  const file = `${name}${e}`;
  writeFileSync(join(dir, file), data);
  return { ok: true, saved: `${category}/${file}`, replaced };
}

export const mediaDirExists = (dir: string) => existsSync(dir);
