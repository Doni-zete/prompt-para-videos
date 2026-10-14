import { useMemo } from "react";
import { media } from "../../lib/media";
import { SEED_AVATARS, discoverAvatars, type Avatar } from "../data/avatars";

/** Avatares-base + os seus (fotos f-nome / m-nome em public/media/avatars). Não há cadastro pelo site. */
export function useAvatars() {
  const avatars = useMemo<Avatar[]>(() => [...discoverAvatars(media.idsIn("avatars")), ...SEED_AVATARS], []);
  return { avatars };
}
