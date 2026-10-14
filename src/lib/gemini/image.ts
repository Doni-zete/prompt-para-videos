import type { Part } from "./types";

export interface PreparedImage {
  id: string;
  name: string;
  previewUrl: string;
  part: Part;
}

const MAX_SIDE = 1536;
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/webp"];

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(blob);
  });
}

/** Redimensiona e comprime no navegador: menos banda, menos tokens e upload mais rápido. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!ACCEPTED_IMAGES.includes(file.type)) {
    throw new Error(`"${file.name}" não é suportada. Use JPG, PNG ou WEBP.`);
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error(`"${file.name}" passa de 25 MB.`);
  }
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(`Não consegui abrir "${file.name}". O arquivo pode estar corrompido.`);
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
  if (!blob) throw new Error("Falha ao comprimir a imagem.");

  return {
    id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
    name: file.name,
    previewUrl: URL.createObjectURL(blob),
    part: { inlineData: { mimeType: "image/jpeg", data: await blobToBase64(blob) } },
  };
}
