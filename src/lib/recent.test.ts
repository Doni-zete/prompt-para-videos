import { describe, expect, it } from "vitest";
import { isTrackedTool, MAX_RECENT, pushRecent, type RecentItem } from "./recent";

const it1 = (id: string, kind: RecentItem["kind"] = "tool"): RecentItem => ({ kind, id, title: id, to: `/${id}`, t: 1 });

describe("continue de onde parou", () => {
  it("o mais novo vai para o topo e não repete", () => {
    let l: RecentItem[] = [];
    l = pushRecent(l, it1("a"));
    l = pushRecent(l, it1("b"));
    l = pushRecent(l, it1("a"));
    expect(l.map((r) => r.id)).toEqual(["a", "b"]);
  });
  it("mesmo id em tipos diferentes são itens diferentes", () => {
    const l = pushRecent(pushRecent([], it1("x", "tool")), it1("x", "prompt"));
    expect(l).toHaveLength(2);
  });
  it("guarda no máximo 6", () => {
    let l: RecentItem[] = [];
    for (let i = 0; i < 10; i++) l = pushRecent(l, it1(`i${i}`));
    expect(l).toHaveLength(MAX_RECENT);
    expect(l[0].id).toBe("i9");
  });
  it("só ferramentas entram, não Configurações nem o painel", () => {
    for (const p of ["/ferramenta/pov", "/trendly/reels/ugc", "/humano", "/manequins"]) expect(isTrackedTool(p), p).toBe(true);
    for (const p of ["/", "/configuracoes", "/galeria", "/geradores", "/em-breve/radar"]) expect(isTrackedTool(p), p).toBe(false);
  });
});
