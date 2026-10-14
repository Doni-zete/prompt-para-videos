import json, sys
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5193/"
KEY = "AIzaSyA1234567890abcdefghijklmnopqrstuv1"
CORS = {"access-control-allow-origin": "*", "access-control-allow-headers": "*",
        "access-control-allow-methods": "*", "access-control-expose-headers": "x-goog-upload-url"}
log = []
polls = {"n": 0}
OUT = {"sections": [{"title": "Nota geral", "items": [{"label": "Nota", "text": "8/10: gancho forte."}]}]}

def handle(route, request):
    u, m = request.url, request.method
    if m == "OPTIONS":
        return route.fulfill(status=204, headers=CORS)
    if "/upload/v1beta/files/session-1" in u:
        log.append("bytes")
        return route.fulfill(status=200, headers=CORS, content_type="application/json",
            body=json.dumps({"file": {"name": "files/abc123", "uri": "https://generativelanguage.googleapis.com/v1beta/files/abc123", "mimeType": "video/mp4"}}))
    if "/upload/v1beta/files" in u and m == "POST":
        assert request.headers.get("x-goog-api-key") == KEY
        log.append("start")
        return route.fulfill(status=200, headers={**CORS, "x-goog-upload-url": "https://generativelanguage.googleapis.com/upload/v1beta/files/session-1"}, body="{}")
    if "/v1beta/files/abc123" in u and m == "GET":
        polls["n"] += 1
        state = "PROCESSING" if polls["n"] < 2 else "ACTIVE"
        log.append("poll:" + state)
        return route.fulfill(status=200, headers=CORS, content_type="application/json",
            body=json.dumps({"name": "files/abc123", "state": state, "uri": "https://generativelanguage.googleapis.com/v1beta/files/abc123"}))
    if "/v1beta/files/abc123" in u and m == "DELETE":
        log.append("delete")
        return route.fulfill(status=200, headers=CORS, body="{}")
    if "/v1beta/models?" in u:
        return route.fulfill(status=200, headers=CORS, content_type="application/json",
            body=json.dumps({"models": [{"name": "models/gemini-3.6-flash", "supportedGenerationMethods": ["generateContent"]}]}))
    if ":generateContent" in u:
        body = json.loads(request.post_data)
        parts = body["contents"][0]["parts"]
        log.append("gen:" + ("fileData" if any("fileData" in p for p in parts) else "NO-VIDEO"))
        return route.fulfill(status=200, headers=CORS, content_type="application/json",
            body=json.dumps({"candidates": [{"content": {"parts": [{"text": json.dumps(OUT)}]}}]}))
    return route.fulfill(status=404, headers=CORS, body="{}")

ok = True
def check(n, c):
    global ok
    print(("PASS " if c else "FAIL ") + n); ok = ok and c

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_context(viewport={"width": 1280, "height": 800}).new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.route("https://generativelanguage.googleapis.com/**", handle)
    page.goto(URL)
    page.evaluate(f"localStorage.setItem('ppv:gemini-key','{KEY}')")
    page.goto(URL + "#/ferramenta/analise-video")
    page.reload()
    page.wait_for_selector("text=Autoanálise de Vídeo")
    page.click("button:has-text('Avaliar Vídeo')")
    page.wait_for_selector(".alert-error")
    check("pede o vídeo antes de enviar", "vídeo" in page.inner_text(".alert-error").lower())
    page.set_input_files("input[type=file][accept^='video']", "/home/claude/teste.mp4")
    page.wait_for_selector(".video-ready video")
    check("preview do vídeo aparece", True)
    page.click("button:has-text('Avaliar Vídeo')")
    page.wait_for_selector(".result-section", timeout=30000)
    check("avaliação exibida", "8/10" in page.inner_text(".result"))
    page.wait_for_timeout(500)
    check("fluxo start→bytes→poll→gerar→apagar", log[0] == "start" and "bytes" in log and "poll:ACTIVE" in log and "gen:fileData" in log and log[-1] == "delete")
    print(log)
    check("sem erros de página", not errs)
    b.close()
print("ALL OK" if ok else "FAILED"); sys.exit(0 if ok else 1)
