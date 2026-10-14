import os, json
from playwright.sync_api import sync_playwright
URL=os.environ["APP_URL"]; KEY="AIzaSyA1234567890abcdefghijklmnopqrstuv1"; OUT="/mnt/user-data/outputs/prints"; os.makedirs(OUT,exist_ok=True)
CORS={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"}
FALAS=[
"Procurando um vestido para qualquer ocasião? Esse midi floral tem tecido leve com forro e cintura marcada, para você se sentir linda e confortável!",
"Repare no decote em V e na cintura marcada: a saia rodada dá um movimento delicado, sem deixar o tecido pesado nem desconfortável.",
"A saia rodada é a estrela desse vestido: ganha volume, balança com leveza e deixa o look romântico, perfeito para passeios, encontros e festas.",
"Pensado para quem ama peças femininas e delicadas, esse vestido floral combina com sandália, tênis ou salto e acompanha você no dia a dia.",
"O decote em V e a estampa floral trazem um ar fresco e feminino, com forro para você usar sem preocupação o dia todo.",
"Nas costas tem um laço que deixa a peça ainda mais charmosa: um detalhe delicado que faz diferença quando você sai de casa.",
"O laço nas costas dá aquele toque romântico e feminino, e a cintura marcada deixa o caimento certinho em você na hora de se vestir.",
"O tecido leve acompanha cada passo e cai com naturalidade, então você se movimenta à vontade, sem apertar, mesmo nos dias quentes.",
"Vista de costas, o vestido mostra cintura marcada, saia rodada e caimento leve, tudo no mesmo modelo, para você escolher com confiança.",
"Gostou? Esse midi floral com forro, laço nas costas e saia rodada está pronto para você. Garanta o seu agora, é só clicar no carrinho laranja!"]
cnt=[len(t.split()) for t in FALAS]; print("palavras por fala:",cnt); assert all(22<=c<=26 for c in cnt), cnt
def handle(route, request):
    if request.method=="OPTIONS": return route.fulfill(status=204, headers=CORS)
    u=request.url
    if "/v1beta/models?" in u: return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps({"models":[{"name":"models/gemini-3.6-flash","supportedGenerationMethods":["generateContent"]}]}))
    if ":generateContent" in u:
        body={"sections":[{"title":"Falas","items":[{"label":str(i+1),"text":t} for i,t in enumerate(FALAS)]},{"title":"Alertas","items":[{"text":"A descrição não informa o tipo de tecido: as falas só dizem “tecido leve”."},{"text":"A chamada para o carrinho aparece só na fala do vídeo 10."}]}]}
        return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(body)}]}}]}))
    return route.fulfill(status=404, headers=CORS, body="{}")
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":2500,"height":1260}).new_page(); pg.route("https://generativelanguage.googleapis.com/**", handle)
    pg.goto(URL); pg.evaluate(f"localStorage.setItem('ppv:gemini-key','{KEY}')"); pg.goto(URL+"#/manequins"); pg.reload(); pg.wait_for_selector(".mq-card")
    pg.screenshot(path=f"{OUT}/27-manequins-guia-e-passo-1-vestido-do-documento.png"); print("ok 27")
    pg.evaluate("document.getElementById('mq-p3').scrollIntoView({block:'start'})"); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/28-manequins-videos-com-falas-do-documento-sinalizadas.png"); print("ok 28")
    pg.fill("#mq-name","Vestido midi floral"); pg.fill("#mq-desc","Vestido midi floral, tecido leve com forro, cintura marcada, saia rodada, decote em V e laço nas costas.")
    pg.click("button:has-text('Gerar as 10 falas com IA')"); pg.wait_for_selector(".ws-ainotes"); pg.wait_for_timeout(400)
    pg.evaluate("document.getElementById('mq-p2').scrollIntoView({block:'start'})"); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/29-manequins-passo-2-vestir-o-manequim.png"); print("ok 29")
    pg.evaluate("document.getElementById('mq-p3').scrollIntoView({block:'start'})"); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/30-manequins-ia-escreveu-as-10-falas.png"); print("ok 30")
    pg.click("button:has-text('Voltar aos padrões')"); pg.select_option("#mq-garment","calca"); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('mq-p3').scrollIntoView({block:'start'})"); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/31-manequins-trocando-a-roupa-para-calca.png"); print("ok 31")
    b.close()
print("SHOTS OK")
