import os, sys, shutil
from playwright.sync_api import sync_playwright, expect
URL=os.environ["APP_URL"]; MEDIA=os.environ["MEDIA_DIR"]; KEY="AIzaSyA1234567890abcdefghijklmnopqrstuv1"
CORS={"access-control-allow-origin":"*"}
ok=True
def check(n,c,x=""):
    global ok; print(("PASS " if c else "FAIL ")+n+(" "+str(x) if x else "")); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1366,"height":900}, permissions=["clipboard-read","clipboard-write"]); pg=ctx.new_page()
    logs=[]; pg.on("pageerror", lambda e: logs.append("pageerror: "+str(e)))
    pg.on("console", lambda m: logs.append(f"{m.type}: {m.text[:200]}") if m.type in ("error","warning") and "Failed to load resource" not in m.text else None)
    pg.route("https://generativelanguage.googleapis.com/**", lambda r: r.fulfill(status=200, headers=CORS, content_type="application/json", body='{"models":[{"name":"models/gemini-3.6-flash","supportedGenerationMethods":["generateContent"]}]}'))
    pg.goto(URL); pg.evaluate(f"localStorage.setItem('ppv:gemini-key','{KEY}')")
    def go(h): pg.goto(URL+h); pg.reload()

    # Reels Studio: capas
    go("#/trendly/reels"); pg.wait_for_selector(".tl-style")
    check("capa UGC (imagem) vem da pasta", pg.locator(".tl-style").nth(0).locator("img").count()==1)
    check("capa POV (vídeo) vem da pasta", pg.locator(".tl-style").nth(1).locator("video").count()==1)
    check("capa Provador sem arquivo usa a arte padrão", pg.locator(".tl-style").nth(2).locator("img, video").count()==0 and pg.locator(".tl-style").nth(2).locator(".tl-cover-art").count()==1)
    src=pg.locator(".tl-style").nth(0).locator("img").get_attribute("src")
    check("URL relativa à pasta media e com ?v=hash", "media/styles/ugc.png?v=" in src, src)
    check("sem botão de upload em nenhuma capa", pg.locator("input[type=file]").count()==0 and pg.locator("[aria-label*='Subir']").count()==0)

    # Galeria
    go("#/galeria"); pg.wait_for_selector(".gl-card")
    check("galeria: um único envio (Subir vídeo ou imagem), sem 'Remover mídia'", pg.locator("input[type=file]").count()==1 and pg.get_by_role("button",name="Subir vídeo ou imagem").count()==1 and pg.locator("[aria-label*='Remover mídia']").count()==0)
    pg.fill("input[aria-label='Buscar prompt']","pacote"); pg.wait_for_timeout(300)
    vids=pg.locator(".gl-card video")
    check("'Pacote-Vid.MP4' (maiúsculas) liga ao card pacote-vid", vids.count()==1)
    expect(vids.first).to_have_attribute("src", __import__("re").compile(r"Pacote-Vid\.MP4\?v="), timeout=5000); check("vídeo recebe o src ao entrar na tela (carregamento sob demanda)", True)
    pg.fill("input[aria-label='Buscar prompt']","giro lento 360"); pg.wait_for_timeout(300)
    check("vídeo + imagem com o mesmo nome: a imagem vira capa (poster)", "giro-360.png" in (pg.locator(".gl-card video").first.get_attribute("poster") or "") )
    pg.fill("input[aria-label='Buscar prompt']","espelho provador"); pg.wait_for_timeout(300)
    check("imagem simples no card de imagem", pg.locator(".gl-card img").count()>=1)
    pg.fill("input[aria-label='Buscar prompt']","tapar"); pg.wait_for_timeout(300)
    check("card sem arquivo mostra a arte padrão", pg.locator(".gl-card img, .gl-card video").count()==0)
    # observador de arquivos (dev): novo arquivo aparece sem reiniciar
    if os.environ.get("WATCH")=="1":
        shutil.copy(os.path.join(MEDIA,"styles","ugc.png"), os.path.join(MEDIA,"gallery","tapar-camera.png"))
        try:
            pg.wait_for_selector(".gl-card img", timeout=20000); got=True
        except Exception: got=False
        check("arquivo novo aparece sozinho (servidor de dev recarrega)", got)
        os.remove(os.path.join(MEDIA,"gallery","tapar-camera.png"))

    # Prompts prontos (dentro da Galeria; as prévias continuam em public/media/library)
    go("#/galeria?c=videos"); pg.wait_for_selector(".gl-card")
    check("prontas: sem botão antigo 'Subir imagem' (o envio é pelo detalhe e pelo Novo prompt)", pg.locator("button:has-text('Subir imagem')").count()==0)
    check("'Roupas Infantis': vídeo achado pelo título (roupas-infantis.mp4)", pg.locator(".gl-card:has-text('Roupas Infantis') video").count()==1)
    check("'Eletrodomésticos': imagem achada pelo id (video-0.png)", pg.locator(".gl-card:has-text('Eletrodomésticos') img").count()==1)
    pg.click(".gl-pill:has-text('Com mídia')"); pg.wait_for_timeout(300)
    check("pílula 'Com mídia' = 2 cards nesta coleção", pg.locator(".gl-card").count()==2, pg.locator(".gl-card").count())

    # Avatares e produtos no assistente
    go("#/trendly/reels/ugc"); pg.wait_for_selector(".tw-avatar")
    check("avatar-base Carolina tem foto; os outros mostram a inicial", pg.locator(".tw-avatar:has-text('Carolina') img").count()==1 and pg.locator(".tw-avatar:has-text('Ana') img").count()==0)
    pg.click(".tw-tabs button:has-text('Meus Avatares')")
    check("Meus Avatares lista Bia e João Pedro (fotos f-/m-)", pg.locator(".tw-avatar:has-text('Bia') img").count()==1 and pg.locator(".tw-avatar:has-text('Joao Pedro') img").count()==1)
    pg.click(".tw-avatar:has-text('Bia')"); pg.click(".tw-next")
    check("produto da lista com foto na pasta mostra a imagem", pg.locator(".tw-prod:has-text('Calça feminina') img").count()==1 and pg.locator(".tw-prod:has-text('Câmera Wi-Fi') img").count()==0)

    # Mapa de mídia
    go("#/trendly/midia"); pg.wait_for_selector(".tl-map-summary")
    txt=pg.inner_text(".tl-map-summary")
    import re
    m=re.search(r"(\d+) de (\d+) cards",txt); got,total=int(m.group(1)),int(m.group(2))
    check("resumo conta só os cards com arquivo (13)", got==13, txt.split("\n")[0])
    check("total de cards do mapa > 150", total>150, total)
    warn=pg.inner_text(".tl-map-warn")
    check("avisa do arquivo sem card (typo, em uma pasta que não cria card sozinha)", "avatars/carolinaa" in warn)
    check("e NÃO avisa de arquivo novo da galeria (ela vira card sozinha)", "gallery/" not in warn.replace("gallery/x.mov",""))
    check("avisa do .mov", ".mov" in warn)
    check("giro-360 aparece como encontrado (vídeo + capa)", pg.locator(".tl-map-row.ok:has-text('Giro lento 360') .tl-map-kind:has-text('vídeo + capa')").count()==1)
    check("linha mostra o caminho e os nomes aceitos", "public/media/library/roupas-infantis" in pg.inner_text("body") and "também aceita: video-1" in pg.inner_text("body"))
    pg.locator(".tl-map-row:has-text('Giro lento 360') >> button:has-text('Copiar nome')").first.click(); pg.wait_for_selector(".toast-ok")
    check("'Copiar nome' copia o nome do arquivo", pg.evaluate("navigator.clipboard.readText()")=="giro-360")
    n_all=pg.locator(".tl-map-row").count(); pg.click("text=Mostrar só o que falta"); pg.wait_for_timeout(300)
    check("filtro 'só o que falta' esconde os encontrados", pg.locator(".tl-map-row.ok").count()==0 and pg.locator(".tl-map-row").count()>100)
    check("link 'Mídia' no topo da aba", pg.locator("a.tl-brand").count()==1)

    # Auditoria de console em TODAS as rotas (modo dev mostra avisos do React)
    for h in ["#/","#/trendly/reels","#/trendly/reels/ugc","#/trendly/reels/pov","#/trendly/reels/provador","#/galeria","#/trendly/influencer","#/trendly/produtos","#/trendly/midia","#/trendly/hacks","#/trendly/hacks/frutas","#/trendly/agente","#/biblioteca/videos","#/biblioteca/prontas","#/biblioteca/movimentos","#/ferramenta/pov","#/ferramenta/analise-video","#/configuracoes","#/em-breve/radar","#/rota-que-nao-existe"]:
        go(h); pg.wait_for_timeout(500)
    check("nenhum erro ou aviso no console em 20 telas", not logs, logs[:4])
    b.close()
print("ALL OK" if ok else "FAILED"); sys.exit(0 if ok else 1)
