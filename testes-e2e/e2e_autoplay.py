"""Vídeo COM áudio tem que tocar sozinho no card e na janela de detalhes, mesmo com a política de autoplay do Chrome ligada."""
import os, sys, glob
from playwright.sync_api import sync_playwright
URL=os.environ.get("APP_URL","http://localhost:5413"); ROOT="/home/claude/ppv/public/media"
fails=[]
def check(n,c):
    print(("PASS " if c else "FAIL ")+n)
    if not c: fails.append(n)
playing="(()=>{const v=document.querySelector(%s);return !!v && !v.paused && v.currentTime>0.2})()"
with sync_playwright() as p:
    b=p.chromium.launch(args=["--autoplay-policy=document-user-activation-required"]); pg=b.new_page(viewport={"width":1500,"height":900}); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL+"/"); t=pg.get_by_text("Explorar a biblioteca de prompts sem conectar")
    if t.count(): t.click()
    pg.goto(URL+"/#/galeria?c=prontas"); pg.wait_for_selector(".gl-card")
    pg.get_by_role("button",name="Novo prompt").click(); pg.fill("#np-title","Audio teste"); pg.fill("#np-prompt","abc"); pg.set_input_files("#np-media","/tmp/ta.webm"); pg.get_by_role("button",name="Salvar prompt").click(); pg.wait_for_timeout(3500)
    pg.goto(URL+"/"); t=pg.get_by_text("Explorar a biblioteca de prompts sem conectar")
    if t.count(): t.click()
    pg.goto(URL+"/#/galeria?c=prontas"); pg.wait_for_selector(".gl-card"); pg.wait_for_timeout(2500)
    S='".gl-card[data-id*=\'audio-teste\'] video"'
    check("card: vídeo com áudio toca sozinho, sem mouse e sem clique", pg.evaluate(playing%S))
    pg.locator(".gl-card").filter(has_text="Audio teste").locator(".gl-open").click(); pg.wait_for_selector("dialog[open] .gd-media video"); pg.wait_for_timeout(2000)
    check("detalhe: vídeo com áudio toca sozinho (sem clicar em play)", pg.evaluate(playing%'"dialog[open] .gd-media video"'))
    check("detalhe: vídeo está mudo ao começar", pg.evaluate("document.querySelector('dialog[open] .gd-media video').muted"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    # sistema com "reduzir movimento" ligado: o app ainda toca (a preferência é do app)
    b2=b.new_context(storage_state=pg.context.storage_state(), reduced_motion="reduce", viewport={"width":1500,"height":900}); q=b2.new_page()
    q.goto(URL+"/"); t=q.get_by_text("Explorar a biblioteca de prompts sem conectar")
    if t.count(): t.click()
    q.goto(URL+"/#/galeria?c=prontas"); q.wait_for_selector(".gl-card"); q.wait_for_timeout(2500)
    check("com 'reduzir movimento' no sistema, o card ainda toca (preferência é do app)", q.evaluate(playing%S))
    b2.close()
    # botão da Galeria desliga e liga o movimento
    btn=pg.get_by_role("button",name="Movimento: ligado"); check("botão 'Movimento: ligado' existe", btn.count()==1)
    btn.click(); pg.wait_for_timeout(600)
    check("desligando, o vídeo do card para", pg.evaluate("document.querySelector(%s).paused"%S))
    pg.get_by_role("button",name="Movimento: desligado").click(); pg.wait_for_timeout(1200)
    check("ligando de novo, volta a tocar", pg.evaluate(playing%S))
    check("sem erros de página", not errs)
    b.close()
for f in glob.glob(ROOT+"/library/audio-teste.*"): os.remove(f)
print("ALL OK" if not fails else "FALHOU: %s"%fails); sys.exit(1 if fails else 0)
