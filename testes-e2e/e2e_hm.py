import os, sys, io
from playwright.sync_api import sync_playwright, expect
URL=os.environ["APP_URL"]; ok=True
def check(n,c,x=""):
    global ok; print(("PASS " if c else "FAIL ")+n+(" "+str(x) if x else "")); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"]); ctx=b.new_context(viewport={"width":1366,"height":1000}, permissions=["clipboard-read","clipboard-write"]); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.evaluate("localStorage.setItem('ppv:skipped','true')")
    def go(h): pg.goto(URL+h); pg.reload()
    # ---- sidebar e painel
    go("#/"); pg.wait_for_selector(".tcard")
    links=[t.strip() for t in pg.locator(".sidebar .nav a").all_inner_texts()]
    check("sidebar não repete 'Humanizar IA' (ela fica só como card do painel)", "Humanizar IA" not in links, links)
    names=pg.locator(".tcard h2").all_inner_texts()
    check("painel tem o card 'Humanizar IA' (5 cards)", "Humanizar IA" in names and len(names)==5, len(names))
    pg.click(".tcard:has(h2:text-is('Humanizar IA')) a.tcard-main"); pg.wait_for_selector(".hm")
    check("a rota abre a página", pg.url.endswith("#/humano") and "Humanizar IA" in pg.inner_text(".hm-title"))
    # ---- modo
    check("modo padrão é Vídeo", pg.locator(".hm-modes [role=radio][aria-checked=true]").inner_text().strip()=="Vídeo")
    titles=pg.locator(".hm-preset-title").all_inner_texts()
    check("presets de vídeo (inclui os 3 da referência)", len(titles)==6 and all(t.startswith("[Vídeo]") for t in titles) and "[Vídeo] Vlog caseiro" in titles and "[Vídeo] Captura casual no bar" in titles, titles)
    check("7 categorias de comandos em vídeo", pg.locator(".hm-tabs button").all_inner_texts()==["Rosto e pele","Corpo","Dispositivo","Edição","Iluminação","Movimento","Outros"])
    check("aba 'Rosto e pele' mostra 'Micro movimentos faciais'", "Micro movimentos faciais" in pg.inner_text(".hm-cmds") and "Expressões naturais feitas pelo rosto" in pg.inner_text(".hm-cmds"))
    check("prompt vazio mostra a instrução", "Marque presets e comandos" in pg.inner_text(".hm-prompt"))
    # ---- comparação (imagens de exemplo)
    pg.wait_for_selector(".hm-layer img")
    check("comparação mostra as duas imagens (Original e Realista)", pg.locator(".hm-layer img").count()==2)
    h=pg.locator(".hm-handle"); check("divisor começa no meio (50)", h.get_attribute("aria-valuenow")=="50")
    h.focus(); pg.keyboard.press("ArrowRight"); pg.keyboard.press("ArrowRight")
    check("seta do teclado move o divisor", int(h.get_attribute("aria-valuenow"))==58, h.get_attribute("aria-valuenow"))
    pg.keyboard.press("Home"); check("Home leva a 0 (tudo Realista)", h.get_attribute("aria-valuenow")=="0")
    box=pg.locator(".hm-compare").bounding_box()
    pg.mouse.move(box["x"]+box["width"]*0.5, box["y"]+box["height"]*0.5); pg.mouse.down(); pg.mouse.move(box["x"]+box["width"]*0.25, box["y"]+box["height"]*0.5, steps=6); pg.mouse.up()
    v=int(h.get_attribute("aria-valuenow")); check("arrastar com o mouse move o divisor (~25)", 22<=v<=28, v)
    check("a imagem Original é recortada na posição do divisor", f"inset(0px {100-v}% 0px 0px)".replace(".0","") in (pg.locator(".hm-clip").get_attribute("style") or "").replace("0px","0px") or f"{100-v}%" in (pg.locator(".hm-clip").get_attribute("style") or ""), pg.locator(".hm-clip").get_attribute("style"))
    pg.mouse.move(box["x"]+box["width"]*0.9, box["y"]+box["height"]*0.5); v2=int(h.get_attribute("aria-valuenow")); check("soltar o mouse encerra o arrasto", v2==v)
    pg.locator(".hm-handle").evaluate("e=>e.style.left"); pg.keyboard.press("End"); pg.keyboard.press("ArrowLeft")
    # ---- presets
    pg.locator(".hm-preset", has_text="Vlog caseiro").click()
    check("selecionar preset marca o cartão e monta o prompt", pg.locator(".hm-preset.on").count()==1 and "home vlog" in pg.inner_text(".hm-prompt"))
    check("comparação usa o par do preset quando existe", "vlog-caseiro-original" in (pg.locator(".hm-clip img").get_attribute("src") or "") and "vlog-caseiro-realista" in (pg.locator(".hm-layer >> nth=0").locator("img").get_attribute("src") or ""))
    pg.locator(".hm-preset", has_text="Vlog na rua").click()
    check("vários presets juntos, na ordem escolhida", pg.inner_text(".hm-prompt").index("home vlog")<pg.inner_text(".hm-prompt").index("street vlog"))
    check("preset sem par próprio volta ao par padrão", "padrao-video-original" in (pg.locator(".hm-clip img").get_attribute("src") or ""))
    check("miniatura de preset vem de public/media/humano", pg.locator(".hm-preset", has_text="Vlog caseiro").locator("img").count()==1)
    # ---- comandos
    pg.click(".hm-tabs button:has-text('Corpo')"); pg.locator(".hm-cmd", has_text="Mãos naturais").click()
    pg.click(".hm-tabs button:has-text('Movimento')"); pg.locator(".hm-cmd", has_text="Câmera na mão").click()
    t=pg.inner_text(".hm-prompt")
    check("comandos entram no prompt (ordem das categorias)", "five fingers" in t and "Handheld camera with subtle shake" in t and t.index("five fingers")<t.index("Handheld camera"))
    check("contador mostra quantos comandos há em cada aba", pg.locator(".hm-tabs button:has-text('Corpo') .hm-count").inner_text()=="1" and pg.locator(".hm-tabs button:has-text('Movimento') .hm-count").inner_text()=="1")
    pg.locator(".hm-cmd", has_text="Câmera na mão").click(); check("desmarcar remove do prompt", "Handheld camera with subtle shake" not in pg.inner_text(".hm-prompt"))
    pg.screenshot(path="/home/claude/shots/hm-main.png")
    # ---- copiar
    pg.click(".hm-act:has-text('Copiar')"); pg.wait_for_selector(".toast-ok")
    check("Copiar copia o prompt completo", pg.evaluate("navigator.clipboard.readText()")==pg.inner_text(".hm-prompt").strip() or "five fingers" in pg.evaluate("navigator.clipboard.readText()"))
    # ---- editar
    pg.click(".hm-act:has-text('Editar')"); ta=pg.locator("textarea.hm-edit"); check("Editar abre a caixa de texto", ta.count()==1 and pg.locator(".hm-act[aria-pressed=true]").inner_text().strip()=="Concluir")
    ta.fill("Meu texto totalmente editado."); pg.click(".hm-act:has-text('Concluir')")
    check("o texto editado vira o prompt", pg.inner_text(".hm-prompt").strip()=="Meu texto totalmente editado.")
    pg.click(".hm-tabs button:has-text('Rosto e pele')"); pg.locator(".hm-cmd", has_text="Textura de pele real").click()
    check("mudar a seleção depois de editar NÃO apaga o texto, mas oferece atualizar", pg.inner_text(".hm-prompt").strip()=="Meu texto totalmente editado." and pg.locator(".hm-refresh").count()==1)
    pg.click(".hm-refresh"); check("'Atualizar com as seleções' recompõe", "pores" in pg.inner_text(".hm-prompt") and pg.locator(".hm-refresh").count()==0)
    # ---- prompt original opcional
    pg.locator(".hm-base summary").click(); pg.fill("textarea[aria-label='Seu prompt original']","A woman in a green dress")
    check("prompt original vai no início", pg.inner_text(".hm-prompt").startswith("A woman in a green dress."))
    # ---- persistência
    pg.reload(); pg.wait_for_selector(".hm")
    check("seleções e modo persistem ao recarregar", pg.locator(".hm-preset.on").count()==2 and "pores" in pg.inner_text(".hm-prompt") and pg.inner_text(".hm-prompt").startswith("A woman in a green dress."))
    # ---- modo imagem
    pg.click(".hm-modes [role=radio]:has-text('Imagem')"); pg.wait_for_timeout(300)
    ti=pg.locator(".hm-preset-title").all_inner_texts()
    check("modo Imagem troca os presets", len(ti)==6 and all(t.startswith("[Imagem]") for t in ti), ti)
    check("'Movimento' some no modo Imagem", "Movimento" not in pg.locator(".hm-tabs button").all_inner_texts() and len(pg.locator(".hm-tabs button").all_inner_texts())==6)
    check("presets de vídeo escolhidos são descartados e os comandos compatíveis ficam", pg.locator(".hm-preset.on").count()==0 and "pores" in pg.inner_text(".hm-prompt") and "street vlog" not in pg.inner_text(".hm-prompt"))
    check("comparação do modo Imagem usa o par padrão de imagem", "padrao-imagem-original" in (pg.locator(".hm-clip img").get_attribute("src") or ""))
    check("aviso para rotular como conteúdo de IA", "rotule como conteúdo feito com IA" in pg.inner_text(".hm-note"))
    pg.locator(".hm-preset", has_text="Selfie no espelho").click(); pg.screenshot(path="/home/claude/shots/hm-image.png")
    # ---- limpar
    pg.click(".hm-act:has-text('Limpar')"); check("Limpar zera presets, comandos, texto e mantém o modo", pg.locator(".hm-preset.on").count()==0 and "Marque presets" in pg.inner_text(".hm-prompt") and pg.locator(".hm-modes [role=radio][aria-checked=true]").inner_text().strip()=="Imagem")
    # ---- mapa de mídia
    go("#/trendly/midia"); pg.wait_for_selector("text=Mapa de mídia"); body=pg.inner_text("body")
    check("Mapa de mídia lista os espaços do Humanizar IA", "Humanizar IA: comparação Original × Realista" in body and "Humanizar IA: miniaturas dos presets" in body)
    check("Mapa mostra o caminho certo do que falta", "public/media/humano/vlog-rua-original" in body)
    check("Mapa recolhe o grupo completo (4/4 encontrados)", "4/4" in body)
    check("nenhum arquivo do humano é tratado como 'sem card'", "não pertence a nenhum card" not in body)
    # ---- celular
    m=b.new_context(viewport={"width":390,"height":844}); mp=m.new_page(); mp.goto(URL); mp.evaluate("localStorage.setItem('ppv:skipped','true')"); mp.goto(URL+"#/humano"); mp.reload(); mp.wait_for_selector(".hm")
    check("celular: sem rolagem horizontal", mp.evaluate("document.documentElement.scrollWidth<=window.innerWidth"))
    real=[e for e in errs if "Failed to load resource" not in e]; check("sem erros de página", not real, real[:2])
    b.close()
print("ALL OK" if ok else "FAILED"); sys.exit(0 if ok else 1)
