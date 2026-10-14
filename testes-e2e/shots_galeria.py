import os
from playwright.sync_api import sync_playwright
URL=os.environ["APP_URL"]; OUT="/mnt/user-data/outputs/prints"; os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"]); pg=b.new_context(viewport={"width":2500,"height":1260}).new_page()
    pg.goto(URL); pg.evaluate("localStorage.setItem('ppv:skipped','true')"); pg.goto(URL+"#/galeria"); pg.reload(); pg.wait_for_selector(".gl-card")
    pg.locator(".gl-card[data-id='movimento-natural'] .gl-btn[aria-label^='Favoritar']").click(); pg.locator(".gl-card[data-id='cta-carrinho'] .gl-btn[aria-label^='Favoritar']").click()
    pg.wait_for_timeout(1200)
    pg.locator(".gl-card[data-id='giro-360']").hover(); pg.wait_for_timeout(700)
    pg.screenshot(path=f"{OUT}/32-galeria-de-prompts-grade-e-filtros.png"); print("ok 32")
    pg.locator(".gl-card[data-id='giro-360'] .gl-open").click(); pg.wait_for_selector("dialog[open] .gd"); pg.wait_for_timeout(600)
    pg.screenshot(path=f"{OUT}/33-galeria-detalhes-com-lapis-ao-lado-do-copiar.png"); print("ok 33")
    pg.click("dialog[open] .gd-pencil >> nth=0"); pg.wait_for_selector("dialog[open] #gd-prompt"); pg.wait_for_timeout(300)
    pg.screenshot(path=f"{OUT}/34-galeria-editando-o-prompt.png"); print("ok 34")
    pg.keyboard.press("Escape"); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    pg.locator(".gl-f", has_text="Novos na minha mídia").click(); pg.wait_for_timeout(900)
    pg.screenshot(path=f"{OUT}/35-galeria-videos-novos-da-pasta-de-midia.png"); print("ok 35")
    b.close()
print("SHOTS OK")
