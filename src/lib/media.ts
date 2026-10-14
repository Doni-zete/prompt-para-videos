import manifest from "virtual:media-manifest";
import { createMediaResolver } from "./mediaResolver";

/** Mídia do projeto (public/media). O mapa é gerado no build, a partir dos arquivos da pasta. */
export const media = createMediaResolver(manifest, import.meta.env.BASE_URL);
