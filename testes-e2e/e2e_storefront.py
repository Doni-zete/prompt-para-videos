"""APP_URL=http://127.0.0.1:5177 python e2e_storefront.py. API simulated, no real account changes."""
import json
import datetime
import os
import tempfile
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import expect, sync_playwright

APP_URL = os.environ.get("APP_URL", "http://127.0.0.1:5177").rstrip("/")
SHOTS = Path(os.environ.get("SHOTS_DIR", str(
    Path(tempfile.gettempdir()) / "prompt-storefront-shots")))
SHOTS.mkdir(parents=True, exist_ok=True)
PRODUCT_ID = "11111111-1111-4111-8111-111111111111"
PRODUCT = {"id": PRODUCT_ID, "name": "Tenis esportivo vermelho", "category": "Calcados", "price": 149.9,
           "originalPrice": 249.9, "imageUrl": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
           "affiliateUrl": "https://s.shopee.com.br/test-offer", "createdAt": "2026-10-14T10:00:00Z"}


def verify_product_cards(browser):
    saved = {**PRODUCT, "price": 105.36, "originalPrice": None, "basePrice": 105.36, "commission": 25.2864,
             "commissionRate": 0.24, "sellerCommissionRate": 0.225, "shopeeCommissionRate": 0.015,
             "shopName": "Loja teste", "sales": 46, "sourceItemId": "987", "priceCondition": ""}
    products = [saved] + [{**saved, "id": f"{index:08d}-1111-4111-8111-111111111111",
                           "name": f"Produto de teste {index}", "sourceItemId": str(index)} for index in range(2, 13)]
    submitted = []

    def route_api(route):
        request = route.request
        path = urlparse(request.url).path.removeprefix("/api")
        body = request.post_data_json if request.post_data else None
        result = []
        if path == "/auth/session":
            result = {"accessToken": "test-session",
                      "tokenType": "Bearer", "expiresIn": "12h"}
        elif path == "/products/shopee/status":
            result = {"configured": True}
        elif path == "/products/shopee/resolve":
            result = {**saved, "itemId": "987", "price": 93.09,
                      "basePrice": 105.36, "priceMin": 93.09, "priceMax": 93.09}
        elif path == "/products":
            result = products
        elif path.startswith("/products/") and request.method == "PUT":
            saved.update(body)
            result = saved
        elif path == "/telegram/groups":
            result = [{"id": "22222222-2222-4222-8222-222222222222", "name": "Ofertas teste",
                       "chatId": "-100123", "active": True, "createdAt": PRODUCT["createdAt"]}]
        elif path == "/campaigns" and request.method == "POST":
            submitted.append(body)
            result = {**body, "id": "test-campaign", "status": "scheduled", "attempts": 0,
                      "lastError": None, "createdAt": PRODUCT["createdAt"], "sentAt": None}
        route.fulfill(content_type="application/json", body=json.dumps(result))

    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    context.route("**/api/**", route_api)
    context.add_init_script("localStorage.setItem('ppv:skipped','true')")
    page = context.new_page()
    page.goto(APP_URL + "/#/divulgador")
    page.get_by_label("Senha do painel").fill("e2e-password")
    page.get_by_role("button", name="Entrar", exact=True).click()
    page.get_by_role("button", name="Produtos", exact=True).click()
    expect(page.get_by_test_id("product-card")).to_have_count(12)
    page.evaluate("window.scrollTo(0, 1200)")
    page.wait_for_function(
        "Math.abs(document.querySelector('.divulgador-lookup-bar').getBoundingClientRect().top) < 2")
    card = page.get_by_test_id("product-card").first
    expect(card.get_by_text(
        "Vendedor: 22,5% · Shopee: 1,5%", exact=True)).to_be_visible()
    for platform in ["WhatsApp", "Instagram", "Facebook"]:
        expect(card.get_by_role("button", name=platform,
               exact=True)).to_be_disabled()
    page.get_by_label("Link do produto", exact=True).fill(
        "https://shopee.com.br/kit-i.10.987")
    page.get_by_role("button", name="Buscar produto", exact=True).click()
    expect(page.get_by_role(
        "button", name="Atualizar produto", exact=True)).to_be_visible()
    expect(page.get_by_text("Preço promocional confirmado (Pix/cupom)",
           exact=True)).to_have_count(0)
    expect(page.locator(".shopee-offer .offer-price-primary strong")
           ).to_have_text("R$ 93,09")
    expect(page.locator(".shopee-offer .offer-price > small")
           ).to_contain_text("105,36")
    page.get_by_role("button", name="Atualizar produto", exact=True).click()
    expect(card.get_by_text("R$ 93,09", exact=True)).to_be_visible()
    expect(card.locator(".offer-price > small")).to_contain_text("105,36")
    assert card.locator(".offer-price-primary").bounding_box()[
        "y"] < card.locator(".offer-price > small").bounding_box()["y"]
    assert saved["commissionRate"] == 0.24
    page.screenshot(
        path=str(SHOTS / "product-cards-desktop.png"), full_page=True)
    card.get_by_role("button", name="Telegram", exact=True).click()
    expect(page.get_by_label("Texto da divulgação")).to_have_value(
        "Tenis esportivo vermelho\n\nR$\u00a093,09\n\nhttps://s.shopee.com.br/test-offer")
    page.get_by_label("Destino Telegram").select_option(
        "22222222-2222-4222-8222-222222222222")
    page.get_by_role("button", name="Agendar no Telegram", exact=True).click()
    expect(page.get_by_label("Texto da divulgação")).to_have_value("")
    assert len(submitted) == 1 and submitted[0]["productId"] == PRODUCT_ID
    page.get_by_role("button", name="Produtos", exact=True).click()
    page.set_viewport_size({"width": 390, "height": 844})
    page.get_by_test_id("product-card").nth(3).scroll_into_view_if_needed()
    page.wait_for_function(
        "Math.abs(document.querySelector('.divulgador-lookup-bar').getBoundingClientRect().top) < 2")
    assert not page.evaluate(
        "document.documentElement.scrollWidth > innerWidth")
    page.screenshot(
        path=str(SHOTS / "product-cards-mobile.png"), full_page=True)
    context.close()
    print("PASS product cards: sticky lookup desktop/mobile, fractional commission, automatic API price/base layout, no manual promotion fields, disabled future platforms, Telegram review and schedule")


def verify_week_defaults(browser):
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    context.add_init_script("localStorage.setItem('ppv:skipped','true')")
    page = context.new_page()
    page.goto(APP_URL + "/#/progresso?aba=planilha")
    page.get_by_label("Escolher planilha Excel ou CSV", exact=True).set_input_files({
        "name": "semana.csv", "mimeType": "text/csv", "buffer": b"Semana;Produto\nSemana 5;Antigo\n;Novo\n"
    })
    page.get_by_role("dialog").get_by_role(
        "button", name="Importar", exact=True).click()
    today = datetime.date.today()
    label = f"Semana {today.isocalendar().week}"
    expect(page.get_by_label("Semana, linha 1", exact=True)
           ).to_have_value("Semana 5")
    expect(page.get_by_label("Semana, linha 2", exact=True)).to_have_value(label)
    page.get_by_role("button", name="Linha", exact=True).click()
    expect(page.get_by_label("Semana, linha 3", exact=True)).to_have_value(label)
    page.reload()
    expect(page.get_by_label("Semana, linha 3", exact=True)).to_have_value(label)
    page.screenshot(path=str(SHOTS / "week-defaults.png"), full_page=True)
    context.close()
    print("PASS weekly spreadsheet: local ISO week in empty/new cells, historical values preserved, reload persists")


def main():
    state = {"settings": None, "selections": []}
    writes = []
    errors = []

    def handle_api(route):
        request = route.request
        parsed = urlparse(request.url)
        path = parsed.path.removeprefix("/api")
        body = request.post_data_json if request.post_data else None
        result = []
        status = 200
        if path == "/auth/session":
            result = {"accessToken": "e2e-session",
                      "tokenType": "Bearer", "expiresIn": "12h"}
        elif path == "/products/shopee/status":
            result = {"configured": True}
        elif path == "/products":
            result = [PRODUCT]
        elif path == "/storefront":
            if request.method == "PUT":
                state["settings"] = body
                if not state["selections"] and body["autoPublish"]:
                    state["selections"] = [
                        {"productId": PRODUCT_ID, "featured": False, "clicks": 0}]
                writes.append(body)
            elif request.method == "DELETE":
                state["settings"] = None
                state["selections"] = []
            result = state
        elif path.startswith("/storefront/products/"):
            state["selections"] = [
                {"productId": PRODUCT_ID, "featured": body["featured"], "clicks": 0}] if body["included"] else []
            result = state
        elif path.startswith("/public/storefront/"):
            if not state["settings"] or not state["settings"]["published"]:
                status = 404
                result = {"message": "Este site nao esta publicado."}
            else:
                public = {key: value for key, value in state["settings"].items(
                ) if key not in ("published", "autoPublish")}
                offer = {**PRODUCT, "featured": bool(
                    state["selections"] and state["selections"][0]["featured"]), "clicks": 0}
                if "/products/" in path:
                    result = {"settings": public, "product": offer}
                else:
                    query = parse_qs(parsed.query)
                    search = query.get("search", [""])[0]
                    matches = search.lower() in PRODUCT["name"].lower()
                    included = bool(state["selections"])
                    result = {"settings": public, "products": [offer] if matches and included else [],
                              "featured": [offer] if offer["featured"] else [], "categories": ["Calcados"],
                              "total": 1 if matches and included else 0, "page": 1}
        route.fulfill(status=status, content_type="application/json",
                      body=json.dumps(result))

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        context = browser.new_context(viewport={"width": 1440, "height": 1000})
        context.route("**/api/**", handle_api)
        context.add_init_script("localStorage.setItem('ppv:skipped','true')")
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(APP_URL + "/#/divulgador")
        page.get_by_label("Senha do painel").fill("e2e-only-password")
        page.get_by_role("button", name="Entrar", exact=True).click()
        page.get_by_role("button", name="Site de Promoções",
                         exact=True).click()
        page.get_by_label("Nome do site", exact=True).fill("Achados do Dia")
        page.get_by_label("Endereço do site", exact=True).fill(
            "achados-do-dia")
        page.get_by_label("Descrição", exact=True).fill(
            "Ofertas selecionadas para o seu dia a dia.")
        page.get_by_label("Grupo ou canal Telegram").fill(
            "https://t.me/achados_teste")
        page.get_by_role("button", name="Criar site", exact=True).click()
        expect(page.get_by_text("Rascunho", exact=True)).to_be_visible()
        page.get_by_label("Destaque", exact=True).click()
        expect(page.get_by_label("Destaque", exact=True)).to_be_checked()
        page.get_by_role("button", name="Adicionar banner", exact=True).click()
        page.get_by_label("Imagem do banner 1 (HTTPS)",
                          exact=True).fill(PRODUCT["imageUrl"])
        page.get_by_label("Título", exact=True).fill("Ofertas da semana")
        page.get_by_label("Link do banner", exact=True).fill(
            "https://t.me/achados_teste")
        page.get_by_label("Site público", exact=True).check()
        page.get_by_role("button", name="Salvar site", exact=True).click()
        expect(page.get_by_text("Publicado", exact=True)).to_be_visible()
        assert writes[-1]["banners"][0]["title"] == "Ofertas da semana"
        page.get_by_role("button", name="Prévia", exact=True).click()
        expect(page.locator(".sf-preview .sf-card")).to_have_count(2)
        page.screenshot(path=str(SHOTS / "editor-desktop.png"), full_page=True)

        public = context.new_page()
        public.goto(APP_URL + "/#/ofertas/achados-do-dia")
        expect(public.get_by_role(
            "heading", name="Achados do Dia", exact=True)).to_be_visible()
        assert public.get_by_label("Senha do painel").count() == 0
        expect(public.locator(".sf-discount").first).to_have_text("40% OFF")
        public.locator(".sf-product-image img").first.wait_for()
        public.wait_for_function(
            "[...document.querySelectorAll('.sf-product-image img')].every(image => image.complete && image.naturalWidth > 0)", timeout=20000)
        assert not public.evaluate(
            "document.documentElement.scrollWidth > innerWidth")
        public.screenshot(
            path=str(SHOTS / "public-desktop.png"), full_page=True)
        public.get_by_role("textbox", name="Buscar promoções",
                           exact=True).fill("inexistente")
        public.get_by_role(
            "button", name="Buscar promoções", exact=True).click()
        expect(public.get_by_text(
            "Nenhuma promoção disponível para esses filtros.", exact=True)).to_be_visible()
        public.get_by_role(
            "textbox", name="Buscar promoções", exact=True).fill("")
        public.get_by_role(
            "button", name="Buscar promoções", exact=True).click()
        public.get_by_role("link", name="Ver promoção",
                           exact=False).first.click()
        expect(public).to_have_url(
            APP_URL + "/#/ofertas/achados-do-dia/" + PRODUCT_ID)
        expect(public.get_by_role(
            "heading", name=PRODUCT["name"], exact=True, level=1)).to_be_visible()
        assert public.get_by_role("link", name="Ver na loja").get_attribute(
            "href").endswith("/visit")
        public.screenshot(
            path=str(SHOTS / "detail-desktop.png"), full_page=True)
        public.set_viewport_size({"width": 390, "height": 844})
        assert not public.evaluate(
            "document.documentElement.scrollWidth > innerWidth")
        public.screenshot(
            path=str(SHOTS / "detail-mobile.png"), full_page=True)
        public.get_by_role("link", name="Todas as promoções",
                           exact=False).click()
        expect(public.locator(".sf-card")).to_have_count(2)
        public.screenshot(
            path=str(SHOTS / "public-mobile.png"), full_page=True)
        assert not public.evaluate(
            "document.documentElement.scrollWidth > innerWidth")
        public.get_by_role("button", name="Fechar convite Telegram").click()
        expect(public.locator(".sf-telegram")).to_have_count(0)
        page.set_viewport_size({"width": 390, "height": 844})
        page.get_by_role("button", name="Fechar prévia", exact=True).click()
        page.screenshot(path=str(SHOTS / "editor-mobile.png"), full_page=True)
        assert not page.evaluate(
            "document.documentElement.scrollWidth > innerWidth")
        page.get_by_label("Site público", exact=True).uncheck()
        page.get_by_role("button", name="Salvar site", exact=True).click()
        expect(page.get_by_text("Rascunho", exact=True)).to_be_visible()
        public.reload()
        expect(public.get_by_role(
            "heading", name="Site indisponível")).to_be_visible()
        page.get_by_role("button", name="Excluir site", exact=True).click()
        page.get_by_role("dialog").get_by_role(
            "button", name="Excluir site", exact=True).click()
        expect(page.get_by_role(
            "button", name="Criar site", exact=True)).to_be_visible()
        page.get_by_role("button", name="Produtos", exact=True).click()
        expect(page.get_by_text(PRODUCT["name"], exact=True)).to_be_visible()
        assert not errors, errors
        verify_product_cards(browser)
        verify_week_defaults(browser)
        browser.close()
    print("PASS storefront: editor, draft/publish, banners, featured, public access, search, detail, images, mobile, unpublish, delete preserves products")
    print("Screenshots:", SHOTS)


if __name__ == "__main__":
    main()
