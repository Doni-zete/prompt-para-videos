import { API_BASE, authHeaders, sleep } from "./http";
import { GeminiError, classifyHttp, toGeminiError } from "./errors";
import type { Part } from "./types";

export interface UploadedFile {
  name: string;
  uri: string;
  mimeType: string;
}

function uploadBytes(url: string, file: File, onProgress: (p: number) => void, signal?: AbortSignal): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("X-Goog-Upload-Offset", "0");
    xhr.setRequestHeader("X-Goog-Upload-Command", "upload, finalize");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () => reject(new GeminiError("NETWORK", "Falha ao enviar o vídeo. Verifique sua internet."));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    xhr.onload = () => {
      let body: { file?: { name: string; uri: string; mimeType: string } } | undefined;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* resposta não-JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body?.file) {
        resolve({ name: body.file.name, uri: body.file.uri, mimeType: body.file.mimeType });
      } else {
        reject(classifyHttp(xhr.status, body as never));
      }
    };
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

/** Envia o vídeo pela File API (upload resumável) e espera o processamento terminar. */
export async function uploadVideo(
  apiKey: string,
  file: File,
  onStatus: (message: string, progress?: number) => void,
  signal?: AbortSignal,
): Promise<UploadedFile> {
  try {
    onStatus("Enviando vídeo…", 0);
    const start = await fetch(`${API_BASE}/upload/v1beta/files`, {
      method: "POST",
      headers: authHeaders(apiKey, {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(file.size),
        "X-Goog-Upload-Header-Content-Type": file.type || "video/mp4",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ file: { display_name: file.name.slice(0, 80) } }),
      signal,
    });
    if (!start.ok) throw classifyHttp(start.status, await start.json().catch(() => undefined));
    const uploadUrl = start.headers.get("x-goog-upload-url");
    if (!uploadUrl) {
      throw new GeminiError("BAD_RESPONSE", "O Google não devolveu o endereço de upload do vídeo.");
    }

    const uploaded = await uploadBytes(uploadUrl, file, (p) => onStatus("Enviando vídeo…", p), signal);

    onStatus("Processando vídeo no Gemini…");
    for (let i = 0; i < 60; i++) {
      const res = await fetch(`${API_BASE}/v1beta/${uploaded.name}`, { headers: authHeaders(apiKey), signal });
      const info = await res.json().catch(() => undefined);
      if (!res.ok) throw classifyHttp(res.status, info);
      if (info.state === "ACTIVE") return { ...uploaded, uri: info.uri ?? uploaded.uri };
      if (info.state === "FAILED") {
        throw new GeminiError("BAD_RESPONSE", "O Gemini não conseguiu processar este vídeo. Tente outro arquivo.");
      }
      await sleep(3000, signal);
    }
    throw new GeminiError("TIMEOUT", "O processamento do vídeo demorou demais.");
  } catch (e) {
    throw toGeminiError(e);
  }
}

export async function deleteUploadedFile(apiKey: string, name: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/v1beta/${name}`, { method: "DELETE", headers: authHeaders(apiKey) });
  } catch {
    /* limpeza é best-effort; o Google apaga sozinho em 48h */
  }
}

export const videoPart = (f: UploadedFile): Part => ({ fileData: { mimeType: f.mimeType, fileUri: f.uri } });
