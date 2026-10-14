import { prepareImage, type Part } from "../../lib/gemini";
import type { MediaItem } from "../../lib/mediaResolver";

/** Baixa uma imagem do próprio site (public/media) e a converte em parte de imagem para o Gemini. */
export async function urlToPart(url: string | undefined): Promise<Part | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    const prepared = await prepareImage(new File([blob], "referencia", { type: blob.type }));
    URL.revokeObjectURL(prepared.previewUrl);
    return prepared.part;
  } catch {
    return null;
  }
}

function once(el: HTMLVideoElement, event: string, ms = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`tempo esgotado: ${event}`)), ms);
    el.addEventListener(
      event,
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
    el.addEventListener("error", () => reject(new Error("vídeo não carregou")), { once: true });
  });
}

/** Captura um quadro do vídeo (do próprio site) e o converte em imagem para o Gemini. */
export async function videoFrameToPart(url: string): Promise<Part | null> {
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    await once(video, "loadeddata");
    const target = Math.min(0.5, (video.duration || 1) / 2);
    if (target > 0) {
      video.currentTime = target;
      await once(video, "seeked");
    }
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight, 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    video.removeAttribute("src");
    video.load();
    if (!blob) return null;
    const prepared = await prepareImage(new File([blob], "quadro.jpg", { type: "image/jpeg" }));
    URL.revokeObjectURL(prepared.previewUrl);
    return prepared.part;
  } catch {
    return null;
  }
}

/** Referência visual para a IA: a imagem, a capa do vídeo (se houver) ou um quadro do vídeo. */
export async function mediaItemToPart(item: MediaItem | null | undefined): Promise<Part | null> {
  if (!item) return null;
  if (item.kind === "image") return urlToPart(item.url);
  if (item.poster) {
    const fromPoster = await urlToPart(item.poster);
    if (fromPoster) return fromPoster;
  }
  return videoFrameToPart(item.url);
}
