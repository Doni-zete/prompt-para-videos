"""Salvar no projeto: prompts criados valem em outro navegador (como o site publicado). Roda com `npx vite --port PORTA` aberto."""
import os, sys, json, time
from playwright.sync_api import sync_playwright
URL=os.environ.get("APP_URL","http://localhost:5414"); FILE="/home/claude/ppv/src/data/userData.json"
EMPTY='{\n  "version": 1,\n  "savedAt": "",\n  "data": {}\n}\n'
fails=[]
def check(n,c):
    print(("PASS " if c else "FAIL ")+n)
    if not c: fails.append(n)
def enter(pg,hash_):
    pg.goto(URL+"/"); t=pg.get_by_text("Explorar a biblioteca de prompts sem conectar")
    if t.count(): t.click()
    pg.goto(URL+hash_)
open(FILE,"w").write(EMPTY); time.sleep(1)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(); a=b.new_context(viewport={"width":1500,"height":900}); pg=a.new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    enter(pg,"/#/galeria?c=prontas"); pg.wait_for_selector(".gl-card")
    check("começa sem aviso (nada alterado)", pg.get_by_role("button",name="Salvar no projeto").count()==0)
    pg.get_by_role("button",name="Novo prompt").click(); pg.fill("#np-title","Prompt do projeto"); pg.fill("#np-prompt","texto salvo no projeto"); pg.get_by_role("button",name="Salvar prompt").click(); pg.wait_for_timeout(600)
    pg.evaluate("localStorage.setItem('ppv:key','SEGREDO-NAO-SUBIR'); localStorage.setItem('ppv:history:pov','[1]')")
    check("criar prompt mostra 'Salvar no projeto'", pg.get_by_role("button",name="Salvar no projeto").count()==1)
    pg.get_by_role("button",name="Salvar no projeto").click(); pg.wait_for_timeout(2500)
    d=json.load(open(FILE)); raw=open(FILE).read()
    check("userData.json recebeu o prompt", any(i.get("title")=="Prompt do projeto" for i in d["data"].get("custom:prontas",[])) and d["savedAt"]!="")
    check("chave do Gemini e histórico NÃO foram para o arquivo", "SEGREDO" not in raw and "history:pov" not in raw)
    pg.wait_for_selector(".gl-card"); pg.wait_for_timeout(800)
    check("depois de salvar, o aviso some", pg.get_by_role("button",name="Salvar no projeto").count()==0)
    # outro navegador (como o site publicado): vê o prompt sem ter criado nada
    c=b.new_context(viewport={"width":1500,"height":900}); q=c.new_page()
    enter(q,"/#/galeria?c=prontas"); q.wait_for_selector(".gl-card"); q.wait_for_timeout(500)
    check("outro navegador já mostra o prompt salvo no projeto", q.locator(".gl-card").filter(has_text="Prompt do projeto").count()==1)
    check("e sem aviso de 'não salvo'", q.get_by_role("button",name="Salvar no projeto").count()==0)
    # conflito: alteração local + projeto mais novo
    q.evaluate("localStorage.setItem('ppv:sync:meta', JSON.stringify({syncedAt:'2020-01-01T00:00:00.000Z', dirty:true}))"); q.reload(); q.wait_for_selector(".gl-card"); q.wait_for_timeout(500)
    check("projeto mais novo + alterações locais: pergunta qual vale", q.get_by_text("O projeto tem uma versão mais nova").count()==1)
    q.get_by_role("button",name="Usar a do projeto").click(); q.wait_for_selector(".gl-card"); q.wait_for_timeout(800)
    check("'Usar a do projeto' resolve e o prompt continua lá", q.get_by_text("O projeto tem uma versão mais nova").count()==0 and q.locator(".gl-card").filter(has_text="Prompt do projeto").count()==1)
    check("sem erros de página", not errs)
    b.close()
finally:
    open(FILE,"w").write(EMPTY)
print("ALL OK" if not fails else "FALHOU: %s"%fails); sys.exit(1 if fails else 0)
