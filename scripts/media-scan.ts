import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

export const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"];
export const VIDEO_EXTS = [".mp4", ".webm", ".m4v"];
const IGNORE_SILENTLY = new Set([".gitkeep", ".md", ".txt", ".ds_store", ".db"]);

export interface ManifestItem {
  video?: string;
  image?: string;
}
export interface Manifest {
  items: Record<string, ManifestItem>;
  ignored: string[];
  warnings: string[];
  totalBytes: number;
}
export interface ScanOptions {
  maxFileBytes?: number;
  maxTotalBytes?: number;
}

function walk(dir: string, base = ""): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out.sort();
}

const MB = 1024 * 1024;

/**
 * Lê public/media e monta o mapa "categoria/nome" -> arquivo.
 * A chave é o caminho sem extensão, em minúsculas (então "Giro-360.MP4" funciona como "giro-360").
 * O "?v=hash" muda só quando o conteúdo do arquivo muda, para o navegador não usar cópia velha.
 */
export function scanMedia(mediaDir: string, opts: ScanOptions = {}): Manifest {
  const maxFile = opts.maxFileBytes ?? 95 * MB;
  const maxTotal = opts.maxTotalBytes ?? 900 * MB;
  const manifest: Manifest = { items: {}, ignored: [], warnings: [], totalBytes: 0 };
  if (!existsSync(mediaDir)) return manifest;

  for (const rel of walk(mediaDir)) {
    const ext = extname(rel).toLowerCase();
    const name = rel.split("/").pop() ?? rel;
    const isVideo = VIDEO_EXTS.includes(ext);
    const isImage = IMAGE_EXTS.includes(ext);
    if (!isVideo && !isImage) {
      if (!IGNORE_SILENTLY.has(ext) && !IGNORE_SILENTLY.has(name.toLowerCase())) {
        manifest.ignored.push(rel);
        manifest.warnings.push(
          ext === ".mov"
            ? `media/${rel}: arquivos .mov quase nunca tocam no navegador. Converta para .mp4 (H.264).`
            : `media/${rel}: formato "${ext}" não é suportado e será ignorado.`,
        );
      }
      continue;
    }
    const full = join(mediaDir, rel);
    const buf = readFileSync(full);
    const size = statSync(full).size;
    manifest.totalBytes += size;
    if (size > maxFile) manifest.warnings.push(`media/${rel}: ${(size / MB).toFixed(0)} MB. O GitHub bloqueia arquivos acima de 100 MB. Comprima o vídeo.`);

    const key = rel.slice(0, rel.length - ext.length).toLowerCase();
    const hash = createHash("md5").update(buf).digest("hex").slice(0, 8);
    const entry = (manifest.items[key] ??= {});
    const value = `${rel}?v=${hash}`;
    if (isVideo) {
      const cur = entry.video;
      if (!cur || VIDEO_EXTS.indexOf(ext) < VIDEO_EXTS.indexOf(extname(cur.split("?")[0]).toLowerCase())) entry.video = value;
    } else {
      const cur = entry.image;
      if (!cur || IMAGE_EXTS.indexOf(ext) < IMAGE_EXTS.indexOf(extname(cur.split("?")[0]).toLowerCase())) entry.image = value;
    }
  }
  if (manifest.totalBytes > maxTotal) {
    manifest.warnings.push(`media/: ${(manifest.totalBytes / MB).toFixed(0)} MB no total. O GitHub recomenda repositórios abaixo de 1 GB.`);
  }
  return manifest;
}
