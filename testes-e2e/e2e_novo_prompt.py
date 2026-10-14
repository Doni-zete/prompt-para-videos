import os, sys, glob
from playwright.sync_api import sync_playwright
URL=os.environ.get("APP_URL","http://localhost:5412"); ROOT="/home/claude/ppv/public/media"
fails=[]
def check(n,c):
    print(("PASS " if c else "FAIL ")+n)
    if not c: fails.append(n)
def enter(pg):
    pg.goto(URL+"/"); 
    t=pg.get_by_text("Explorar a biblioteca de prompts sem conectar")
    if t.count(): t.click()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1600,"height":1000}); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    enter(pg); pg.goto(URL+"/#/galeria"); pg.wait_for_selector(".gl-card")
    check("banner tem botão Subir vídeo ou imagem", pg.get_by_role("button",name="Subir vídeo ou imagem").count()==1)
    pg.get_by_role("button",name="Novo prompt").click()
    check("diálogo tem campo de imagem ou vídeo", pg.locator("#np-media").count()==1)
    pg.fill("#np-title","Mesa teste"); pg.fill("#np-prompt","texto do prompt")
    pg.set_input_files("#np-media","/tmp/t.webm")
    pg.get_by_role("button",name="Salvar prompt").click(); pg.wait_for_timeout(3500)
    check("arquivo gravado em library/mesa-teste.webm", os.path.exists(ROOT+"/library/mesa-teste.webm"))
    enter(pg); pg.goto(URL+"/#/galeria?c=prontas"); pg.wait_for_selector(".gl-card")
    card=pg.locator(".gl-card").filter(has_text="Mesa teste")
    check("o card novo existe, é VÍDEO e tem <video>", card.count()==1 and "VÍDEO" in card.locator(".gl-chips").inner_text().upper() and card.locator("video").count()==1)
    card.locator(".gl-open").click(); pg.wait_for_selector(".gd")
    check("detalhe do card com mídia tem lápis de trocar", pg.get_by_role("button",name="Trocar a vídeo de Mesa teste").count()==1 or pg.locator(".gd-swap button").count()==1)
    pg.keyboard.press("Escape")
    # mapa de mídia
    pg.goto(URL+"/#/trendly/midia"); pg.wait_for_selector(".tl-map-row", state="attached")
    row=pg.locator(".tl-map-row").filter(has_text="Mesa teste")
    check("Mapa de mídia lista o prompt criado, já com arquivo", row.count()==1 and "ok" in (row.get_attribute("class") or "").split())
    check("sem aviso de arquivo sem dono para ele", "library/mesa-teste" not in (pg.locator(".tl-map-warn").inner_text() if pg.locator(".tl-map-warn").count() else ""))
    # prompt sem mídia: detalhe oferece escolher arquivo
    pg.goto(URL+"/#/galeria?c=prontas"); pg.wait_for_selector(".gl-card")
    pg.get_by_role("button",name="Novo prompt").click(); pg.fill("#np-title","Sem midia"); pg.fill("#np-prompt","abc"); pg.get_by_role("button",name="Salvar prompt").click(); pg.wait_for_timeout(500)
    c2=pg.locator(".gl-card").filter(has_text="Sem midia"); c2.locator(".gl-open").click(); pg.wait_for_selector(".gd")
    check("sem mídia: botão 'Escolher imagem ou vídeo' no detalhe", pg.get_by_role("button",name="Escolher imagem ou vídeo").count()>=1)
    pg.locator(".gd-nomedia input[type=file]").set_input_files("/tmp/t.jpg"); pg.wait_for_timeout(3500)
    check("imagem enviada pelo detalhe foi para library/sem-midia.jpg", os.path.exists(ROOT+"/library/sem-midia.jpg"))
    check("sem erros de página", not errs)
    b.close()
for f in glob.glob(ROOT+"/library/mesa-teste.*")+glob.glob(ROOT+"/library/sem-midia.*"): os.remove(f)
print("ALL OK" if not fails else "FALHOU: %s"%fails); sys.exit(1 if fails else 0)
