import os, sys, glob
from playwright.sync_api import sync_playwright
URL=os.environ.get("APP_URL","http://localhost:5411")
ROOT="/home/claude/ppv/public/media"
fails=[]
def check(n,c):
    print(("PASS " if c else "FAIL ")+n); 
    if not c: fails.append(n)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1600,"height":1000}); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL+"/"); pg.get_by_text("Explorar a biblioteca de prompts sem conectar").click(); pg.wait_for_timeout(500)
    pg.goto(URL+"/#/trendly/midia"); pg.wait_for_selector(".tl-map-row")
    check("cada linha tem lápis", pg.locator(".tl-map-row").count()==pg.locator(".tl-map-edit").count()>20)
    check("aviso diz que grava direto (dev)", "npm run dev" in pg.locator(".tl-note").first.inner_text() and "grava" in pg.locator(".tl-note").first.inner_text().lower() or "gravado" in pg.locator(".tl-note").first.inner_text())
    row=pg.locator(".tl-map-row").filter(has_text="Pose: Sentado(a)")
    check("começa sem arquivo", "ok" not in (row.get_attribute("class") or "").split())
    row.locator("input[type=file]").set_input_files("/tmp/t.webm")
    pg.wait_for_timeout(3000)
    pg.get_by_text("Explorar a biblioteca de prompts sem conectar").count() and pg.get_by_text("Explorar a biblioteca de prompts sem conectar").click()
    pg.goto(URL+"/#/trendly/midia"); pg.wait_for_selector(".tl-map-row")
    check("arquivo foi para public/media/poses/sentado.webm", os.path.exists(ROOT+"/poses/sentado.webm"))
    row=pg.locator(".tl-map-row").filter(has_text="Pose: Sentado(a)")
    check("após recarregar, a linha fica verde com selo vídeo", "ok" in (row.get_attribute("class") or "").split() and "vídeo" in row.inner_text())
    # trocar por imagem não apaga o vídeo (vira capa)
    row.locator("input[type=file]").set_input_files("/tmp/t.jpg"); pg.wait_for_timeout(3000); pg.goto(URL+"/#/trendly/midia"); pg.wait_for_selector(".tl-map-row")
    check("imagem vira capa e o vídeo continua", os.path.exists(ROOT+"/poses/sentado.jpg") and os.path.exists(ROOT+"/poses/sentado.webm"))
    row=pg.locator(".tl-map-row").filter(has_text="Pose: Sentado(a)")
    check("selo mostra vídeo + capa", "vídeo + capa" in row.inner_text())
    # formato inválido
    open("/tmp/x.pdf","wb").write(b"%PDF")
    row.locator("input[type=file]").set_input_files("/tmp/x.pdf"); pg.wait_for_timeout(500)
    check("PDF é recusado com aviso", "não é suportado" in pg.locator("body").inner_text() and not os.path.exists(ROOT+"/poses/x.pdf"))
    # servidor recusa pedido sem cabeçalho e caminho fora
    r=pg.request.post(URL+"/__media/upload?category=poses&name=a&ext=.jpg",data=b"x"); check("sem cabeçalho: 403", r.status==403)
    r=pg.request.post(URL+"/__media/upload?category=..&name=a&ext=.jpg",data=b"x",headers={"x-media-upload":"1"}); check("categoria '..': 400", r.status==400)
    check("sem erros de página", not errs)
    b.close()
for f in glob.glob(ROOT+"/poses/sentado.*"): os.remove(f)
try: os.rmdir(ROOT+"/poses")
except OSError: pass
print("ALL OK" if not fails else "FALHOU: %s"%fails); sys.exit(1 if fails else 0)
