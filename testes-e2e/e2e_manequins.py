import os, sys, json, re
from playwright.sync_api import sync_playwright, expect
URL=os.environ["APP_URL"]; KEY="AIzaSyA1234567890abcdefghijklmnopqrstuv1"; CORS={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"}
calls=[]; ok=True
def check(n,c,x=""):
    global ok; print(("PASS " if c else "FAIL ")+n+(" "+str(x) if x else "")); ok=ok and bool(c)
def falas():
    return {"sections":[{"title":"Falas","items":[{"label":str(n),"text":" ".join([f"fala{n}"]*24)} for n in range(1,11)]},{"title":"Alertas","items":[{"text":"A descrição não cita o tecido: não afirmei material."}]}]}
def handle(route, request):
    if request.method=="OPTIONS": return route.fulfill(status=204, headers=CORS)
    u=request.url
    if "/v1beta/models?" in u: return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps({"models":[{"name":"models/gemini-3.6-flash","supportedGenerationMethods":["generateContent"]}]}))
    if ":generateContent" in u:
        b=json.loads(request.post_data); calls.append({"sys":b["systemInstruction"]["parts"][0]["text"],"txt":b["contents"][0]["parts"][-1]["text"]})
        return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(falas())}]}}]}))
    return route.fulfill(status=404, headers=CORS, body="{}")
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":2500,"height":1260}, permissions=["clipboard-read","clipboard-write"]); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("https://generativelanguage.googleapis.com/**", handle)
    pg.goto(URL); pg.evaluate("localStorage.setItem('ppv:skipped','true')")
    def go(h): pg.goto(URL+h); pg.reload()
    card=lambda n: pg.locator(f".mq-card[aria-label='Vídeo {n}']")
    prompt=lambda n: card(n).locator(".ws-pre").inner_text()
    # ---- menu e painel
    go("#/"); pg.wait_for_selector(".tcard")
    links=[t.strip() for t in pg.locator(".sidebar .nav a").all_inner_texts()]
    check("menu não repete 'Manequins' (fica só como card do painel)", "Manequins" not in links, links)
    check("painel tem o card 'Manequins' (5 cards)", "Manequins" in pg.locator(".tcard h2").all_inner_texts() and pg.locator(".tcard").count()==5, pg.locator(".tcard").count())
    pg.click(".tcard:has(h2:text-is('Manequins')) a.tcard-main"); pg.wait_for_selector(".mq")
    check("a rota abre a página", pg.url.endswith("#/manequins") and "Manequins" in pg.inner_text(".page-head"))
    # ---- layout largo
    ratio=pg.evaluate("(()=>{const m=document.querySelector('.main');const cs=getComputedStyle(m);const w=m.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);return document.querySelector('.page').getBoundingClientRect().width/w})()")
    check("ocupa toda a largura", ratio>=0.97, round(ratio,3))
    cols=pg.evaluate("(()=>{const cs=[...document.querySelectorAll('.mq-card')];const t=cs[0].getBoundingClientRect().top;return cs.filter(e=>Math.abs(e.getBoundingClientRect().top-t)<4).length})()")
    check("em tela larga, os vídeos ficam em 3 colunas", cols>=3, cols)
    # ---- guia
    check("guia em linguagem simples com 4 passos", "Como funciona (leia em 30 segundos)" in pg.inner_text(".vguide") and pg.locator(".vguide-steps li").count()==4)
    check("o guia fala de Frames to Video, trocar a roupa e a fala", all(s in pg.inner_text(".vguide").replace("\n"," ") for s in ["Vista o manequim com a sua peça","Frames to Video","10 vídeos","fala"]))
    check("três passos na página", all(s in pg.inner_text(".mq") for s in ["Passo 1: a sua peça e o manequim","Passo 2: vista o manequim com a sua peça","Passo 3: escolha o vídeo"]))
    # ---- abas
    check("de frente: 5 vídeos (1 a 5)", pg.locator(".mq-card").count()==5 and [t.lower() for t in pg.locator(".mq-card .mq-n").all_inner_texts()]==[f"vídeo {i}" for i in range(1,6)])
    pg.click(".mq-tabs button:has-text('De costas')"); check("de costas: 5 vídeos (6 a 10)", [t.lower() for t in pg.locator(".mq-card .mq-n").all_inner_texts()]==[f"vídeo {i}" for i in range(6,11)])
    pg.click(".mq-tabs button:has-text('Todos')"); check("todos: 10 vídeos", pg.locator(".mq-card").count()==10)
    # ---- conteúdo do vídeo 1 (texto do documento)
    p1=prompt(1)
    check("vídeo 1: abertura, trava, cenário e ação do documento", all(s in p1 for s in ["Create a realistic vertical 9:16 fashion boutique product video, 8 seconds duration.","Use the reference image as the exact starting frame.","smooth matte peach skin tone, faceless head, wearing exactly the same dress","PRODUCT LOCK:","Premium women's fashion boutique, warm wooden walls","0-2s:\nCamera slowly approaches the mannequin from the front.","A feminine hand enters from the right side and gently touches the upper fabric area, showing the texture.","The hand lightly holds the skirt and moves the fabric slightly"]))
    check("o prompt traz o bloco AUDIO do documento", "AUDIO:\nBrazilian Portuguese female voice.\nNatural commercial narration.\nDuration around 8 seconds.\nDo not sync lips.\nVoice only, no dialogue from mannequin." in p1)
    check("a fala do modelo vai no fim do prompt", p1.strip().endswith('Speak only this line, exactly as written: "Esse vestido une elegância e conforto, com um caimento incrível que valoriza a silhueta em qualquer ocasião."'))
    check("vídeos de costas mostram as costas", "facing away from the camera, showing the back of the dress" in prompt(6) and "facing directly toward the camera" not in prompt(6))
    check("cada vídeo explica em português o que acontece", all(len(t)>60 for t in pg.locator(".mq-sum").all_inner_texts()) and "tecido da saia" in card(2).locator(".mq-sum").inner_text())
    # ---- fala em espaço separado, com contador
    n1=card(1).locator("textarea").input_value()
    check("a fala tem espaço separado (caixa própria) e contador", n1.startswith("Esse vestido une") and "17 palavras" in card(1).locator(".ws-count").inner_text() and "Faltam 5" in card(1).locator(".ws-count").inner_text())
    check("fala com palavra a evitar é sinalizada", "Evite: sofisticado" in card(2).locator(".ws-count").inner_text() and "warn" in card(2).locator(".ws-count").get_attribute("class"))
    check("aviso geral: as 10 falas do modelo estão fora da faixa", "10 falas estão fora de 22 a 26 palavras" in pg.inner_text(".ws-warn"), pg.inner_text(".ws-warn")[:120])
    # ---- copiar
    card(1).locator("button:has-text('Copiar prompt do vídeo 1')").click(); pg.wait_for_selector(".toast-ok")
    check("Copiar prompt copia exatamente o que está na tela", pg.evaluate("navigator.clipboard.readText()").strip()==p1.strip())
    card(1).locator("button:has-text('Copiar só a fala 1')").click(); pg.wait_for_selector(".toast-ok")
    check("Copiar só a fala copia a fala", pg.evaluate("navigator.clipboard.readText()")=="Esse vestido une elegância e conforto, com um caimento incrível que valoriza a silhueta em qualquer ocasião.")
    # ---- editar a fala
    card(1).locator("textarea").fill("Quer um vestido que muda o seu look? Esse tem caimento leve, tecido macio e serve para o dia e para a noite, é só garantir o seu agora!")
    check("editar a fala atualiza o prompt e o contador", 'exactly as written: "Quer um vestido que muda o seu look?' in prompt(1) and "palavras" in card(1).locator(".ws-count").inner_text())
    check("aparece 'Restaurar a fala do modelo' e funciona", card(1).locator("button:has-text('Restaurar a fala do modelo')").count()==1)
    card(1).locator("button:has-text('Restaurar a fala do modelo')").click(); check("restaurada", card(1).locator("textarea").input_value().startswith("Esse vestido une"))
    ficha="\n".join(f"Item técnico {i}: valor {i}" for i in range(60))
    card(1).locator("textarea").fill(ficha)
    check("ficha técnica na fala: avisa e NÃO entra no prompt (volta destacado)", "ficha técnica" in card(1).locator(".ws-count").inner_text() and "Item técnico" not in prompt(1) and card(1).locator(".ws-pre mark").count()==1)
    card(1).locator("button:has-text('Restaurar a fala do modelo')").click()
    # ---- fala fora do prompt
    pg.uncheck(".veo-check input"); check("com a fala desligada, o prompt não leva a linha da fala (mas a caixa continua)", "Speak only this line" not in prompt(1) and card(1).locator("textarea").count()==1 and "Voice only, no dialogue from mannequin." in prompt(1))
    pg.check(".veo-check input")
    # ---- manequim masculino, cenário, tom
    pg.select_option("#mq-gender","male")
    check("manequim masculino troca mão e voz", pg.input_value("#mq-hand")=="masculine" and pg.input_value("#mq-voice")=="male")
    check("e o prompt acompanha", all(s in prompt(1) for s in ["full-body male mannequin","Premium men's fashion boutique","A masculine hand enters","Brazilian Portuguese male voice."]))
    pg.select_option("#mq-gender","female"); pg.select_option("#mq-tone","black"); check("tom do manequim", "smooth matte black skin tone" in prompt(1))
    pg.select_option("#mq-tone","peach"); pg.fill("#mq-scene","A bright showroom with white walls."); check("cenário personalizado", "SCENE:\nA bright showroom with white walls." in prompt(1)); pg.fill("#mq-scene","")
    # ---- trocar a roupa
    pg.select_option("#mq-garment","calca")
    txt=pg.inner_text(".mq-grid")
    check("calça: todos os prompts falam em pants e nenhum fala em dress ou skirt", "wearing exactly the same pants" in prompt(1) and not re.search(r"\bdress\b|\bskirt\b", txt, re.I))
    check("calça: ação do vídeo 1 usa cós e pernas", "gently touches the waistband area" in prompt(1) and "holds the pant legs" in prompt(1))
    check("calça: as explicações em português usam as palavras da calça", "as pernas da calça" in card(1).locator(".mq-sum").inner_text() and "das pernas da calça" in card(2).locator(".mq-sum").inner_text())
    check("calça: as falas do vestido somem e o app avisa que faltam", all(card(n).locator("textarea").input_value()=="" for n in range(1,6)) and "estão sem fala" in pg.inner_text(".ws-warn"), pg.inner_text(".ws-warn")[:100])
    check("calça: o prompt sem fala mostra o modelo destacado", card(1).locator(".ws-pre mark").count()==1)
    check("calça: os prompts de imagem falam da calça", "Anexe a foto da frente da calça" in pg.inner_text(".mq-imgs") and "Using the attached front photo of the pants" in pg.inner_text(".mq-imgs") and "Using the attached back photo of the pants" in pg.inner_text(".mq-imgs"))
    # ---- imagem: copiar
    pg.click("button:has-text('Copiar prompt da frente')"); pg.wait_for_selector(".toast-ok"); check("Copiar prompt da foto do manequim", "faithful copy of the attached photo" in pg.evaluate("navigator.clipboard.readText()"))
    # ---- IA escreve as 10 falas
    check("sem Gemini, o botão da IA fica desativado", pg.locator("button:has-text('Gerar as 10 falas com IA')").is_disabled())
    pg.evaluate(f"localStorage.setItem('ppv:gemini-key','{KEY}')"); pg.reload(); pg.wait_for_selector(".mq")
    check("com Gemini mas sem descrição, continua desativado", pg.locator("button:has-text('Gerar as 10 falas com IA')").is_disabled())
    pg.fill("#mq-name","Calça jeans wide"); pg.fill("#mq-desc","Calça jeans wide leg de cintura alta, com bolsos e botão. Lavagem azul clara.")
    pg.click("button:has-text('Gerar as 10 falas com IA')"); pg.wait_for_selector(".ws-ainotes", timeout=20000)
    c=calls[-1]; check("o pedido leva a peça, o nome e a descrição; o sistema traz as regras", "Peça: calça (Calça jeans wide)" in c["txt"] and "wide leg de cintura alta" in c["txt"] and "10 itens rotulados" in c["sys"] and "22 a 26 palavras" in c["sys"])
    pg.click(".mq-tabs button:has-text('Todos')")
    check("as 10 falas foram preenchidas", all(card(n).locator("textarea").input_value().startswith(f"fala{n} ") for n in range(1,11)))
    check("com as 10 falas dentro da faixa, o aviso vira 'tudo certo'", "As 10 falas estão dentro de 22 a 26 palavras" in pg.inner_text(".ws-ok"))
    check("a fala da IA entra no prompt do vídeo certo", 'exactly as written: "fala7 ' in prompt(7) and "fala3 " not in prompt(7))
    check("avisos da IA aparecem", "A descrição não cita o tecido" in pg.inner_text(".ws-ainotes"))
    # ---- persistência e redefinir
    pg.reload(); pg.wait_for_selector(".mq")
    check("tudo continua depois de recarregar (peça, descrição e falas)", pg.input_value("#mq-garment")=="calca" and pg.input_value("#mq-name")=="Calça jeans wide")
    pg.click(".mq-tabs button:has-text('Todos')"); check("falas salvas", card(4).locator("textarea").input_value().startswith("fala4 "))
    pg.click("button:has-text('Voltar aos padrões')"); check("'Voltar aos padrões' volta ao vestido", pg.input_value("#mq-garment")=="vestido" and pg.input_value("#mq-name")=="")
    # ---- telas menores
    for vw,vh,label in [(1366,900,"1366"),(390,844,"celular")]:
        c2=b.new_context(viewport={"width":vw,"height":vh}); q=c2.new_page(); q.goto(URL); q.evaluate("localStorage.setItem('ppv:skipped','true')"); q.goto(URL+"#/manequins"); q.reload(); q.wait_for_selector(".mq-card")
        check(f"{label}: sem rolagem lateral", q.evaluate("document.documentElement.scrollWidth<=window.innerWidth"))
    real=[e for e in errs if "Failed to load resource" not in e]; check("sem erros de página", not real, real[:2])
    b.close()
print("ALL OK" if ok else "FAILED"); sys.exit(0 if ok else 1)
