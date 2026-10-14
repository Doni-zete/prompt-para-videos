declare module "virtual:media-manifest" {
  const manifest: {
    items: Record<string, { video?: string; image?: string }>;
    ignored: string[];
    warnings: string[];
    totalBytes: number;
  };
  export default manifest;
}

/** Preenchidos pelo Vite no build (vite.config.ts). */
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
