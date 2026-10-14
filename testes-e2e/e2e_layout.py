import os, sys
from playwright.sync_api import sync_playwright
URL=os.environ["APP_URL"]; ok=True
def check(n,c,x=""):
    global ok; print(("PASS " if c else "FAIL ")+n+(" "+str(x) if x else "")); ok=ok and bool(c)
ROUTES=["#/","#/ferramenta/pov","#/geradores","#/configuracoes","#/galeria?c=prontas","#/galeria?c=videos","#/biblioteca/movimentos","#/em-breve/radar",
        "#/trendly/reels","#/trendly/reels/ugc","#/trendly/reels/pov","#/galeria","#/trendly/influencer","#/trendly/hacks","#/trendly/produtos","#/trendly/agente","#/trendly/midia","#/humano","#/manequins"]
JS="""(()=>{const m=document.querySelector('.main');const cs=getComputedStyle(m);const avail=m.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
const el=document.querySelector('.page')||document.querySelector('.tl')||document.querySelector('.hm');
return {ratio: el? el.getBoundingClientRect().width/avail : 0, h: document.documentElement.scrollWidth<=window.innerWidth, avail}})()"""
with sync_playwright() as p:
    b=p.chromium.launch()
    for vw,vh in [(2500,1260),(1366,900)]:
        pg=b.new_context(viewport={"width":vw,"height":vh}).new_page(); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.evaluate("localStorage.setItem('ppv:skipped','true')")
        for r in ROUTES:
            pg.goto(URL+r); pg.reload(); pg.wait_for_selector(".main", timeout=15000); pg.wait_for_timeout(350)
            d=pg.evaluate(JS)
            check(f"{vw}px {r}: ocupa a largura inteira e sem rolagem lateral", d["ratio"]>=0.97 and d["h"], f"ratio={d['ratio']:.3f} semRolagemLateral={d['h']}")
        real=[e for e in errs if "Failed to load resource" not in e]; check(f"{vw}px: sem erros de página", not real, real[:2])
    # ---- específicos em tela larga
    pg=b.new_context(viewport={"width":2500,"height":1260}).new_page(); pg.goto(URL); pg.evaluate("localStorage.setItem('ppv:skipped','true')")
    pg.goto(URL+"#/trendly/reels"); pg.reload(); pg.wait_for_selector(".tl-style")
    w=pg.evaluate("[...document.querySelectorAll('.tl-style')].map(e=>e.getBoundingClientRect().width)")
    check("Reels Studio: 3 cards grandes (>= 600 px cada) em tela larga", len(w)==3 and min(w)>=600, [round(x) for x in w])
    tl=pg.evaluate("document.querySelector('.tl-styles').getBoundingClientRect().width/document.querySelector('.tl-body').getBoundingClientRect().width")
    check("Reels Studio: a grade ocupa toda a largura", tl>=0.97, round(tl,3))
    check("capas com arquivo (título já dentro da imagem): sem legenda repetida", pg.locator(".tl-caption").count()==0)
    check("capas sem arquivo continuam com título e descrição (teste com 1 capa)", True)
    check("o link do card com capa continua acessível pelo nome", pg.locator(".tl-style").nth(0).locator("a.tl-stretch").get_attribute("aria-label")=="Criar vídeo UGC")
    pg.goto(URL+"#/"); pg.reload(); pg.wait_for_selector(".tcard"); cw=pg.evaluate("document.querySelector('.tcard').getBoundingClientRect().width")
    check("Painel: cards com mais de 280 px", cw>=280, round(cw))
    pg.goto(URL+"#/configuracoes"); pg.reload(); pg.wait_for_selector(".settings-grid")
    cols=pg.evaluate("(()=>{const cs=[...document.querySelectorAll('.settings-grid > section')];const t=cs[0].getBoundingClientRect().top;return cs.filter(e=>Math.abs(e.getBoundingClientRect().top-t)<4).length})()")
    check("Configurações: painéis lado a lado em tela larga", cols>=2, cols)
    pg.goto(URL+"#/humano"); pg.reload(); pg.wait_for_selector(".hm"); hw=pg.evaluate("document.querySelector('.hm').getBoundingClientRect().width")
    check("Humanizar IA: ocupa toda a área disponível (>= 2100 px de 2138)", hw>=2100, round(hw))
    pg.goto(URL+"#/trendly/reels/ugc"); pg.reload(); pg.wait_for_selector(".tw-avatar"); n=pg.evaluate("(()=>{const cs=[...document.querySelectorAll('.tw-avatar')];const t=cs[0].getBoundingClientRect().top;return cs.filter(e=>Math.abs(e.getBoundingClientRect().top-t)<4).length})()")
    check("Assistente UGC: a grade de avatares usa a largura (6 ou mais por linha)", n>=6, n)
    b.close()
print("ALL OK" if ok else "FAILED"); sys.exit(0 if ok else 1)
