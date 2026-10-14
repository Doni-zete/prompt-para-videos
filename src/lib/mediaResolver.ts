export type MediaCategory = "styles" | "gallery" | "avatars" | "products" | "interactions" | "poses" | "hands" | "hacks" | "library" | "humano";

export interface MediaManifest {
  items: Record<string, { video?: string; image?: string }>;
  ignored: string[];
  warnings: string[];
  totalBytes: number;
}

export interface MediaItem {
  kind: "image" | "video";
  url: string;
  /** Imagem de capa do vídeo (quando existe um arquivo de imagem com o mesmo nome). */
  poster?: string;
  key: string;
}

export interface Resolver {
  resolve(category: MediaCategory, names: string[], opts?: { kind?: "image" | "video" }): MediaItem | null;
  has(category: MediaCategory, names: string[]): boolean;
  /** Nomes (sem a categoria) de tudo o que existe em uma categoria. */
  idsIn(category: MediaCategory): string[];
  allKeys(): string[];
  manifest: MediaManifest;
}

/** Liga um card ao arquivo pelo nome: public/media/<categoria>/<nome>.<ext>. Aceita vários nomes, o primeiro que existir vence. */
export function createMediaResolver(manifest: MediaManifest, baseUrl = "./"): Resolver {
  const base = `${baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`}media/`;

  function resolve(category: MediaCategory, names: string[], opts?: { kind?: "image" | "video" }): MediaItem | null {
    for (const raw of names) {
      const key = `${category}/${raw}`.toLowerCase();
      const entry = manifest.items[key];
      if (!entry) continue;
      if (opts?.kind === "image") {
        if (entry.image) return { kind: "image", url: base + entry.image, key };
        continue;
      }
      if (opts?.kind === "video") {
        if (entry.video) return { kind: "video", url: base + entry.video, poster: entry.image ? base + entry.image : undefined, key };
        continue;
      }
      if (entry.video) return { kind: "video", url: base + entry.video, poster: entry.image ? base + entry.image : undefined, key };
      if (entry.image) return { kind: "image", url: base + entry.image, key };
    }
    return null;
  }

  return {
    resolve,
    has: (category, names) => resolve(category, names) !== null,
    idsIn: (category) => Object.keys(manifest.items).filter((k) => k.startsWith(`${category}/`)).map((k) => k.slice(category.length + 1)),
    allKeys: () => Object.keys(manifest.items),
    manifest,
  };
}
