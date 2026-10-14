import json, struct, zlib, re, sys
from playwright.sync_api import sync_playwright, expect
import os
URL=os.environ.get("APP_URL","http://127.0.0.1:4185/"); KEY="AIzaSyA1234567890abcdefghijklmnopqrstuv1"
CORS={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"}
def png(w=60,h=75,c=(30,160,220)):
    raw=b"".join(b"\x00"+bytes(list(c)*w) for _ in range(h))
    def ch(t,d):
        x=struct.pack(">I",len(d))+t+d; return x+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
    return b"\x89PNG\r\n\x1a\n"+ch(b"IHDR",struct.pack(">IIBBBBB",w,h,8,2,0,0,0))+ch(b"IDAT",zlib.compress(raw))+ch(b"IEND",b"")
W22=" ".join(["palavra"]*22)
calls=[]
def text_resp(t): return {"candidates":[{"content":{"parts":[{"text":t}]}}]}
def json_resp(o): return text_resp(json.dumps(o))
def handle(route, request):
    if request.method=="OPTIONS": return route.fulfill(status=204, headers=CORS)
    u=request.url
    if "/v1beta/models?" in u:
        return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps({"models":[{"name":"models/gemini-3.6-flash","supportedGenerationMethods":["generateContent"]}]}))
    if ":generateContent" in u:
        body=json.loads(request.post_data); parts=body["contents"][0]["parts"]; sysm=body["systemInstruction"]["parts"][0]["text"]
        txt=[p["text"] for p in parts if "text" in p][-1]
        calls.append({"parts":parts,"sys":sysm,"txt":txt,"schema":"responseSchema" in body["generationConfig"]})
        if "Agente IA de Tendências" in sysm: return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps(text_resp("Aqui vão 5 ganchos para o seu vídeo.")))
        if "escrever as falas" in sysm:
            n=int(re.search(r"Exatamente (\d+) take",sysm).group(1))
            out={"sections":[{"title":"Roteiro","items":[{"label":f"Take {i+1}","text":f"Fala{i+1} "+" ".join(["palavra"]*21)} for i in range(n)]}]}
        elif "storyboard técnico" in sysm:
            n=len(re.findall(r"TAKE \d+/\d+",txt))
            out={"sections":[{"title":"Resumo da direção","items":[{"text":"Direção resumida."}]},{"title":"Roteiro de Direção (Veo 3)","items":[{"label":f"Take {i+1}/{n}","text":f"VEO PROMPT take {i+1}"} for i in range(n)]}]}
        elif "PRIMEIRO FRAME" in sysm: out={"sections":[{"title":"Prompt do primeiro frame","items":[{"text":"FIRST FRAME PROMPT"}]}]}
        elif "kit de dois passos" in sysm: out={"sections":[{"title":"Prompt do Frame","items":[{"text":"KIT FRAME PROMPT"}]},{"title":"Prompt do Vídeo","items":[{"text":"KIT VIDEO PROMPT"}]}]}
        else: out={"sections":[{"title":"x","items":[{"text":"y"}]}]}
        return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps(json_resp(out)))
    return route.fulfill(status=404, headers=CORS, body="{}")
ok=True
def check(n,c,x=""):
    global ok; print(("PASS " if c else "FAIL ")+n+(" "+str(x) if x else "")); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1366,"height":900}, permissions=["clipboard-read","clipboard-write"]); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("https://generativelanguage.googleapis.com/**", handle)
    pg.goto(URL); pg.evaluate(f"localStorage.setItem('ppv:gemini-key','{KEY}')")
    def go(h): pg.goto(URL+h); pg.reload()

    # ---- menu Ferramentas
    go("#/trendly"); pg.wait_for_selector(".tl-style")
    check("/trendly redireciona para Reels Studio", pg.url.endswith("#/trendly/reels"))
    pg.click(".tl-menu-btn")
    items=pg.locator(".tl-menu-list a").all_inner_texts()
    check("menu Ferramentas tem 4 itens (a Galeria de Prompts agora é uma aba própria)", [i.strip() for i in items]==["Reels Studio","Agente IA","Influencer Studio","Hacks Virais"], items)
    pg.keyboard.press("Escape"); check("Esc fecha o menu", pg.locator(".tl-menu-list").count()==0)
    check("3 estilos (UGC, POV, Provador)", pg.locator(".tl-style").count()==3)

    # ---- Influencer Studio: avatares vêm de public/media/avatars
    go("#/trendly/influencer"); pg.wait_for_selector(".tl-avatar-card")
    check("Mulheres: 8 avatares-base", pg.locator(".tl-avatar-card").count()==8)
    check("avatar-base com foto na pasta: 'Foto encontrada'", "Foto encontrada" in pg.locator(".tl-avatar-card:has(h2:text-is('Carolina'))").inner_text())
    check("avatar-base sem foto mostra o caminho esperado", "public/media/avatars/ana.jpg" in pg.locator(".tl-avatar-card:has(h2:text-is('Ana'))").inner_text())
    check("não existe botão de upload nem campo de arquivo", pg.locator("input[type=file]").count()==0 and pg.locator("button:has-text('Adicionar avatar')").count()==0)
    pg.click("[role=tab]:has-text('Homens')"); check("Homens: 4 avatares-base", pg.locator(".tl-avatar-card").count()==4)
    pg.click("[role=tab]:has-text('Meus Avatares')"); pg.wait_for_selector(".tl-avatar-card")
    check("Meus Avatares nasce das fotos f-/m- da pasta (Bia e João Pedro)", pg.locator(".tl-avatar-card").count()==2 and "Bia" in pg.inner_text(".tl-avatar-grid") and "Joao Pedro" in pg.inner_text(".tl-avatar-grid"))

    # ---- Produtos: cadastra e importa
    go("#/trendly/produtos"); pg.wait_for_selector(".tl-avatar-card")
    n0=pg.locator(".tl-avatar-card").count(); check("12 produtos de exemplo", n0==12, n0)
    check("produto com foto na pasta: 'Foto encontrada'", "Foto encontrada" in pg.locator(".tl-avatar-card:has(input[aria-label='Nome do produto 3'])").inner_text())
    check("produto sem foto mostra o caminho esperado", "public/media/products/camera-wifi.jpg" in pg.locator(".tl-avatar-card:has(input[aria-label='Nome do produto 1'])").inner_text())
    check("produtos sem upload", pg.locator("input[type=file]").count()==0)
    pg.click("button:has-text('Adicionar produto')"); pg.fill("#np-name","Meu produto novo"); pg.click("dialog[open] button:has-text('Adicionar')")
    pg.wait_for_selector(".tl-avatar-card:has-text('meu-produto-novo')"); check("novo produto mostra o nome do arquivo (meu-produto-novo)", True)
    pg.click("button:has-text('Importar lista')"); pg.fill("dialog[open] textarea","Garrafa térmica;alta\nLuminária de mesa"); pg.click("dialog[open] button:has-text('Importar')")
    expect(pg.locator(".tl-avatar-card")).to_have_count(15, timeout=5000); check("adicionar + importar lista (12+1+2)", True)

    # ---- UGC completo
    go("#/trendly/reels/ugc"); pg.wait_for_selector(".tw-card")
    check("UGC passo 1: rótulo, título e 4 barras", pg.inner_text(".tw-step-label")=="PASSO 1 DE 4" and "Avatar / Influencer" in pg.inner_text(".tw-step-title") and pg.locator(".tw-bars span").count()==4 and pg.locator(".tw-bars span.on").count()==1)
    check("Próximo bloqueado sem avatar", pg.locator(".tw-next").is_disabled())
    check("abas Mulheres/Homens/Meus Avatares", pg.locator(".tw-tabs button").all_inner_texts()==["Mulheres","Homens","Meus Avatares"])
    check("Mulheres: 8 avatares", pg.locator(".tw-avatar").count()==8)
    pg.click(".tw-tabs button:has-text('Meus Avatares')")
    pg.click(".tw-avatar:has-text('Bia')"); check("avatar próprio selecionável", pg.locator(".tw-avatar.on").count()==1)
    pg.screenshot(path="/home/claude/shots/w1-avatar.png")
    pg.click(".tw-next")
    check("passo 2 é 'Selecione o Produto Viral'", "Selecione o Produto Viral" in pg.inner_text(".tw-card") and pg.inner_text(".tw-step-label")=="PASSO 2 DE 4")
    check("grade de produtos: 15 itens, #1 VIRAL no primeiro", pg.locator(".tw-prod").count()==15 and "#1 VIRAL" in pg.locator(".tw-prod").first.inner_text() and "Em Alta" in pg.locator(".tw-prod").nth(4).inner_text())
    pg.locator("input[aria-label='Adicionar foto do meu produto']").set_input_files({"name":"p.png","mimeType":"image/png","buffer":png()})
    pg.locator(".tw-own-thumb img").wait_for(); pg.fill("input[aria-label='Nome do produto']","Calça preta"); pg.fill("input[aria-label='Detalhes do produto']","cintura alta")
    check("produto próprio: upload + nome liberam o Próximo", not pg.locator(".tw-next").is_disabled())
    pg.click(".tw-prod >> nth=2"); check("escolher da lista troca a origem", pg.locator(".tw-own.on").count()==0 and pg.locator(".tw-prod.on").count()==1)
    pg.locator("input[aria-label='Adicionar foto do meu produto']").set_input_files({"name":"p.png","mimeType":"image/png","buffer":png()}); pg.locator(".tw-own-thumb img").wait_for()
    expect(pg.locator(".tw-own.on")).to_have_count(1, timeout=8000)
    check("voltar ao produto próprio", pg.locator(".tw-own.on").count()==1 and pg.locator(".tw-prod.on").count()==0)
    pg.screenshot(path="/home/claude/shots/w2-product.png")
    pg.click(".tw-next")
    check("passo 3: Configuração da Cena com Quarto e Câmera Frontal já marcados", "Configuração da Cena" in pg.inner_text(".tw-card") and "Quarto" in pg.locator(".tw-pill.on").inner_text() and pg.locator("button[role=radio][aria-label='Câmera Frontal'][aria-checked=true]").count()==1)
    check("10 cenários, 2 interações, 3 poses", pg.locator(".tw-pill").count()==10 and pg.locator("button[aria-label='No Espelho']").count()==1 and pg.locator("button[aria-label^='Em pé']").count()==2)
    pg.click(".tw-pill:has-text('Academia')"); pg.click("button[aria-label='No Espelho']")
    pg.screenshot(path="/home/claude/shots/w3-scene.png")
    pg.click(".tw-next")
    check("passo 4: Roteiro & Voz com 2 takes e 4 barras cheias", pg.inner_text(".tw-step-label")=="PASSO 4 DE 4" and pg.locator("textarea[id^=take-]").count()==2 and pg.locator(".tw-bars span.on").count()==4)
    check("vozes e 6 tonalidades", pg.locator(".tw-segment button").all_inner_texts()==["Feminino","Masculino"] and pg.locator(".tw-tone").all_inner_texts()==["Grave","Médio","Agudo","Doce","Energético","Sábio"])
    check("botão Gerar bloqueado com takes vazios", pg.locator(".tw-go").is_disabled())
    check("contador 0 / 25 palavras", "0 / 25 palavras" in pg.locator(".tw-counter").first.inner_text())
    pg.click(".tw-tone:has-text('Doce')"); pg.click(".tw-segment button:has-text('Masculino')")
    pg.click("button:has-text('CRIAR ROTEIRO')"); pg.wait_for_selector("dialog[open] textarea[readonly]")
    sp=pg.input_value("dialog[open] textarea[readonly]")
    check("modal 'Criar meu roteiro com IA' com prompt de 16s e produto", "up to 16s" in sp and "Calça preta" in sp and "orange shopping cart" in sp)
    check("botões Abrir ChatGPT / Abrir Gemini", pg.locator("dialog[open] button:has-text('Abrir ChatGPT')").count()==1 and pg.locator("dialog[open] button:has-text('Abrir Gemini')").count()==1)
    pg.keyboard.press("Escape")
    pg.click("button:has-text('PREENCHER AUTOMÁTICO')"); expect(pg.locator("#take-0")).to_have_value(re.compile("Fala1"), timeout=8000)
    check("Preencher automático preenche os 2 takes (22 palavras)", "22 / 25" in pg.locator(".tw-counter").first.inner_text() and "Fala2" in pg.input_value("#take-1"))
    check("pedido do roteiro automático não leva imagens", not any("inlineData" in x for x in calls[-1]["parts"]) and "Calça preta" in calls[-1]["txt"])
    pg.screenshot(path="/home/claude/shots/w4-script.png")
    pg.click(".tw-go"); pg.wait_for_selector(".tw-overlay")
    check("tela de espera com mensagem", "Lendo seu roteiro" in pg.inner_text(".tw-overlay"))
    pg.wait_for_selector(".tw-dir")
    c=calls[-1]
    check("direção UGC: foto do avatar + 2 fotos do produto + texto", len([x for x in c["parts"] if "inlineData" in x])==3)
    check("pedido leva avatar, cena, voz e as falas exatas", "Bia (feminino)" in c["txt"] and "Cenário: Academia" in c["txt"] and "No Espelho" in c["txt"] and "tonalidade Doce" in c["txt"] and 'TAKE 2/2 (8s) — fala exata: "Fala2' in c["txt"])
    check("voz masculina escolhida vai no pedido", "Voz: masculino" in c["txt"])
    check("'Direção de IA Pronta!' com Estação de Trabalho", "Direção de IA Pronta!" in pg.inner_text(".tw-dir-head") and "Estação de Trabalho" in pg.inner_text(".tw-station"))
    check("2 takes com 'Copiar Take n'", pg.locator(".tw-take-row").count()==2 and pg.locator("button:has-text('Copiar Take 2')").count()==1)
    pg.click("button:has-text('Copiar Take 1')"); pg.wait_for_selector(".toast-ok")
    check("Copiar Take 1 copia o prompt", pg.evaluate("navigator.clipboard.readText()")=="VEO PROMPT take 1")
    pg.locator(".tw-take-row").first.locator(".tw-link").click(); check("[Ver Prompt] expande", "VEO PROMPT take 1" in pg.locator(".tw-take-pre").inner_text())
    check("4 destinos de vídeo com links seguros", pg.locator(".tw-tool").count()==4 and all(h.startswith("https://") for h in [a.get_attribute("href") for a in pg.locator(".tw-tool").all()]) and all(a.get_attribute("rel")=="noopener noreferrer" for a in pg.locator(".tw-tool").all()))
    check("referências visuais: ator + produto", pg.locator(".tw-ref").count()==2 and "ATOR PRINCIPAL" in pg.inner_text(".tw-dir-left"))
    n_calls=len(calls); pg.click("button:has-text('Gerar Prompt de Imagem')"); pg.wait_for_selector(".tw-frame-out pre")
    check("'Gerar Prompt de Imagem' (primeiro frame) sob demanda", "FIRST FRAME PROMPT" in pg.inner_text(".tw-frame-out") and len(calls)==n_calls+1)
    pg.screenshot(path="/home/claude/shots/w5-direction.png", full_page=True)
    pg.click(".tw-restart"); pg.wait_for_selector(".tw-card"); check("'Começar Novo Projeto' volta ao passo 1", pg.inner_text(".tw-step-label")=="PASSO 1 DE 4")

    # ---- POV completo (3 passos, 16s => 2 takes)
    go("#/trendly/reels/pov"); pg.wait_for_selector(".tw-card")
    check("POV: PASSO 1 DE 3 'Produto', sem avatar", pg.inner_text(".tw-step-label")=="PASSO 1 DE 3" and pg.locator(".tw-bars span").count()==3 and pg.locator(".tw-tabs").count()==0)
    pg.locator("input[aria-label='Adicionar foto do meu produto']").set_input_files({"name":"p.png","mimeType":"image/png","buffer":png()}); pg.locator(".tw-own-thumb img").wait_for(); pg.fill("input[aria-label='Nome do produto']","Câmera Wi-Fi")
    pg.click(".tw-next")
    check("POV passo 2: Configuração do Vídeo", "Configuração do Vídeo" in pg.inner_text(".tw-card") and pg.inner_text(".tw-step-label")=="PASSO 2 DE 3")
    check("POV: 6 cenários, 4 mãos, 5 estilos, 5 durações", pg.locator(".tw-pill").count()==6 and pg.locator(".tw-hands .tw-photocard").count()==4 and pg.locator(".tw-infocard").count()==5 and pg.locator(".tw-duration").count()==5)
    check("durações 8s..40s", pg.locator(".tw-duration strong").all_inner_texts()==["8s","16s","24s","32s","40s"])
    pg.click(".tw-pill:has-text('Setup Gamer')"); pg.click("button[aria-label='Sem mãos']"); pg.click(".tw-infocard:has-text('Funcionalidade')"); pg.click(".tw-duration:has-text('16s')")
    pg.screenshot(path="/home/claude/shots/w6-pov.png", full_page=True)
    pg.click(".tw-next")
    check("POV 16s => 2 takes no roteiro", pg.locator("textarea[id^=take-]").count()==2 and pg.inner_text(".tw-step-label")=="PASSO 3 DE 3")
    pg.fill("#take-0", W22); pg.fill("#take-1", W22)
    pg.click(".tw-go"); pg.wait_for_selector(".tw-dir")
    c=calls[-1]
    check("POV: só a foto do produto e sistema sem rosto", len([x for x in c["parts"] if "inlineData" in x])==1 and "SEM mostrar rosto" in c["sys"] and "Avatar:" not in c["txt"])
    check("POV: cenário, mãos e estilo no pedido", "Setup Gamer / Tech" in c["txt"] and "Mãos: Sem mãos" in c["txt"] and "Funcionalidade" in c["txt"])
    check("POV: sem 'Ator principal'", "ATOR PRINCIPAL" not in pg.inner_text(".tw-dir-left"))
    # 1 take => "Roteiro neural sincronizado"
    go("#/trendly/reels/pov"); pg.wait_for_selector(".tw-card")
    pg.locator("input[aria-label='Adicionar foto do meu produto']").set_input_files({"name":"p.png","mimeType":"image/png","buffer":png()}); pg.locator(".tw-own-thumb img").wait_for(); pg.click(".tw-next"); pg.click(".tw-next")
    check("POV 8s => 1 take", pg.locator("textarea[id^=take-]").count()==1)
    pg.fill("#take-0", W22); pg.click(".tw-go"); pg.wait_for_selector(".tw-dir")
    check("1 take: 'Roteiro neural sincronizado' + 'Copiar Roteiro Oficial'", "ROTEIRO NEURAL SINCRONIZADO" in pg.inner_text(".tw-takes") and pg.locator("button:has-text('Copiar Roteiro Oficial')").count()==1)

    # ---- Provador completo (4 passos, movimento + kit Veo 3)
    go("#/trendly/reels/provador"); pg.wait_for_selector(".tw-card")
    pg.click(".tw-avatar:has-text('Laura')"); pg.click(".tw-next")
    pg.click(".tw-prod:has-text('Calça feminina')"); pg.click(".tw-next")
    check("Provador passo 3: Configuração da Cena", pg.inner_text(".tw-step-label")=="PASSO 3 DE 4")
    pg.click(".tw-next")
    check("Provador: 'Selecione um Prompt de Movimento' com 3 barras cheias", "Selecione um Prompt de Movimento" in pg.inner_text(".tw-card") and pg.locator(".tw-bars span.on").count()==3)
    nvid=pg.locator(".tw-move-grid .tl-media").count(); check("grade só com vídeos da galeria", nvid>=20, nvid)
    check("botão Gerar bloqueado até escolher", pg.locator(".tw-card-foot button").is_disabled())
    check("inclui 'CTA Carrinho Laranja' e 'Giro lento 360 controlado'", pg.locator("button[aria-label='CTA Carrinho Laranja (Vídeo)']").count()==1 and pg.locator("button[aria-label='Giro lento 360 controlado (Vídeo)']").count()==1)
    pg.click("button[aria-label='Giro lento 360 controlado (Vídeo)']"); pg.screenshot(path="/home/claude/shots/w7-movement.png")
    check("movimento escolhido libera o Gerar", not pg.locator(".tw-card-foot button").is_disabled())
    pg.click(".tw-card-foot button"); pg.wait_for_selector(".tw-kit")
    c=calls[-1]
    check("Provador: sistema de kit mudo e movimento no pedido", "kit de dois passos" in c["sys"] and "360-degree turn" in c["txt"] and "Laura (feminino)" in c["txt"])
    check("'Seu Sistema de Criação Está Pronto' + 'Refazer'", "Seu Sistema de Criação Está Pronto" in pg.inner_text(".tw-kit-head") and pg.locator("button:has-text('Refazer')").count()==1)
    check("cartões PASSO 1 · IMAGEM e PASSO 2 · VÍDEO", "PASSO 1 · IMAGEM" in pg.inner_text(".tw-kit-prompts") and "PASSO 2 · VÍDEO" in pg.inner_text(".tw-kit-prompts") and "Movimento: Giro lento 360 controlado" in pg.inner_text(".tw-kit-prompts"))
    pg.locator(".tw-kit-card").first.locator("button:has-text('Ver Prompt Completo')").click(); check("'Ver Prompt Completo' mostra o prompt", "KIT FRAME PROMPT" in pg.locator(".tw-kit-pre").inner_text())
    pg.locator(".tw-kit-card").nth(1).locator("button:has-text('Copiar')").click(); pg.wait_for_selector(".toast-ok")
    check("Copiar do passo 2 copia o prompt do vídeo", pg.evaluate("navigator.clipboard.readText()")=="KIT VIDEO PROMPT")
    check("CTA 'Abrir Veo 3' leva ao Flow", pg.get_attribute("a:has-text('Abrir Veo 3')","href")=="https://labs.google/fx/tools/flow")
    check("imagens de referência do avatar e do produto", pg.locator(".tw-kit-refs .tw-ref").count()==2)
    pg.screenshot(path="/home/claude/shots/w8-kit.png", full_page=True)
    pg.click("button:has-text('Refazer')"); pg.wait_for_selector(".tw-move-grid"); check("'Refazer' volta ao passo de movimento", True)

    # ---- Agente IA
    go("#/trendly/agente"); pg.wait_for_selector("textarea[aria-label='Mensagem para o agente']")
    pg.fill("textarea[aria-label='Mensagem para o agente']","me dê ganchos"); pg.click("button:has-text('Enviar')"); pg.wait_for_selector(".tl-msg.assistant:has-text('5 ganchos')")
    check("Agente IA responde", pg.locator(".tl-msg.user").count()==1 and not calls[-1]["schema"] and "Agente IA de Tendências" in calls[-1]["sys"])
    pg.reload(); pg.wait_for_selector(".tl-msg.assistant"); check("conversa persiste ao recarregar", pg.locator(".tl-msg").count()==2)

    # ---- sem Gemini: passos funcionam e gerar pede conexão
    pg.evaluate("localStorage.removeItem('ppv:gemini-key')"); pg.evaluate("localStorage.setItem('ppv:skipped','true')")
    go("#/trendly/reels/ugc"); pg.wait_for_selector(".tw-card")
    pg.click(".tw-avatar >> nth=0"); pg.click(".tw-next"); pg.click(".tw-prod >> nth=0"); pg.click(".tw-next"); pg.click(".tw-next")
    pg.fill("#take-0", W22); pg.fill("#take-1", W22); pg.click(".tw-go")
    pg.wait_for_selector("dialog[open]"); check("sem Gemini: gerar abre a conexão", "Conecte o Gemini" in pg.inner_text("dialog[open]"))
    pg.keyboard.press("Escape")
    # rotas antigas
    go("#/trendly/criar/pov"); pg.wait_for_selector(".tw-card"); check("rota antiga /criar/:estilo redireciona", pg.url.endswith("#/trendly/reels/pov"))
    real=[e for e in errs if "Failed to load resource" not in e]
    check("sem erros de página", not real, real[:2])
    b.close()
print("ALL OK" if ok else "FAILED"); sys.exit(0 if ok else 1)
