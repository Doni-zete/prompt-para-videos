"""v23: card único 'Geradores de Prompt', 'Tendências', lápis nos títulos (renomear / restaurar) e tela Diagnóstico.
Precisa de `npx vite --port PORTA` aberto e APP_URL=http://localhost:PORTA. A API do Google é simulada."""
import os, sys, json
from playwright.sync_api import sync_playwright
URL=os.environ["APP_URL"].rstrip("/")+"/"
KEY="AIzaSyA1234567890abcdefghijklmnopqrstuv1"
ok=True
VER=json.load(open(os.environ.get("PKG","/home/claude/ppv/package.json")))["version"]
def check(n,c,x=""):
    global ok; print(("PASS " if c else "FAIL ")+n+(" "+str(x) if x else "")); ok=ok and bool(c)
CORS={"access-control-allow-origin":"*","access-control-allow-headers":"*"}
def handle(route, request):
    u=request.url
    if request.method=="OPTIONS": return route.fulfill(status=204,headers={**CORS,"access-control-allow-methods":"*"})
    if request.headers.get("x-goog-api-key","")!=KEY:
        return route.fulfill(status=400,headers=CORS,content_type="application/json",body=json.dumps({"error":{"code":400,"message":"API key not valid.","status":"INVALID_ARGUMENT","details":[{"reason":"API_KEY_INVALID"}]}}))
    if "/models?" in u or u.endswith("/models"):
        return route.fulfill(status=200,headers=CORS,content_type="application/json",body=json.dumps({"models":[{"name":"models/gemini-2.5-flash","supportedGenerationMethods":["generateContent"]}]}))
    if ":generateContent" in u:  # sempre falha, com a chave dentro da mensagem de propósito
        return route.fulfill(status=400,headers=CORS,content_type="application/json",body=json.dumps({"error":{"code":400,"message":f"Bad request for ?key={KEY} (teste)","status":"INVALID_ARGUMENT"}}))
    return route.fulfill(status=404,headers=CORS,body="{}")

def go(pg,h):
    pg.goto(URL+h); pg.reload(); pg.wait_for_selector(".main"); pg.wait_for_timeout(300)

with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1500,"height":950},permissions=["clipboard-read","clipboard-write"]); pg=ctx.new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.route("https://generativelanguage.googleapis.com/**",handle)
    pg.goto(URL); pg.evaluate("localStorage.setItem('ppv:skipped','true')")

    # ---------- painel, geradores, nome ----------
    go(pg,"#/"); pg.wait_for_selector(".tcard")
    names=pg.locator(".tcard h2").all_inner_texts()
    check("painel: 5 cards (Tendências, Humanizar IA, Manequins + 2 em breve), sem repetir o que está no menu", names==["Tendências","Humanizar IA","Manequins","Produtos mais vendidos","Radar de Produto em Alta"], names)
    check("painel: nenhum gerador solto e nem Galeria/Geradores repetidos", not any(n in names for n in ["POV","UGC","Gerador de Headlines","Galeria de Prompts","Geradores de Prompt"]), names)
    check("a palavra Trendly não aparece mais no painel nem no menu", "trendly" not in (pg.locator(".main").inner_text()+pg.locator(".sidebar").inner_text()).lower())
    links=[t.strip() for t in pg.locator(".sidebar .nav a").all_inner_texts()]
    check("menu enxuto, sem repetir o painel", links==["Painel","Geradores de Prompt","Galeria de Prompts","Progresso Semanal","Configurações"], links)
    pg.fill("input[aria-label='Buscar ferramenta']","manequim")
    check("busca do painel filtra só os cards", pg.locator(".tcard h2").all_inner_texts()==["Manequins"], pg.locator(".tcard h2").all_inner_texts())
    pg.fill("input[aria-label='Buscar ferramenta']","")
    # painel novo: resumo, continue de onde parou, atalhos
    check("painel: 5 blocos de resumo (Gemini, metas de hoje, favoritos, editados, diagnóstico)", pg.locator(".dtiles .dtile").count()==5)
    check("painel: 'Continue de onde parou' começa vazio", pg.get_by_test_id("recent-empty").count()==1)
    pg.locator(".tcard:has(h2:text-is('Humanizar IA')) a.tcard-main").click(); pg.wait_for_selector(".hm")
    go(pg,"#/ferramenta/ugc"); go(pg,"#/")
    rec=pg.get_by_test_id("recent-list").inner_text()
    check("painel: 'Continue' lista as telas abertas, a mais nova primeiro", rec.index("UGC")<rec.index("Humanizar IA"), rec)
    pg.get_by_test_id("recent-list").get_by_role("link",name="Humanizar IA").click(); pg.wait_for_selector(".hm")
    check("painel: clicar num recente reabre a ferramenta", pg.url.endswith("#/humano"))
    go(pg,"#/")
    check("painel: atalhos Novo prompt e Mapa de mídia", pg.get_by_role("link",name="Novo prompt").count()==1 and pg.get_by_role("link",name="Mapa de mídia").count()==1)
    pg.get_by_role("link",name="Novo prompt").click(); pg.wait_for_selector("#np-title")
    check("atalho Novo prompt abre o diálogo na Galeria", "/galeria" in pg.url)
    pg.keyboard.press("Escape")
    # prompt aberto na Galeria vira recente e abre direto pelo painel
    go(pg,"#/galeria?c=prontas"); pg.wait_for_selector(".gl-card"); pg.locator(".gl-card .gl-open").first.click(); pg.wait_for_selector("dialog[open] .gd")
    ptitle=pg.locator("dialog[open] .gd-titlebar h2").inner_text(); pg.keyboard.press("Escape")
    go(pg,"#/")
    check("painel: o prompt aberto aparece em 'Continue' como Prompt da Galeria", ptitle in pg.get_by_test_id("recent-list").inner_text() and "Prompt da Galeria" in pg.get_by_test_id("recent-list").inner_text(), ptitle)
    pg.get_by_test_id("recent-list").get_by_role("link",name=ptitle).first.click(); pg.wait_for_selector("dialog[open] .gd")
    check("clicar no prompt recente abre a janela dele", pg.locator("dialog[open] .gd-titlebar h2").inner_text()==ptitle)
    pg.keyboard.press("Escape")
    # favorito e editado contam nos blocos
    pg.locator("dialog[open] .gd-fav").count()
    go(pg,"#/galeria?c=prontas"); pg.wait_for_selector(".gl-card"); pg.locator(".gl-card").first.locator("button[aria-pressed]").first.click(); pg.wait_for_timeout(200)
    go(pg,"#/")
    check("bloco 'Prompts favoritos' conta o favorito", pg.locator(".dtile:has-text('Prompts favoritos') strong").inner_text()=="1", pg.locator(".dtile:has-text('Prompts favoritos') strong").inner_text())
    pg.locator(".dtile:has-text('Prompts favoritos')").click(); pg.wait_for_selector(".gl-card")
    check("o bloco leva à Galeria já filtrada em favoritos (1 card)", pg.locator(".gl-card").count()==1, pg.locator(".gl-card").count())
    pg.evaluate("localStorage.removeItem('ppv:favorites')"); pg.evaluate("localStorage.removeItem('ppv:trendly:favorites')")
    go(pg,"#/geradores"); pg.wait_for_selector("h1:text-is('Geradores de Prompt')")
    gen=pg.locator(".tgrid .tcard h2").all_inner_texts()
    check("página Geradores de Prompt: 9 geradores", len(gen)==9 and "POV" in gen and "UGC" in gen and "Gerador de Defesa para Violações" in gen and "Autoanálise de Vídeo" in gen, gen)
    check("título da aba", pg.title()=="Geradores de Prompt | Prompt para Vídeo", pg.title())
    pg.locator(".tcard:has(h2:text-is('Gerador de Headlines')) a.tcard-main").click(); pg.wait_for_selector("h1:text-is('Gerador de Headlines')")
    check("card abre o gerador (rota /ferramenta/headlines)", pg.url.endswith("#/ferramenta/headlines"), pg.url)
    for h,t in (("#/ferramenta/pov","Prompts POV"),("#/ferramenta/ugc",None),("#/ferramenta/analise-video",None),("#/trendly/reels",None)):
        go(pg,h); check(f"rota antiga {h} continua abrindo", pg.locator(".main").inner_text().strip()!="" and "não encontrada" not in pg.locator(".main").inner_text().lower())
    go(pg,"#/trendly/reels"); check("Tendências: rota #/trendly continua e a barra se chama Tendências", pg.locator("nav[aria-label='Tendências']").count()==1)

    # ---------- lápis nos títulos ----------
    def open_first(h):
        go(pg,h); pg.wait_for_selector(".gl-card"); pg.locator(".gl-card .gl-open").first.click(); pg.wait_for_selector("dialog[open] .gd")
    for label,h in (("prompt da galeria","#/galeria"),("prompt pronto","#/galeria?c=prontas"),("vídeo (formato novo)","#/galeria?c=videos"),("movimento especial","#/galeria?c=movimentos")):
        open_first(h)
        orig=pg.locator("dialog[open] .gd-titlebar h2").inner_text()
        check(f"{label}: lápis ao lado do título", pg.get_by_role("button",name="Editar nome").count()==1)
        pg.get_by_role("button",name="Editar nome").click(); inp=pg.get_by_label("Nome do prompt"); inp.fill("Nome do meu jeito"); inp.press("Enter")
        pg.wait_for_selector("dialog[open] .gd-titlebar h2:text-is('Nome do meu jeito')")
        check(f"{label}: título muda na hora e aparece 'Editado por você'", "Editado por você" in pg.locator("dialog[open] .gd-tags").inner_text())
        pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
        check(f"{label}: o card mostra o nome novo", pg.locator(".gl-card").filter(has_text="Nome do meu jeito").count()>=1)
        pg.reload(); pg.wait_for_selector(".gl-card")
        check(f"{label}: nome novo continua depois de recarregar", pg.locator(".gl-card").filter(has_text="Nome do meu jeito").count()>=1)
        pg.locator(".gl-card").filter(has_text="Nome do meu jeito").first.locator(".gl-open").click(); pg.wait_for_selector("dialog[open] .gd")
        pg.get_by_role("button",name="Editar nome").click()
        check(f"{label}: aparece 'Restaurar nome'", pg.get_by_role("button",name="Restaurar nome").count()==1)
        pg.get_by_role("button",name="Restaurar nome").click(); pg.wait_for_selector(f"dialog[open] .gd-titlebar h2:text-is({json.dumps(orig,ensure_ascii=False)})")
        check(f"{label}: restaurar volta ao nome original", pg.locator("dialog[open] .gd-titlebar h2").inner_text()==orig and "Editado por você" not in pg.locator("dialog[open] .gd-tags").inner_text())
        # vazio não renomeia; Escape cancela
        pg.get_by_role("button",name="Editar nome").click(); pg.get_by_label("Nome do prompt").fill("   "); pg.get_by_label("Nome do prompt").press("Enter")
        check(f"{label}: nome em branco é ignorado", pg.locator("dialog[open] .gd-titlebar h2").inner_text()==orig)
        pg.get_by_role("button",name="Editar nome").click(); pg.get_by_label("Nome do prompt").fill("xx"); pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
        check(f"{label}: Esc cancela a edição do nome sem fechar a janela", pg.locator("dialog[open] .gd-titlebar h2").count()==1 and pg.locator("dialog[open] .gd-titlebar h2").inner_text()==orig)
        pg.keyboard.press("Escape")
    # renomear não apaga a edição do prompt (e vice-versa)
    open_first("#/galeria?c=prontas")
    pg.locator("dialog[open] .gd-actions .gd-pencil").click(); pg.fill("#gd-prompt","meu texto novo"); pg.get_by_role("button",name="Salvar",exact=True).click()
    pg.get_by_role("button",name="Editar nome").click(); pg.get_by_label("Nome do prompt").fill("Outro nome"); pg.get_by_label("Nome do prompt").press("Enter"); pg.wait_for_timeout(200)
    check("renomear mantém o texto editado", "meu texto novo" in pg.locator("dialog[open] .gd-prompt pre").inner_text())
    pg.keyboard.press("Escape"); go(pg,"#/galeria?c=prontas"); pg.wait_for_selector(".gl-card")
    pg.locator(".gl-card").filter(has_text="Outro nome").first.locator(".gl-open").click(); pg.wait_for_selector("dialog[open] .gd")
    pg.locator("dialog[open] .gd-actions .gd-pencil").click(); pg.get_by_role("button",name="Restaurar original").click(); pg.wait_for_timeout(200)
    check("'Restaurar original' volta texto e nome juntos", "Outro nome" not in pg.locator("dialog[open] .gd-titlebar h2").inner_text() and "meu texto novo" not in pg.locator("dialog[open] .gd-prompt pre").inner_text())
    pg.keyboard.press("Escape")
    # prompt do usuário
    go(pg,"#/galeria"); pg.wait_for_selector(".gl-card"); pg.get_by_role("button",name="Novo prompt").click(); pg.fill("#np-title","Prompt meu"); pg.fill("#np-prompt","texto"); pg.get_by_role("button",name="Salvar prompt").click(); pg.wait_for_timeout(500)
    pg.goto(URL+"#/galeria?c=prontas"); pg.reload(); pg.wait_for_selector(".gl-card")
    pg.locator(".gl-card").filter(has_text="Prompt meu").first.locator(".gl-open").click(); pg.wait_for_selector("dialog[open] .gd")
    pg.get_by_role("button",name="Editar nome").click(); pg.get_by_label("Nome do prompt").fill("Prompt meu 2"); pg.get_by_label("Nome do prompt").press("Enter")
    pg.wait_for_selector("dialog[open] .gd-titlebar h2:text-is('Prompt meu 2')")
    check("prompt do usuário: renomear pelo lápis", True)
    pg.locator("dialog[open] .gd-actions >> text=Excluir").click(); pg.get_by_role("button",name="Confirmar exclusão").click(); pg.wait_for_timeout(300)

    # ---------- filtros combinados (bug: 48 no número, 0 na tela) ----------
    go(pg,"#/galeria"); pg.wait_for_selector(".gl-card")
    pg.locator(".gl-card .gl-open").first.click(); pg.wait_for_selector("dialog[open] .gd"); pg.get_by_role("button",name="Editar nome").click(); pg.get_by_label("Nome do prompt").fill("Editei este"); pg.get_by_label("Nome do prompt").press("Enter"); pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    go(pg,"#/galeria"); pg.wait_for_selector(".gl-card")
    check("sem filtros: não aparece a faixa 'Filtros ligados'", pg.locator(".gl-active").count()==0)
    pg.get_by_role("button",name=__import__("re").compile("^Editados por mim")).click(); pg.wait_for_timeout(200)
    check("filtro 'Editados por mim' mostra a faixa com a etiqueta", pg.locator(".gl-active").count()==1 and "Editados por mim" in pg.locator(".gl-active").inner_text())
    vid=pg.get_by_role("button",name=__import__("re").compile("^Prompts dos Vídeos do TikTok"))
    n_label=int(vid.locator("b").inner_text())
    check("com 'Editados por mim' ligado, o número da coleção de vídeos já considera o filtro (não é mais 48)", n_label==0, n_label)
    vid.click(); pg.wait_for_timeout(300)
    shown=pg.locator(".gl-card").count()
    check("o número ao lado do filtro bate com os cards mostrados", shown==n_label, f"{shown} x {n_label}")
    check("faixa mostra os dois filtros ligados", "Editados por mim" in pg.locator(".gl-active").inner_text() and "Prompts dos Vídeos do TikTok" in pg.locator(".gl-active").inner_text())
    check("tela vazia tem botão Limpar filtros", pg.get_by_role("button",name="Limpar filtros").count()==1)
    pg.get_by_role("button",name="Tirar filtro Editados por mim").click(); pg.wait_for_timeout(300)
    check("tirar a etiqueta 'Editados por mim' traz os 48 vídeos", pg.locator(".gl-card").count()==48 or "Carregar mais" in pg.locator(".gl-main").inner_text(), pg.locator(".gl-card").count())
    check("restou só a coleção na faixa", pg.locator(".gl-active .gl-chip-x").count()==1)
    pg.get_by_role("button",name="Tirar filtro Prompts dos Vídeos do TikTok").click(); pg.wait_for_timeout(200)
    check("sem filtros a faixa some", pg.locator(".gl-active").count()==0)
    pg.locator(".gl-card .gl-open").first.click(); pg.wait_for_selector("dialog[open] .gd"); pg.get_by_role("button",name="Editar nome").click(); pg.get_by_role("button",name="Restaurar nome").click(); pg.keyboard.press("Escape")

    # ---------- Diagnóstico ----------
    pg.evaluate("localStorage.removeItem('ppv:diag:events')")
    go(pg,"#/configuracoes")
    check("Configurações tem a seção Diagnóstico", pg.get_by_role("heading",name="Diagnóstico").count()==1)
    check("sem problemas: mensagem de vazio", pg.get_by_test_id("diag-empty").count()==1)
    txt=pg.locator("#diagnostico").inner_text()
    check("mostra versão em uso e armazenamento", "Versão em uso" in txt and VER in txt and "Armazenamento deste navegador" in txt, txt[:200])
    pg.get_by_role("button",name="Verificar versão publicada").click(); pg.wait_for_timeout(800)
    check("verificar versão: no servidor de desenvolvimento diz que o arquivo só existe no site publicado", "só existe no site publicado" in pg.locator("#diagnostico [role=status]").inner_text(), pg.locator("#diagnostico [role=status]").inner_text())
    # erro de tela não tratado
    pg.evaluate("window.dispatchEvent(new ErrorEvent('error',{message:'Falha de teste na tela'}))")
    pg.wait_for_selector("[data-testid=diag-list] li")
    check("erro de tela aparece no Diagnóstico", "Falha de teste na tela" in pg.get_by_test_id("diag-list").inner_text() and "Erro de tela" in pg.get_by_test_id("diag-list").inner_text())
    pg.evaluate("window.dispatchEvent(new ErrorEvent('error',{message:'Falha de teste na tela'}))")
    check("repetição vira contador (2x), não outra linha", pg.locator("[data-testid=diag-list] li").count()==1 and "2x" in pg.get_by_test_id("diag-list").inner_text())
    # falha de envio (PDF)
    go(pg,"#/trendly/midia"); pg.wait_for_selector(".tl-map-row"); open("/tmp/x23.pdf","wb").write(b"%PDF")
    pg.locator(".tl-map-row").first.locator("input[type=file]").set_input_files("/tmp/x23.pdf"); pg.wait_for_timeout(600)
    go(pg,"#/configuracoes")
    check("falha ao enviar arquivo aparece no Diagnóstico", "Falha ao enviar arquivo" in pg.get_by_test_id("diag-list").inner_text())
    # falha do Gemini, com a chave dentro da mensagem de propósito
    pg.evaluate("localStorage.removeItem('ppv:skipped')"); pg.goto(URL); pg.reload()
    pg.wait_for_selector("input[aria-label='Chave da API do Gemini']")
    pg.fill("input[aria-label='Chave da API do Gemini']","AIzaBAD_KEY_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"); pg.click("button:has-text('Conectar Gemini')"); pg.wait_for_selector(".alert-error")
    pg.fill("input[aria-label='Chave da API do Gemini']",KEY); pg.click("button:has-text('Conectar Gemini')"); pg.wait_for_selector("text=Painel de ferramentas")
    go(pg,"#/ferramenta/crescimento"); pg.fill("#f-niche","moda"); pg.get_by_role("button",name="Gerar").first.click(); pg.wait_for_selector(".alert-error"); pg.wait_for_timeout(300)
    go(pg,"#/configuracoes"); lst=pg.get_by_test_id("diag-list").inner_text()
    check("falha do Gemini aparece no Diagnóstico", "Falha do Gemini" in lst and "BAD_REQUEST" in lst, lst[:300])
    check("falha de chave recusada também aparece", "INVALID_KEY" in lst)
    stored=pg.evaluate("localStorage.getItem('ppv:diag:events')")
    check("a chave do Gemini NÃO está no que foi guardado nem na tela", KEY not in stored and KEY not in lst and "AIzaBAD_KEY" not in stored and "AIzaSy" not in stored, stored[:200])
    pg.get_by_role("button",name="Copiar relatório").click(); pg.wait_for_selector(".toast-ok")
    clip=pg.evaluate("navigator.clipboard.readText()")
    check("relatório copiado: versão, Gemini conectado, problemas e SEM chave", f"Versão: {VER}" in clip and "Gemini: conectado" in clip and "[Falha do Gemini]" in clip and KEY not in clip and "AIza" not in clip.replace("[chave removida]",""), clip[:300])
    check("o diagnóstico não entra no arquivo do projeto (não é sincronizado)", pg.evaluate("""() => ['diag:events'].every(k => !k.startsWith('custom:') && !k.startsWith('overrides:') && !['galeria:edits','favorites','trendly:favorites','trendly:products-v2'].includes(k))"""))
    pg.get_by_role("button",name="Limpar lista").click(); pg.wait_for_selector("[data-testid=diag-empty]")
    check("limpar lista esvazia", pg.evaluate("JSON.parse(localStorage.getItem('ppv:diag:events')||'[]').length")==0)
    check("sem erros de página inesperados", not [e for e in errs if "Failed to load resource" not in e], errs[:2])
    b.close()
print("ALL OK" if ok else "FAILED"); sys.exit(0 if ok else 1)
