"""Acessibilidade automática (axe-core, WCAG 2 A e AA + boas práticas) nas telas e janelas principais.
Falha se houver QUALQUER violação. Precisa do axe-core: npm i axe-core (caminho em AXE_JS)."""
import os, sys
from playwright.sync_api import sync_playwright
URL=os.environ["APP_URL"]; AXE=open(os.environ.get("AXE_JS","/home/claude/tools/node_modules/axe-core/axe.min.js"),encoding="utf-8").read()
ok=True
def check(n,c,x=""):
    global ok; print(("PASS " if c else "FAIL ")+n+(" "+str(x) if x else "")); ok=ok and bool(c)
JS="axe.run(document,{resultTypes:['violations'],runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}}).then(r=>r.violations.map(v=>v.id+' ('+v.nodes.length+'x): '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' ; ')))"
def audit(pg,label):
    pg.evaluate(AXE); v=pg.evaluate(JS); check(f"acessibilidade: {label}", not v, v[:3])
PAGES=[("painel","#/","Prompt para Vídeo | TikTok Shop Creator"),("galeria","#/galeria","Galeria de Prompts | Prompt para Vídeo"),("galeria: vídeos","#/galeria?c=videos",None),("galeria: prompts prontas","#/galeria?c=prontas",None),
 ("geradores de prompt","#/geradores","Geradores de Prompt | Prompt para Vídeo"),("progresso semanal","#/progresso","Progresso Semanal | Prompt para Vídeo"),("manequins","#/manequins","Manequins | Prompt para Vídeo"),("humanizar IA","#/humano","Humanizar IA | Prompt para Vídeo"),("configurações","#/configuracoes","Configurações | Prompt para Vídeo"),
 ("trendly: estilos","#/trendly/reels","Reels Studio | Prompt para Vídeo"),("trendly: UGC","#/trendly/reels/ugc","Reels Studio: UGC | Prompt para Vídeo"),("trendly: POV","#/trendly/reels/pov",None),("trendly: Provador","#/trendly/reels/provador",None),
 ("trendly: influencer","#/trendly/influencer","Influencer Studio | Prompt para Vídeo"),("trendly: hacks","#/trendly/hacks",None),("trendly: hack frutas","#/trendly/hacks/frutas","Hacks Virais: Frutas Falantes | Prompt para Vídeo"),("trendly: produtos","#/trendly/produtos",None),("trendly: agente","#/trendly/agente",None),
 ("mapa de mídia","#/trendly/midia","Mapa de mídia | Prompt para Vídeo"),("em breve","#/em-breve/radar","Radar de Produto em Alta | Prompt para Vídeo"),("ferramenta: headlines","#/ferramenta/headlines",None),("ferramenta: análise de vídeo","#/ferramenta/analise-video",None),("ferramenta: UGC","#/ferramenta/ugc",None)]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":1600,"height":1000}).new_page(); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.evaluate("localStorage.setItem('ppv:skipped','true')")
    for label,h,title in PAGES:
        pg.goto(URL+h); pg.reload(); pg.wait_for_selector(".main"); pg.wait_for_timeout(500)
        audit(pg,label)
        if title: check(f"título da aba: {label}", pg.title()==title, pg.title())
    # janelas abertas
    pg.goto(URL+"#/galeria?c=prontas"); pg.reload(); pg.wait_for_selector(".gl-card"); pg.locator(".gl-card .gl-open").first.click(); pg.wait_for_selector("dialog[open] .gd"); pg.wait_for_timeout(300); audit(pg,"janela: detalhe do prompt pronto")
    pg.locator("dialog[open] .gd-actions .gd-pencil").click(); pg.wait_for_selector("dialog[open] #gd-prompt"); audit(pg,"janela: editor do prompt"); pg.keyboard.press("Escape"); pg.keyboard.press("Escape")
    pg.goto(URL+"#/galeria?c=videos"); pg.reload(); pg.wait_for_selector(".gl-card"); pg.locator(".gl-card").first.locator(".gl-open").click(); pg.wait_for_selector("dialog[open] .gd"); audit(pg,"janela: detalhe do vídeo (formato novo)"); pg.keyboard.press("Escape")
    pg.locator(".gl-card button[aria-label^='Montar prompt de']").first.click(); pg.wait_for_selector("dialog[open] .ws"); pg.wait_for_timeout(300); audit(pg,"janela: área de montagem")
    pg.goto(URL+"#/galeria"); pg.reload(); pg.wait_for_selector(".gl-card"); pg.locator(".gl-card .gl-open").first.click(); pg.wait_for_selector("dialog[open] .gd"); pg.get_by_role("button",name="Editar nome").click(); pg.wait_for_selector("dialog[open] .gd-rename"); audit(pg,"janela: renomear o título (lápis)"); pg.keyboard.press("Escape"); pg.keyboard.press("Escape")
    real=[e for e in errs if "Failed to load resource" not in e]; check("sem erros de página", not real, real[:2])
    b.close()
print("ALL OK" if ok else "FAILED"); sys.exit(0 if ok else 1)
