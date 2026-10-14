"""Site publicado (sem npm run dev): o lápis baixa o arquivo com o nome certo, sem erro de seletor de pasta. Roda com `npm run build && npx vite preview --port PORTA`."""
import os, sys
from playwright.sync_api import sync_playwright
URL=os.environ.get("APP_URL","http://localhost:5417")
fails=[]
def check(n,c):
    print(("PASS " if c else "FAIL ")+n)
    if not c: fails.append(n)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1500,"height":900},accept_downloads=True); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL+"/"); t=pg.get_by_text("Explorar a biblioteca de prompts sem conectar")
    if t.count(): t.click()
    pg.goto(URL+"/#/trendly/midia"); pg.wait_for_selector(".tl-map-row", state="attached")
    check("aviso explica que o site publicado não grava no projeto", "site publicado" in pg.locator(".tl-note").first.inner_text())
    row=pg.locator(".tl-map-row").filter(has_text="Pose: Sentado(a)")
    with pg.expect_download() as d:
        row.locator("input[type=file]").set_input_files("/tmp/t.webm")
    check("baixa o arquivo com o nome certo (sentado.webm)", d.value.suggested_filename=="sentado.webm")
    pg.wait_for_timeout(500)
    body=pg.locator("body").inner_text()
    check("mostra o aviso de onde colocar e fazer o commit", "public/media/poses/" in body and "commit" in body)
    check("sem o erro do seletor de pasta", "showDirectoryPicker" not in body and "user gesture" not in body)
    check("sem erros de página", not errs)
    b.close()
print("ALL OK" if not fails else "FALHOU: %s"%fails); sys.exit(1 if fails else 0)
