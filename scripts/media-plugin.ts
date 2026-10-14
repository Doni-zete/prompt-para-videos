import { join } from "node:path";
import type { Plugin } from "vite";
import { scanMedia } from "./media-scan";
import { MAX_UPLOAD_BYTES, saveMedia } from "./media-upload";
import { saveUserData } from "./user-data";

const ID = "virtual:media-manifest";
const RESOLVED = `\0${ID}`;
const norm = (p: string) => p.replace(/\\/g, "/");

/** Gera, a cada build/dev, o mapa dos arquivos de public/media. Nada de lista manual. */
export function mediaManifest(): Plugin {
  let mediaDir = join(process.cwd(), "public", "media");
  let userDataFile = join(process.cwd(), "src", "data", "userData.json");
  return {
    name: "media-manifest",
    configResolved(config) {
      mediaDir = join(config.publicDir || join(config.root, "public"), "media");
      userDataFile = join(config.root, "src", "data", "userData.json");
    },
    resolveId(id) {
      return id === ID ? RESOLVED : null;
    },
    load(id) {
      if (id !== RESOLVED) return null;
      const manifest = scanMedia(mediaDir);
      manifest.warnings.forEach((w) => this.warn(w));
      return `export default ${JSON.stringify(manifest)};`;
    },
    configureServer(server) {
      // Subida pelo Mapa de mídia (só no npm run dev). O cabeçalho x-media-upload impede que outro site mande arquivos.
      // Salvar prompts, edições e favoritos no projeto (só no npm run dev), para valer no GitHub Pages e na Vercel.
      server.middlewares.use("/__data", (req, res) => {
        const send = (code: number, body: unknown) => {
          res.statusCode = code;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(body));
        };
        if (req.headers["x-media-upload"] !== "1") return send(403, { ok: false, error: "Pedido recusado." });
        const url = new URL(req.url || "/", "http://localhost");
        if (req.method === "GET" && url.pathname === "/ping") return send(200, { ok: true });
        if (req.method !== "POST" || url.pathname !== "/save") return send(404, { ok: false, error: "Não encontrado." });
        const chunks: Buffer[] = [];
        let size = 0;
        req.on("data", (c: Buffer) => {
          size += c.length;
          if (size <= 6 * 1024 * 1024) chunks.push(c);
        });
        req.on("end", () => {
          const r = size > 6 * 1024 * 1024 ? ({ ok: false, error: "Os dados passam de 5 MB." } as const) : saveUserData(userDataFile, Buffer.concat(chunks).toString("utf8"));
          send(r.ok ? 200 : 400, r);
        });
      });
      server.middlewares.use("/__media", (req, res) => {
        const send = (code: number, body: unknown) => {
          res.statusCode = code;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(body));
        };
        if (req.headers["x-media-upload"] !== "1") return send(403, { ok: false, error: "Pedido recusado." });
        const url = new URL(req.url || "/", "http://localhost");
        if (req.method === "GET" && url.pathname === "/ping") return send(200, { ok: true });
        if (req.method !== "POST" || url.pathname !== "/upload") return send(404, { ok: false, error: "Não encontrado." });
        const chunks: Buffer[] = [];
        let size = 0;
        let aborted = false;
        req.on("data", (c: Buffer) => {
          size += c.length;
          if (size > MAX_UPLOAD_BYTES) {
            aborted = true;
            send(413, { ok: false, error: "O arquivo passa de 100 MB (limite do GitHub). Comprima antes de subir." });
            req.destroy();
            return;
          }
          chunks.push(c);
        });
        req.on("end", () => {
          if (aborted) return;
          const r = saveMedia(mediaDir, url.searchParams.get("category") || "", url.searchParams.get("name") || "", url.searchParams.get("ext") || "", Buffer.concat(chunks));
          send(r.ok ? 200 : 400, r);
        });
      });
      server.watcher.add(mediaDir);
      const refresh = (file: string) => {
        if (!norm(file).startsWith(norm(mediaDir))) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", refresh).on("change", refresh).on("unlink", refresh);
    },
  };
}
