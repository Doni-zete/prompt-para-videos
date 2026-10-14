import os
from PIL import Image
from playwright.sync_api import sync_playwright
URL=os.environ["APP_URL"]; OUT="/mnt/user-data/outputs/prints"; os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"]); pg=b.new_context(viewport={"width":1366,"height":1100}).new_page()
    pg.goto(URL); pg.evaluate("localStorage.setItem('ppv:skipped','true')"); pg.goto(URL+"#/humano"); pg.reload(); pg.wait_for_selector(".hm-layer img")
    pg.locator(".hm-preset", has_text="Vlog caseiro").click(); pg.locator(".hm-preset", has_text="Captura casual no bar").click()
    pg.locator(".hm-cmd", has_text="Micro movimentos faciais").click(); pg.locator(".hm-cmd", has_text="Textura de pele real").click(); pg.locator(".hm-cmd", has_text="Assimetria natural").click()
    pg.click(".hm-tabs button:has-text('Dispositivo')"); pg.locator(".hm-cmd", has_text="Câmera de celular").click()
    pg.wait_for_timeout(1200); pg.screenshot(path=f"{OUT}/09-humanizar-ia-video.png",clip={"x":250,"y":0,"width":1100,"height":1000}); print("ok 09")
    pg.click(".hm-modes [role=radio]:has-text('Imagem')"); pg.locator(".hm-preset", has_text="Selfie no espelho").click(); pg.click(".hm-tabs button:has-text('Rosto e pele')"); pg.locator(".hm-cmd", has_text="Textura de pele real").click(); pg.locator(".hm-cmd", has_text="Assimetria natural").click()
    pg.click(".hm-tabs button:has-text('Iluminação')"); pg.locator(".hm-cmd", has_text="Luz natural de janela").click()
    pg.wait_for_timeout(800); pg.screenshot(path=f"{OUT}/10-humanizar-ia-imagem.png",clip={"x":250,"y":0,"width":1100,"height":1000}); print("ok 10")
    box=pg.locator(".hm-compare"); h=pg.locator(".hm-handle"); parts=[]
    for i,key_presses in enumerate([("Home",5),("Home",12),("End",-5)]):
        h.focus(); pg.keyboard.press("Home" if i<2 else "End")
        for _ in range(key_presses[1] if key_presses[1]>0 else 0): pg.keyboard.press("ArrowRight")
        for _ in range(-key_presses[1] if key_presses[1]<0 else 0): pg.keyboard.press("ArrowLeft")
        pg.wait_for_timeout(300); path=f"/tmp/cmp{i}.png"; box.screenshot(path=path); parts.append((Image.open(path).convert("RGB"),h.get_attribute("aria-valuenow")))
    w=parts[0][0].width; hh=parts[0][0].height; S=Image.new("RGB",(w*3+40,hh),(22,21,29))
    for i,(im,v) in enumerate(parts): S.paste(im,(i*(w+20),0))
    S.save(f"{OUT}/11-efeito-comparacao-3-posicoes.png"); print("ok 11", [v for _,v in parts])
    b.close()
print("SHOTS OK")
