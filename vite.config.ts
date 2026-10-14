/// <reference types="vitest" />
import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { mediaManifest } from "./scripts/media-plugin";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };
const builtAt = new Date().toISOString();

/** Gera health.json no build (versão e hora), útil para conferir qual versão está publicada. */
const healthFile = (): PluginOption => ({
  name: "health-file",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "health.json", source: JSON.stringify({ ok: true, version: pkg.version, builtAt }) });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiOrigins = new Set<string>();
  if (env.VITE_DIVULGADOR_API_URL) apiOrigins.add(new URL(env.VITE_DIVULGADOR_API_URL).origin);
  if (mode !== "production") {
    apiOrigins.add("http://localhost:3001");
    apiOrigins.add("http://127.0.0.1:3001");
  }
  const connectSources = ["'self'", "https://generativelanguage.googleapis.com", ...apiOrigins].join(" ");

  return {
    plugins: [
      react(),
      mediaManifest(),
      healthFile(),
      {
        name: "divulgador-csp",
        transformIndexHtml(html: string) {
          return html.replace(/connect-src\s+[^;]+;/, `connect-src ${connectSources};`);
        },
      },
    ],
    define: { __APP_VERSION__: JSON.stringify(pkg.version), __BUILD_TIME__: JSON.stringify(builtAt) },
    base: "./",
    build: { sourcemap: false, chunkSizeWarningLimit: 700 },
    test: { environment: "node", include: ["src/**/*.test.ts", "scripts/**/*.test.ts"] },
  };
});
