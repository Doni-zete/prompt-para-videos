import json, base64, struct, zlib, sys
from playwright.sync_api import sync_playwright, expect

URL = "http://127.0.0.1:5193/"
KEY = "AIzaSyA1234567890abcdefghijklmnopqrstuv1"   # AIza + 35 chars
SHOTS = "/home/claude/shots"

def png_bytes(w=64, h=80):
    raw = b"".join(b"\x00" + bytes([200, 60, 140] * w) for _ in range(h))
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")

OUT = {"summary": "Três conceitos POV.", "sections": [
  {"title": "Conceito 1: Estalando os dedos", "items": [
    {"label": "Prompt da imagem 1", "text": "Create a vertical 9:16 POV photograph ...", "hint": "Suba no Flow em Frames."},
    {"label": "Prompt de movimento (Flow)", "text": "Video POV, hands snap fingers ..."}]}]}

calls = []
state = {"mode": "ok"}

def handle(route, request):
    url = request.url
    if request.method == "OPTIONS":
        return route.fulfill(status=204, headers={"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*"})
    cors = {"access-control-allow-origin": "*", "access-control-allow-headers": "*"}
    key = request.headers.get("x-goog-api-key", "")
    if key != KEY:
        return route.fulfill(status=400, headers=cors, content_type="application/json",
            body=json.dumps({"error": {"code": 400, "message": "API key not valid. Please pass a valid API key.", "status": "INVALID_ARGUMENT", "details": [{"reason": "API_KEY_INVALID"}]}}))
    if "/v1beta/models?" in url or url.endswith("/v1beta/models"):
        models = [{"name": f"models/{m}", "supportedGenerationMethods": ["generateContent"]} for m in
                  ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-image", "gemma-3-27b"]]
        return route.fulfill(status=200, headers=cors, content_type="application/json", body=json.dumps({"models": models}))
    if ":generateContent" in url:
        model = url.split("/models/")[1].split(":")[0]
        body = json.loads(request.post_data)
        calls.append({"model": model, "parts": body["contents"][0]["parts"], "sys": body.get("systemInstruction"), "cfg": body["generationConfig"]})
        if state["mode"] == "fallback" and model == "gemini-3.6-flash":
            return route.fulfill(status=429, headers=cors, content_type="application/json",
                body=json.dumps({"error": {"code": 429, "message": "quota", "status": "RESOURCE_EXHAUSTED", "details": [{"@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "60s"}]}}))
        return route.fulfill(status=200, headers=cors, content_type="application/json",
            body=json.dumps({"candidates": [{"content": {"parts": [{"text": json.dumps(OUT)}]}, "finishReason": "STOP"}]}))
    return route.fulfill(status=404, headers=cors, body="{}")

ok = True
def check(name, cond, extra=""):
    global ok
    print(("PASS " if cond else "FAIL ") + name + (" " + extra if extra else ""))
    ok = ok and cond

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1366, "height": 860}, permissions=["clipboard-read", "clipboard-write"])
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.route("https://generativelanguage.googleapis.com/**", handle)

    # 1. Welcome
    page.goto(URL)
    page.wait_for_selector("text=Conectar o Gemini gratuito")
    page.screenshot(path=f"{SHOTS}/01-welcome.png")
    check("welcome visible", True)

    # 2. invalid key
    page.fill("input[aria-label='Chave da API do Gemini']", "AIzaBAD_KEY_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
    page.click("button:has-text('Conectar Gemini')")
    page.wait_for_selector(".alert-error")
    check("invalid key shows error", "recusada" in page.inner_text(".alert-error"), page.inner_text(".alert-error")[:60])

    # 3. valid key via paste event (auto-connect)
    page.fill("input[aria-label='Chave da API do Gemini']", "")
    page.focus("input[aria-label='Chave da API do Gemini']")
    page.evaluate("""(k) => { const el=document.querySelector("input[aria-label='Chave da API do Gemini']");
      const dt=new DataTransfer(); dt.setData('text', k);
      el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true})); }""", KEY)
    page.wait_for_selector("text=Painel de ferramentas")
    check("paste connects and opens dashboard", True)
    check("sidebar shows connected", "Gemini conectado" in page.inner_text(".sidebar"))
    check("key persisted", page.evaluate("localStorage.getItem('ppv:gemini-key')") == KEY)
    page.screenshot(path=f"{SHOTS}/02-dashboard.png")
    check("5 cards no painel (Tendências, Humanizar IA, Manequins + 2 em breve; Geradores e Galeria ficam no menu)", page.locator(".tcard").count() == 5, str(page.locator(".tcard").count()))

    # 4. Tool: POV
    page.click(".sidebar .nav a:has-text('Geradores de Prompt')")
    page.wait_for_selector("h1:text-is('Geradores de Prompt')")
    check("página Geradores de Prompt tem 9 geradores", page.locator(".tgrid .tcard").count() == 9, str(page.locator(".tgrid .tcard").count()))
    page.click(".tcard:has(h2:text-is('POV')) a.tcard-main")
    page.wait_for_selector("text=Prompts POV")
    page.set_input_files("input[type=file][accept^='image']", {"name": "produto.png", "mimeType": "image/png", "buffer": png_bytes()})
    page.wait_for_selector(".thumb img")
    page.fill("#f-product", "Vestido verde")
    page.click("button:has-text('Gerar prompts POV')")
    page.wait_for_selector(".result-section")
    check("result rendered", "Estalando os dedos" in page.inner_text(".result"))
    call = calls[-1]
    check("model chain starts with best model", call["model"] == "gemini-3.6-flash", call["model"])
    check("image sent as inlineData jpeg", any("inlineData" in x and x["inlineData"]["mimeType"] == "image/jpeg" for x in call["parts"]))
    check("json schema requested", call["cfg"].get("responseMimeType") == "application/json" and "responseSchema" in call["cfg"])
    check("system instruction present", "TikTok Shop" in call["sys"]["parts"][0]["text"])
    check("history saved", page.locator(".history li").count() == 1)
    page.screenshot(path=f"{SHOTS}/03-tool-result.png", full_page=True)
    page.click(".result-bar >> text=Copiar tudo")
    page.wait_for_selector(".toast-ok")
    clip = page.evaluate("navigator.clipboard.readText()")
    check("copy all works", "Prompt da imagem 1" in clip)

    # 5. model fallback on quota
    state["mode"] = "fallback"
    n0 = len(calls)
    page.click("button:has-text('Gerar de novo')")
    page.wait_for_selector(".history li:nth-child(2)", state="attached", timeout=15000)
    used = [c["model"] for c in calls[n0:]]
    check("falls back to next model after 429", used[:2] == ["gemini-3.6-flash", "gemini-3.5-flash"], str(used))
    state["mode"] = "ok"

    # 6. validation
    page.goto(URL + "#/ferramenta/headlines")
    page.wait_for_selector("text=Gerar Headlines")
    page.click("button:has-text('Gerar Headlines')")
    page.wait_for_selector(".alert-error")
    check("requires an image", "imagem" in page.inner_text(".alert-error"))

    # 7. prompts prontos (agora dentro da Galeria de Prompts)
    page.goto(URL + "#/biblioteca/prontas")
    page.wait_for_selector(".gl-card")
    check("link antigo #/biblioteca/prontas abre a Galeria em Prompts Prontas", page.url.endswith("#/galeria?c=prontas") and page.locator(".gl-card").count() == 24, page.url + " " + str(page.locator(".gl-card").count()))
    check("7 pastas no filtro", page.locator(".gl-f.sub2").count() == 7)
    page.click(".gl-f.sub2:has-text('Calçados Femininos')")
    check("pasta lista os prompts", page.locator(".gl-card").count() == 3, str(page.locator(".gl-card").count()))
    page.screenshot(path=f"{SHOTS}/04-library.png")
    page.locator(".gl-card .gl-open").first.click()
    page.wait_for_selector("dialog[open] .gd")
    page.click("dialog[open] button:has-text('Adaptar com IA')")
    page.wait_for_selector("dialog[open] #adapt-desc")
    page.fill("#adapt-desc", "sandália rasteira branca")
    page.click("button:has-text('Adaptar prompt')")
    page.wait_for_selector("dialog[open] .result-section")
    check("adapt dialog generates", True)
    page.keyboard.press("Escape")

    # novo prompt
    page.click(".gl-head button:has-text('Novo prompt')")
    page.fill("#np-title", "Meu prompt")
    page.fill("#np-prompt", "texto do prompt")
    page.click("button:has-text('Salvar prompt')")
    page.wait_for_selector(".gl-chip.mine")
    check("custom prompt saved", page.locator(".gl-chip.mine").count() == 1)

    page.goto(URL + "#/biblioteca/videos")
    try:
        expect(page.locator(".gl-card")).to_have_count(48, timeout=8000)
        n48 = True
    except AssertionError:
        n48 = False
    check("48 video prompts", n48, str(page.locator(".gl-card").count()))

    # 8. reload keeps session
    page.reload()
    page.wait_for_selector(".gl-card")
    check("reload keeps key", page.evaluate("localStorage.getItem('ppv:gemini-key')") == KEY)

    # 9. settings
    page.goto(URL + "#/configuracoes")
    page.wait_for_selector("text=Conectado")
    opts = []
    for _ in range(40):  # a lista de modelos carrega de forma assíncrona: espera até 10 s
        opts = page.locator("#model option").all_inner_texts()
        if len([o for o in opts if o.startswith("gemini")]) >= 2: break
        page.wait_for_timeout(250)
    check("model list filtered/ranked", [o for o in opts if o.startswith("gemini")][:2] == ["gemini-3.6-flash", "gemini-3.5-flash"] and not any("gemma" in o or "image" in o for o in opts), str(opts))
    page.screenshot(path=f"{SHOTS}/05-settings.png", full_page=True)

    # 10. mobile
    m = b.new_context(viewport={"width": 390, "height": 800})
    mp = m.new_page()
    mp.route("https://generativelanguage.googleapis.com/**", handle)
    mp.goto(URL)
    mp.evaluate(f"localStorage.setItem('ppv:gemini-key','{KEY}')")
    mp.reload()
    mp.wait_for_selector("text=Painel de ferramentas")
    mp.screenshot(path=f"{SHOTS}/06-mobile.png")
    sw = mp.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth")
    check("mobile has no horizontal scroll", sw)

    # 11. sair
    page.goto(URL)
    page.click(".sidebar >> text=Sair")
    page.wait_for_selector("text=Conectar o Gemini gratuito")
    check("logout clears key and shows welcome", page.evaluate("localStorage.getItem('ppv:gemini-key')") is None)

    real_errors = [e for e in errors if "Failed to load resource" not in e]
    check("no console/page errors", not real_errors, str(real_errors[:3]))
    b.close()

print("ALL OK" if ok else "SOME FAILED")
sys.exit(0 if ok else 1)
