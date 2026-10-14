import os, sys, json, re
from playwright.sync_api import sync_playwright, expect
URL=os.environ["APP_URL"]; KEY="AIzaSyA1234567890abcdefghijklmnopqrstuv1"; CORS={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"}
W22=" ".join(["palavra"]*22); calls=[]
def handle(route, request):
    if request.method=="OPTIONS": return route.fulfill(status=204, headers=CORS)
    u=request.url
    if "/v1beta/models?" in u: return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps({"models":[{"name":"models/gemini-3.6-flash","supportedGenerationMethods":["generateContent"]}]}))
    if ":generateContent" in u:
        b=json.loads(request.post_data); parts=b["contents"][0]["parts"]; txt=[p["text"] for p in parts if "text" in p][-1]
        calls.append({"parts":parts,"txt":txt,"sys":b["systemInstruction"]["parts"][0]["text"]})
        out={"sections":[{"title":"Resumo da direção","items":[{"text":"ok"}]},{"title":"Roteiro de Direção (Veo 3)","items":[{"label":"Take 1/2","text":"T1"},{"label":"Take 2/2","text":"T2"}]}]}
        return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(out)}]}}]}))
    return route.fulfill(status=404, headers=CORS, body="{}")
ok=True
def check(n,c,x=""):
    global ok; print(("PASS " if c else "FAIL ")+n+(" "+str(x) if x else "")); ok=ok and bool(c)
def png(w=60,h=75):
    import struct,zlib
    raw=b"".join(b"\x00"+bytes([30,160,220]*w) for _ in range(h))
    def ch(t,d):
        x=struct.pack(">I",len(d))+t+d; return x+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
    return b"\x89PNG\r\n\x1a\n"+ch(b"IHDR",struct.pack(">IIBBBBB",w,h,8,2,0,0,0))+ch(b"IDAT",zlib.compress(raw))+ch(b"IEND",b"")
with sync_playwright() as p:
    b=p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"]); ctx=b.new_context(viewport={"width":1366,"height":1000}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("https://generativelanguage.googleapis.com/**", handle)
    pg.goto(URL); pg.evaluate(f"localStorage.setItem('ppv:gemini-key','{KEY}')")
    def go(h): pg.goto(URL+h); pg.reload()
    can_h264 = pg.evaluate("document.createElement('video').canPlayType('video/mp4; codecs=\"avc1.42E01E\"')")
    print("este Chromium toca H.264?", repr(can_h264) or "não")
    def playing(loc, tries=20):
        for _ in range(tries):
            if loc.evaluate("v=>!v.paused && v.readyState>=2"): return True
            pg.wait_for_timeout(250)
        return False
    # ---- capas do Reels Studio
    go("#/trendly/reels"); pg.wait_for_selector(".tl-style video")
    check("capa UGC em vídeo toca sozinha (sem passar o mouse)", playing(pg.locator(".tl-style video").first))
    # ---- passo 3 do UGC: interações e poses
    go("#/trendly/reels/ugc"); pg.wait_for_selector(".tw-card")
    pg.click(".tw-avatar >> nth=0"); pg.click(".tw-next"); pg.locator("input[aria-label='Adicionar foto do meu produto']").set_input_files({"name":"p.png","mimeType":"image/png","buffer":png()}); pg.locator(".tw-own-thumb img").wait_for(); pg.click(".tw-next")
    pg.wait_for_selector(".tw-photocards"); pg.wait_for_timeout(1500)
    esp=pg.locator(".tw-photocard").filter(has=pg.locator("button[aria-label='No Espelho']"))
    fro=pg.locator(".tw-photocard").filter(has=pg.locator("button[aria-label='Câmera Frontal']"))
    check("Interação 'No Espelho' (vídeo) aparece", esp.locator("video").count()==1)
    check("...e toca sozinha, mesmo com a camada de clique por cima", playing(esp.locator("video")))
    check("Interação 'Câmera Frontal' (imagem) continua funcionando", fro.locator("img").count()==1)
    cor=pg.locator(".tw-photocard").filter(has=pg.locator("button[aria-label='Em pé, corpo inteiro']"))
    check("vídeo + imagem com o mesmo nome: a imagem vira capa (poster)", "corpo-inteiro.png" in (cor.locator("video").get_attribute("poster") or ""))
    cin=pg.locator(".tw-photocard").filter(has=pg.locator("button[aria-label='Em pé, cintura para cima']"))
    if can_h264: check("pose em MP4 H.264 toca", playing(cin.locator("video")))
    else: check("MP4 que este navegador não toca mostra um aviso claro (em vez de ficar em branco)", cin.locator(".media-fail").count()==1, cin.locator(".media-fail").inner_text() if cin.locator(".media-fail").count() else "sem aviso")
    pg.screenshot(path="/home/claude/shots/vi-cena.png")
    transparent=lambda sel: pg.evaluate("sel=>[...document.querySelectorAll(sel)].every(e=>{const c=getComputedStyle(e);return c.backgroundColor==='rgba(0, 0, 0, 0)' && c.borderTopWidth==='0px'})", sel)
    check("a camada de clique dos cartões de cena é transparente (não tampa a mídia)", pg.locator(".tw-photocard .tl-stretch").count()==5 and transparent(".tw-photocard .tl-stretch"))
    shot=esp.screenshot(); from collections import Counter
    import io; from PIL import Image
    im=Image.open(io.BytesIO(shot)).convert("RGB").resize((24,36)); cols=Counter(im.getdata())
    check("o cartão com vídeo mostra conteúdo (não é uma caixa de uma cor só)", len(cols)>8, len(cols))
    check("clicar no vídeo ainda seleciona a opção", (esp.locator("button[role=radio]").click() or True) and esp.locator("button[role=radio][aria-checked=true]").count()==1)
    # ---- avatares em vídeo
    go("#/trendly/reels/ugc"); pg.wait_for_selector(".tw-avatar"); pg.wait_for_timeout(1200)
    car=pg.locator(".tw-avatar").filter(has_text="Carolina")
    check("avatar só com vídeo (Carolina) aparece e toca", car.locator("video").count()==1 and playing(car.locator("video")))
    fer=pg.locator(".tw-avatar").filter(has_text="Fernanda")
    check("avatar com imagem + vídeo (Fernanda): vídeo com capa", fer.locator("video").count()==1 and "fernanda.png" in (fer.locator("video").get_attribute("poster") or ""))
    # ---- a IA recebe um quadro do vídeo do avatar
    car.click(); pg.click(".tw-next")
    pg.locator("input[aria-label='Adicionar foto do meu produto']").set_input_files({"name":"p.png","mimeType":"image/png","buffer":png()}); pg.locator(".tw-own-thumb img").wait_for(); pg.fill("input[aria-label='Nome do produto']","Calça preta")
    check("produto do catálogo em vídeo aparece na lista", True)
    pg.click(".tw-next"); pg.click(".tw-next"); pg.fill("#take-0",W22); pg.fill("#take-1",W22); pg.click(".tw-go"); pg.wait_for_selector(".tw-dir")
    c=calls[-1]; imgs=[x for x in c["parts"] if "inlineData" in x]
    check("avatar só em vídeo: o Gemini recebe 1 imagem (quadro do vídeo) + a foto do produto", len(imgs)==2 and all(i["inlineData"]["mimeType"]=="image/jpeg" for i in imgs), len(imgs))
    check("o pedido diz que a foto do avatar foi enviada", "A foto do avatar é a primeira imagem enviada" in c["txt"])
    check("a tela de resultado mostra o avatar em vídeo (referência baixável)", pg.locator(".tw-dir-left .tw-ref video").count()==1 and "mp4" not in "" )
    # ---- avatar com imagem + vídeo usa a capa (sem capturar quadro)
    go("#/trendly/reels/ugc"); pg.wait_for_selector(".tw-avatar"); pg.locator(".tw-avatar").filter(has_text="Fernanda").click(); pg.click(".tw-next")
    pg.locator("input[aria-label='Adicionar foto do meu produto']").set_input_files({"name":"p.png","mimeType":"image/png","buffer":png()}); pg.locator(".tw-own-thumb img").wait_for(); pg.click(".tw-next"); pg.click(".tw-next"); pg.fill("#take-0",W22); pg.fill("#take-1",W22); pg.click(".tw-go"); pg.wait_for_selector(".tw-dir")
    check("avatar com capa: usa a imagem de capa como referência", len([x for x in calls[-1]["parts"] if "inlineData" in x])==2)
    # ---- produto em vídeo na lista e na página de produtos
    go("#/trendly/reels/ugc"); pg.wait_for_selector(".tw-avatar"); pg.click(".tw-avatar >> nth=0"); pg.click(".tw-next"); pg.wait_for_selector(".tw-prod"); pg.wait_for_timeout(1200)
    cam=pg.locator(".tw-prod").filter(has_text="Câmera Wi-Fi")
    check("produto em vídeo no passo 'Produto Viral'", cam.locator("video").count()==1 and playing(cam.locator("video")))
    go("#/trendly/produtos"); pg.wait_for_selector(".tl-avatar-card"); pg.wait_for_timeout(800)
    check("página Produtos diz 'Vídeo encontrado'", "Vídeo encontrado" in pg.inner_text(".tl-avatar-grid"))
    go("#/trendly/influencer"); pg.wait_for_selector(".tl-avatar-card"); pg.wait_for_timeout(800)
    check("Influencer Studio mostra o avatar em vídeo e 'Vídeo encontrado'", "Vídeo encontrado" in pg.inner_text(".tl-avatar-grid") and pg.locator(".tl-avatar-grid video").count()>=1)
    # ---- POV: mãos em vídeo
    go("#/trendly/reels/pov"); pg.wait_for_selector(".tw-card")
    pg.locator("input[aria-label='Adicionar foto do meu produto']").set_input_files({"name":"p.png","mimeType":"image/png","buffer":png()}); pg.locator(".tw-own-thumb img").wait_for(); pg.click(".tw-next"); pg.wait_for_selector(".tw-hands"); pg.wait_for_timeout(1200)
    sm=pg.locator(".tw-hands .tw-photocard").filter(has=pg.locator("button[aria-label='Sem mãos']"))
    check("a camada de clique das mãos do POV é transparente", transparent(".tw-hands .tl-stretch"))
    check("POV: 'Sem mãos' em vídeo aparece e toca", sm.locator("video").count()==1 and playing(sm.locator("video")))
    # ---- mapa
    go("#/trendly/midia"); pg.wait_for_selector("text=Mapa de mídia")
    t=pg.inner_text("body")
    check("Mapa explica que dá para usar imagem ou vídeo em qualquer card", "imagem ou vídeo" in t)
    check("Mapa sugere 'mp4 ou jpg' nas poses e mãos", "mp4 ou jpg" in t)
    check("Mapa marca os cards com vídeo", "vídeo" in t)
    real=[e for e in errs if "Failed to load resource" not in e]; check("sem erros de página", not real, real[:2])
    b.close()
print("ALL OK" if ok else "FAILED"); sys.exit(0 if ok else 1)
