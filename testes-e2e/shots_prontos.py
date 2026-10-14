import os, re
from playwright.sync_api import sync_playwright
URL=os.environ["APP_URL"]; OUT="/mnt/user-data/outputs/prints"; os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":2500,"height":1260}).new_page()
    pg.goto(URL); pg.evaluate("localStorage.setItem('ppv:skipped','true')")
    gf=lambda t: pg.locator(".gl-f", has_text=re.compile(r"^"+re.escape(t)+r"\s*\d+$")).first
    pg.goto(URL+"#/"); pg.reload(); pg.wait_for_selector(".tcard"); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/36-painel-sem-os-3-prompts-prontos.png"); print("ok 36")
    pg.goto(URL+"#/galeria"); pg.reload(); pg.wait_for_selector(".gl-card"); gf("Todos os prompts prontos").click(); pg.wait_for_timeout(500)
    pg.screenshot(path=f"{OUT}/37-galeria-secao-prompts-prontos.png"); print("ok 37")
    gf("Prompts dos Vídeos do TikTok").click(); pg.wait_for_timeout(500)
    pg.screenshot(path=f"{OUT}/38-galeria-videos-do-tiktok-com-guia.png"); print("ok 38")
    gf("Prompts Prontas").click(); gf("Ganchos Especiais").click(); pg.wait_for_timeout(500)
    pg.screenshot(path=f"{OUT}/39-galeria-prompts-prontas-pastas.png"); print("ok 39")
    pg.locator(".gl-card .gl-open").first.click(); pg.wait_for_selector("dialog[open] .gd"); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/40-detalhe-prompt-pronto-lapis-adaptar-observacoes.png"); print("ok 40")
    pg.keyboard.press("Escape"); gf("Prompts dos Vídeos do TikTok").click(); pg.wait_for_timeout(300)
    pg.locator(".gl-card").nth(2).locator(".gl-open").click(); pg.wait_for_selector("dialog[open] .gd"); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/41-detalhe-video-montar-prompt-e-gerar-com-ia.png"); print("ok 41")
    b.close()
print("SHOTS OK")
