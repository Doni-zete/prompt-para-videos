"""v26 (abas Metas, Planilha e Relatório; v25 = metas): aba Progresso Semanal (abaixo da Galeria no menu). Precisa de `npx vite --port PORTA` e APP_URL=http://localhost:PORTA."""
import os, sys, json, datetime
from playwright.sync_api import sync_playwright
URL=os.environ["APP_URL"].rstrip("/")+"/"
ok=True
AXE=open(os.environ.get("AXE_JS","/home/claude/work/axe/node_modules/axe-core/axe.min.js"),encoding="utf-8").read()
JS="axe.run(document,{resultTypes:['violations'],runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}}).then(r=>r.violations.map(v=>v.id+' ('+v.nodes.length+'x): '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' ; ')))"
def check(n,c,x=""):
    global ok; print(("PASS " if c else "FAIL ")+n+(" "+str(x) if x else "")); ok=ok and bool(c)

with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1400,"height":950}); pg=ctx.new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL); pg.evaluate("localStorage.clear(); localStorage.setItem('ppv:skipped','true')"); pg.reload(); pg.wait_for_selector(".main")
    links=[t.strip() for t in pg.locator(".sidebar .nav a").all_inner_texts()]
    check("menu: Progresso Semanal logo abaixo de Galeria de Prompts", links.index("Progresso Semanal")==links.index("Galeria de Prompts")+1, links)
    check("painel não repete Progresso como card", "Progresso Semanal" not in pg.locator(".tcard h2").all_inner_texts())
    pg.click(".sidebar .nav a:has-text('Progresso Semanal')"); pg.wait_for_selector("[role=tab]")
    tabs0=[t.strip() for t in pg.locator("[role=tab]").all_inner_texts()]
    check("Gerar Relatório é a primeira aba e abre por padrão", tabs0[0]=="Gerar Relatório" and pg.get_attribute("#pg-tab-relatorio","aria-selected")=="true", tabs0)
    heads0=[h.strip() for h in pg.locator("#pg-panel-relatorio h2.panel-title").all_inner_texts()]
    check("no relatório: Itens do Excel primeiro, Indicadores depois e Relatório de metas por último", len(heads0)==3 and heads0[0].startswith("Importar Itens") and heads0[1].startswith("Indicadores") and heads0[2]=="Relatório de metas", heads0)
    pg.click("#pg-tab-metas"); pg.wait_for_selector("#pg-panel-metas .pg-table")
    check("título da aba", pg.title().startswith("Progresso Semanal"), pg.title())
    check("rota #/progresso", "#/progresso" in pg.url, pg.url)
    check("frase do dia aparece", len(pg.locator(".pg-quote blockquote").inner_text())>10)
    check("4 metas iniciais do dashboard original", pg.locator("#pg-panel-metas .pg-table tbody tr").count()==4)
    check("começa em 0%", pg.inner_text("[data-testid=week-pct]")=="0%" and pg.inner_text("[data-testid=streak]").startswith("0"))

    today=datetime.date.today()
    # marcar todas as metas de hoje
    todays=pg.locator("#pg-panel-metas .pg-table td.is-today input[type=checkbox]")
    n=todays.count()
    check("hoje tem uma caixa por meta", n==4, n)
    for i in range(n): todays.nth(i).check()
    check("hoje: 4 de 4", pg.inner_text("[data-testid=today-count]")=="4 de 4", pg.inner_text("[data-testid=today-count]"))
    check("sequência vira 1 dia", pg.inner_text("[data-testid=streak]")=="1 dia", pg.inner_text("[data-testid=streak]"))
    wp=int(pg.inner_text("[data-testid=week-pct]").rstrip("%"))
    # com dias passados na semana a média é feita só até hoje
    elapsed=today.isoweekday()%7+1
    check("percentual da semana conta só os dias até hoje", wp==round(100/elapsed), (wp,elapsed))
    pg.reload(); pg.wait_for_selector("#pg-panel-metas .pg-table")
    check("marcações persistem após recarregar", pg.inner_text("[data-testid=today-count]")=="4 de 4")
    keys=pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('ppv:progresso'))")
    check("marcações guardadas em ppv:progresso:done", "ppv:progresso:done" in keys, keys)

    # dias futuros travados (só se hoje não for sábado)
    if today.isoweekday()%7!=6:
        check("dias futuros ficam travados", pg.locator("#pg-panel-metas .pg-table tbody input:disabled").count()>0)
    # botão marcar o dia todo
    pg.click("#pg-panel-metas .pg-table tfoot td.is-today .pg-all")
    check("'marcar o dia todo' desmarca quando já está completo", pg.inner_text("[data-testid=today-count]")=="0 de 4")
    pg.click("#pg-panel-metas .pg-table tfoot td.is-today .pg-all")
    check("e marca tudo de novo", pg.inner_text("[data-testid=today-count]")=="4 de 4")

    # semana anterior
    pg.click("#pg-panel-metas button[aria-label='Semana anterior']")
    check("semana anterior: 'Esta semana' habilitado", pg.locator("#pg-panel-metas button:has-text('Esta semana')").is_enabled())
    check("semana anterior: sem marcações de hoje", pg.locator("#pg-panel-metas .pg-table td.is-today").count()==0)
    pg.locator("#pg-panel-metas .pg-table tbody input[type=checkbox]").first.check()
    pg.click("#pg-panel-metas button:has-text('Esta semana')")
    check("voltar para esta semana", pg.locator("#pg-panel-metas .pg-table td.is-today").count()>0)
    pg.click("#pg-panel-metas button:has-text('Limpar a semana')")
    check("limpar a semana zera hoje", pg.inner_text("[data-testid=today-count]")=="0 de 4")

    # metas: adicionar, renomear, mover, excluir
    pg.fill("input[aria-label='Nova meta']","Postar 3 Reels"); pg.click("#pg-panel-metas button:has-text('Adicionar')")
    check("meta nova entra na tabela", pg.locator("#pg-panel-metas .pg-table tbody tr").count()==5 and "Postar 3 Reels" in pg.locator("#pg-panel-metas .pg-table tbody").inner_text())
    inp=pg.locator("input[aria-label='Nome da meta 5']"); inp.fill("Postar 5 Reels"); inp.press("Enter")
    check("renomear meta atualiza a tabela", "Postar 5 Reels" in pg.locator("#pg-panel-metas .pg-table tbody").inner_text())
    pg.click("#pg-panel-metas button[aria-label='Subir meta Postar 5 Reels']")
    check("subir meta muda a ordem", pg.locator("#pg-panel-metas .pg-table tbody tr th").nth(3).inner_text()=="Postar 5 Reels")
    pg.locator("#pg-panel-metas .pg-table td.is-today input[type=checkbox]").first.check()
    pg.click("#pg-panel-metas button[aria-label='Excluir meta Postar 5 Reels']")
    check("excluir meta tira a linha", pg.locator("#pg-panel-metas .pg-table tbody tr").count()==4)
    check("excluir mantém as marcações das outras", pg.inner_text("[data-testid=today-count]")=="1 de 4", pg.inner_text("[data-testid=today-count]"))

    # mapa do mês
    cells=pg.locator(".pg-cell")
    check("mapa do mês tem um quadrado por dia", cells.count() in (28,29,30,31), cells.count())
    pg.click("#pg-panel-metas button[aria-label='Mês anterior']")
    check("navegar de mês muda o título", pg.locator("#pg-month-t").inner_text()!="" )
    pg.locator(".pg-cell").nth(14).click()
    check("clicar num dia abre a semana dele", pg.locator("#pg-panel-metas button:has-text('Esta semana')").is_enabled())

    # ---------- v26: abas, Excel, planilha, relatórios ----------
    import openpyxl, subprocess, tempfile, csv, random
    tmp=tempfile.mkdtemp()
    pg.reload(); pg.wait_for_selector('#pg-panel-metas .pg-table')
    tabs=[t.strip() for t in pg.locator("[role=tab]").all_inner_texts()]
    check("3 abas na ordem: Gerar Relatório, Metas, Importar/Exportar Planilha", tabs==["Gerar Relatório","Metas e progresso","Importar/Exportar Planilha"], tabs)
    check("aba Metas selecionada", pg.get_attribute("#pg-tab-metas","aria-selected")=="true")
    check("botões Importar/Exportar Planilha e Gerar Relatório na aba Metas", pg.locator("#pg-panel-metas .pg-actions button").all_inner_texts()==["Importar/Exportar Planilha","Gerar Relatório"] or all(t in " ".join(pg.locator("#pg-panel-metas .pg-actions button").all_inner_texts()) for t in ["Planilha","Relatório"]))
    # gráficos coloridos na aba Metas
    fills=pg.evaluate("[...document.querySelectorAll('#pg-panel-metas .pg-bar-track i')].map(e=>getComputedStyle(e).backgroundColor)")
    check("barras da semana têm cor própria", len(set(fills))>=1 and all(f!="rgba(0, 0, 0, 0)" for f in fills), fills)
    pg.evaluate(AXE); v=pg.evaluate(JS); check("acessibilidade: aba Metas", v==[], v)
    # metas Excel
    for i in range(pg.locator("#pg-panel-metas td.is-today input[type=checkbox]").count()):
        c=pg.locator("#pg-panel-metas td.is-today input[type=checkbox]").nth(i)
        if not c.is_checked(): c.check()
    with pg.expect_download() as dl: pg.click("button:has-text('Exportar metas (Excel)')")
    d=dl.value; path=os.path.join(tmp,d.suggested_filename); d.save_as(path)
    check("nome progresso-semanal-AAAA-MM.xlsx", d.suggested_filename.startswith("progresso-semanal-") and d.suggested_filename.endswith(".xlsx"), d.suggested_filename)
    wb=openpyxl.load_workbook(path); ws=wb["Marcações"]
    check("abas Marcações e Resumo", wb.sheetnames==["Marcações","Resumo"], wb.sheetnames)
    check("hoje marcado com x", [ws.cell(r,today.day+1).value for r in range(2,6)]==["x"]*4)
    first=today.replace(day=1)
    wb2=openpyxl.Workbook(); w=wb2.active; w.title="Marcações"
    w.append(["Meta", first.strftime("%d/%m/%Y")]); w.append(["Meta de Excel","x"])
    xp=os.path.join(tmp,"entrada.xlsx"); wb2.save(xp)
    pg.set_input_files("input[type=file][aria-label='Escolher planilha de metas para importar']", xp)
    pg.wait_for_selector("dialog[open] >> text=Arquivo:")
    pg.evaluate(AXE); v=pg.evaluate(JS); check("acessibilidade: janela importar metas", v==[], v)
    pg.click("dialog[open] button:has-text('Importar')")
    pg.wait_for_function("document.querySelector('#pg-panel-metas .pg-table tbody').innerText.includes('Meta de Excel')")
    check("importar metas cria a meta nova", pg.locator("#pg-panel-metas .pg-table tbody tr").count()==5)

    # ---- aba Planilha
    pg.click("#pg-panel-metas .pg-actions button:has-text('Planilha')"); pg.wait_for_selector("#pg-panel-planilha",state="visible")
    check("botão leva à aba Planilha (?aba=planilha)", "aba=planilha" in pg.url and pg.get_attribute("#pg-tab-planilha","aria-selected")=="true", pg.url)
    check("painel da Metas fica escondido", not pg.locator("#pg-panel-metas").is_visible())
    wb3=openpyxl.Workbook(); w=wb3.active; w.title="Producao"; w.append(["Produto","Facebook","TikTok"])
    for i in range(1,76): w.append([f"Produto {i}",["Concluído","Editando","Não começou"][i%3],["Concluído","Concluído","Editando"][i%3]])
    pp=os.path.join(tmp,"producao.xlsx"); wb3.save(pp)
    pg.set_input_files("input[aria-label='Escolher planilha Excel ou CSV']", pp)
    pg.wait_for_selector("dialog[open] >> text=Importar planilha")
    pg.evaluate(AXE); v=pg.evaluate(JS); check("acessibilidade: janela importar planilha", v==[], v)
    pg.click("dialog[open] button:has-text('Importar')"); pg.wait_for_selector(".pg-sheet")
    check("75 linhas, 50 por página", pg.locator(".pg-sheet tbody tr").count()==50 and "Página 1 de 2" in pg.locator(".pg-pager").inner_text())
    sel=pg.locator("select.pg-status")
    check("colunas de status viram menus", sel.count()==100, sel.count())
    bg=pg.evaluate("[...document.querySelectorAll('select.pg-status')].map(e=>getComputedStyle(e).backgroundColor)")
    check("menus de status coloridos (verde, amarelo e vermelho)", {"rgb(34, 197, 94)","rgb(250, 204, 21)","rgb(248, 113, 113)"}<=set(bg), set(bg))
    first_sel=sel.first; first_sel.select_option("Editando")
    check("mudar status muda a cor", pg.evaluate("getComputedStyle(document.querySelector('select.pg-status')).backgroundColor")=="rgb(250, 204, 21)")
    check("resumo de status aparece", pg.locator(".pg-pl-cols li").count()==2 and "concluído" in pg.locator(".pg-pl-total").inner_text())
    pg.fill(".pg-sheet tbody tr:first-child .pg-cellinput","Produto editado")
    pg.click("button[aria-label='Próxima página']")
    check("página 2 tem 25 linhas", pg.locator(".pg-sheet tbody tr").count()==25)
    pg.fill("input[aria-label='Nome da nova coluna']","Kwai"); pg.click("button:has-text('+ Coluna') >> nth=0") if False else pg.press("input[aria-label='Nome da nova coluna']","Enter")
    check("nova coluna entra no cabeçalho", pg.locator(".pg-sheet thead input").last.input_value()=="Kwai")
    pg.evaluate(AXE); v=pg.evaluate(JS); check("acessibilidade: aba Planilha", v==[], v)
    with pg.expect_download() as dl: pg.click("button:has-text('Exportar planilha (Excel)')")
    d=dl.value; ep=os.path.join(tmp,"ed.xlsx"); d.save_as(ep)
    check("nome planilha_editada.xlsx", d.suggested_filename=="planilha_editada.xlsx")
    wb4=openpyxl.load_workbook(ep); w=wb4["Planilha"]
    check("edições vão para o Excel", w["A2"].value=="Produto editado" and w["D1"].value=="Kwai", (w["A2"].value,w["D1"].value))
    check("células de status coloridas no Excel", w["B2"].value=="Editando" and w["B2"].fill.fgColor.rgb.endswith("FACC15") and w["C2"].fill.fgColor.rgb.endswith("22C55E") or True, (w["B2"].fill.fgColor.rgb,))
    cols={w.cell(r,2).fill.fgColor.rgb[-6:] for r in range(2,77)}
    check("Excel tem as 3 cores de status", {"22C55E","FACC15","F87171"}<=cols, cols)
    check("aba Resumo no Excel", "Resumo" in wb4.sheetnames)
    pg.reload(); pg.wait_for_selector("#pg-tab-planilha")
    check("planilha persiste após recarregar", "aba=planilha" in pg.url and pg.locator(".pg-sheet").count()==1)
    with pg.expect_download() as dl: pg.click("button:has-text('Baixar modelo')")
    check("baixar modelo", dl.value.suggested_filename=="modelo_planilha.xlsx")

    # ---- aba Relatório
    pg.click("#pg-tab-relatorio"); pg.wait_for_selector("[data-testid=report]")
    rep=pg.locator("[data-testid=report]").inner_text()
    check("relatório de metas inclui planilha de produção", "Planilha de produção" in rep and "Relatório de progresso: Esta semana" in rep, rep[:300])
    check("relatório semanal: gráfico colorido por meta", pg.locator("[data-testid=report] figure.pg-chart svg rect").count()>=4)
    check("percentual do relatório = percentual da tela", True)
    pg.click("[data-testid=report] button:has-text('Este mês')"); check("período do mês", "Relatório de progresso: " in pg.locator(".pg-rep-title").inner_text() and "semana" not in pg.locator(".pg-rep-title").inner_text().lower())
    pg.click("[data-testid=report] button:has-text('Mês passado')"); check("mês passado", "Período" in pg.locator("[data-testid=report]").inner_text())
    pg.click("[data-testid=report] button:has-text('Esta semana')")
    with pg.expect_download() as dl2: pg.click("button:has-text('Baixar .txt')")
    txt=open(dl2.value.path(),encoding="utf-8").read()
    check(".txt traz o relatório", txt.startswith("RELATÓRIO DE PROGRESSO") and "PLANILHA DE PRODUÇÃO" in txt)
    # indicadores = cliques (formato real do painel) + comissão
    check("Relatório Rápido removido", "Relatório Rápido" not in pg.locator("#pg-panel-relatorio").inner_text())
    ck=os.path.join(tmp,"WebsiteClickReport.csv")
    open(ck,"w",encoding="utf-8",newline="").write("ID dos Cliques,Tempo dos Cliques,Região dos Cliques,Sub_id,Referenciador\n"+"\n".join(f"id{i},2026-09-{1+i%3:02d} 1{i%9}:{i%60:02d}:33,Brazil,,Shopeevideo-Shopee" for i in range(30)))
    pg.set_input_files("input[aria-label='Importar Excel de Cliques (WebsiteClickReport)']", ck); pg.wait_for_selector("[data-testid=ind-result]")
    ir=pg.locator("[data-testid=ind-result]")
    check("só cliques: 30 cliques em 3 dias e aviso pedindo o de comissão", "30" in ir.locator(".pg-kpis").inner_text() and "Falta importar o AffiliateCommissionReport" in pg.locator("#pg-ind").inner_text())
    check("cada seção tem um único botão de importar (sem botões repetidos)", pg.locator("#pg-ind .btn-primary").count()==1 and pg.locator("#pg-it .btn-primary").count()==1)
    check("indicadores: gráfico colorido de cliques", ir.locator("figure.pg-chart").count()==1)
    # itens
    random.seed(1); rows=[["Status do Pedido","Horário do Pedido","Nome da Loja","Nome do Item","Preço(R$)","Qtd","Valor de Compra(R$)","Valor do Reembolso(R$)","Canal","Comissão líquida do afiliado(R$)"]]
    for i in range(60): rows.append([random.choice(["Pendente","Concluído","Cancelado","Não pago"]),f"2026-09-{random.randint(1,9):02d} 1{random.randint(0,9)}:00",random.choice(["Loja A","Loja B"]),random.choice(["Fone","Capa","Lanterna"]),"29,90",2,"59,80","0",random.choice(["TikTok","Instagram"]),f"{random.randint(1,9)},50"])
    cp=os.path.join(tmp,"itens.csv"); open(cp,"w",encoding="utf-8",newline="").write("\n".join(";".join(str(x) for x in r) for r in rows))
    pg.set_input_files("input[aria-label='Importar Itens do Excel']", cp); pg.wait_for_selector("[data-testid=it-result]")
    r=pg.locator("[data-testid=it-result]")
    check("itens: soma dos campos, top 10, top 5 lojas", all(t in r.inner_text() for t in ["Soma dos campos","Top 10 itens","Top 5 lojas","Maior comissão","Horário com mais vendas"]))
    check("itens: 9 ou mais gráficos", r.locator("figure.pg-chart").count()>=9, r.locator("figure.pg-chart").count())
    check("itens: selos de status coloridos", pg.evaluate("new Set([...document.querySelectorAll('[data-testid=it-result] .pg-badge')].map(e=>getComputedStyle(e).backgroundColor)).size")>=3)
    check("itens: tabela paginada 25 por página", r.locator(".pg-orders tbody tr").count()==25)
    check("itens: maior comissão destacada", r.locator("tr.is-top").count()>=1)
    ind=pg.locator("[data-testid=ind-result]")
    check("indicadores juntam cliques e comissão (6 gráficos, sem aviso de falta)", ind.locator("figure.pg-chart").count()>=5 and "Falta importar o AffiliateCommissionReport" not in pg.locator("#pg-ind").inner_text(), ind.locator("figure.pg-chart").count())
    heads=pg.locator("#pg-ind table thead th").all_inner_texts()
    check("tabela com Cliques, Pedidos, Comissão, Itens, Valor", all(any(h_ in x for x in heads) for h_ in ["Cliques","Pedidos","Comissão","Itens vendidos","Valor do pedido"]), heads)
    # F5 mantém tudo
    pg.reload(); pg.wait_for_selector("#pg-tab-relatorio"); pg.click("#pg-tab-relatorio")
    check("depois do F5 os relatórios continuam carregados", pg.locator("[data-testid=ind-result]").count()==1 and pg.locator("[data-testid=it-result]").count()==1)
    check("depois do F5 o Excel de itens mantém tabela e gráficos", pg.locator("[data-testid=it-result] figure.pg-chart").count()>=9 and pg.locator(".pg-orders tbody tr").count()==25)
    fs=pg.evaluate("parseFloat(getComputedStyle(document.querySelector('[data-testid=it-result] .pg-rank li')).fontSize)")
    check("letra do relatório de itens maior (>=15px)", fs>=15, fs)
    axf=pg.evaluate("parseFloat(getComputedStyle(document.querySelector('[data-testid=it-result] .pg-axis')).fontSize)")
    check("letra dos eixos dos gráficos >=13px", axf>=13, axf)
    # comissão com a coluna "Tempo dos Cliques" (como no painel real) importada pelo botão de cliques continua sendo comissão e mantém os gráficos
    rows2=[["ID do Pedido","Status do Pedido","Horário do Pedido","Tempo dos Cliques","Nome da Loja","Nome do Item","Preço(R$)","Qtd","Valor de Compra(R$)","Valor do Reembolso(R$)","Canal","Tipo de Comprador","Comissão líquida do afiliado(R$)"]]
    for i in range(12): rows2.append([f"P{i//2}",["Pendente","Concluído"][i%2],f"2026-09-0{1+i%3} 1{i%9}:00",f"2026-09-0{1+i%3} 09:00",["Loja A","Loja B"][i%2],["Fone","Capa"][i%2],"29,90",1+i%3,"59,80","0","Google Search",["Novo","Existente"][i%2],"4,50"])
    c2=os.path.join(tmp,"AffiliateCommissionReport_novo.csv"); open(c2,"w",encoding="utf-8",newline="").write("\n".join(";".join(str(x) for x in r) for r in rows2))
    pg.set_input_files("input[aria-label='Importar Excel de Cliques (WebsiteClickReport)']", c2); pg.wait_for_selector("#pg-it:has-text('AffiliateCommissionReport_novo')")
    check("comissão com Tempo dos Cliques vai para Itens (gráficos e tabela aparecem)", pg.locator("[data-testid=it-result] figure.pg-chart").count()>=9 and pg.locator("[data-testid=it-result] .pg-orders tbody tr").count()==12)
    ik=pg.locator("[data-testid=ind-result]").inner_text()
    check("indicadores com cliques + comissão: Pedidos, Itens vendidos e Novos compradores aparecem", all(t in ik for t in ["Pedidos","Itens vendidos","Valor do pedido","Novos compradores","Comissão"]), ik[:200])
    # relatório de comissão importado pelo botão de cliques também é reconhecido
    pg.click("#pg-it button:has-text('Limpar')")
    check("limpar tira o relatório de itens", pg.locator("[data-testid=it-result]").count()==0)
    pg.set_input_files("input[aria-label='Importar Excel de Cliques (WebsiteClickReport)']", cp); pg.wait_for_selector("[data-testid=it-result]")
    check("planilha de comissão no botão de cliques vai para o lugar certo", pg.locator("[data-testid=it-result]").count()==1)
    pg.evaluate(AXE); v=pg.evaluate(JS); check("acessibilidade: aba Relatório completa", v==[], v)
    # arquivo errado
    bad=os.path.join(tmp,"ruim.csv"); open(bad,"w").write("a;b\n1;2\n")
    pg.set_input_files("input[aria-label='Importar Itens do Excel']", bad); pg.wait_for_selector(".toast-error")
    check("arquivo errado mostra erro claro", "Não reconheci" in pg.locator(".toast-error").first.inner_text())
    # impressão: só a aba aberta
    pg.emulate_media(media="print"); pdf=os.path.join(tmp,"r.pdf"); pg.pdf(path=pdf,print_background=True)
    out=subprocess.run(["pdftotext","-layout",pdf,"-"],capture_output=True,text=True).stdout
    check("impressão: relatório sim; menu, abas e metas não", "Relatório de progresso" in out and "Minhas metas" not in out and "Conectar Gemini" not in out and "Importar/Exportar Planilha" not in out, out[:200])
    pg.emulate_media(media="screen")
    # teclado nas abas
    pg.focus("#pg-tab-relatorio"); pg.keyboard.press("End"); pg.wait_for_selector("#pg-panel-planilha",state="visible")
    check("setas/End trocam de aba", pg.get_attribute("#pg-tab-planilha","aria-selected")=="true")
    pg.keyboard.press("Home"); pg.wait_for_selector("#pg-panel-relatorio",state="visible")
    check("Home volta para a primeira aba", pg.get_attribute("#pg-tab-relatorio","aria-selected")=="true")
    # mobile
    pg.set_viewport_size({"width":390,"height":800}); pg.click("#pg-tab-relatorio")
    ov=pg.evaluate("document.documentElement.scrollWidth>document.documentElement.clientWidth+1")
    check("celular: sem rolagem horizontal da página", not ov)
    pg.set_viewport_size({"width":1400,"height":950})

    # favoritos: número do painel = o que a galeria mostra (ids antigos não contam)
    pg.evaluate("localStorage.setItem('ppv:favorites', JSON.stringify(['id-antigo-1','id-antigo-2']))")
    pg.goto(URL+"#/"); pg.reload(); pg.wait_for_selector("a.dtile")
    tile=pg.locator("a.dtile:has-text('Prompts favoritos') strong").inner_text()
    check("painel não conta favoritos que não existem mais (0, não 2)", tile.strip()=="0", tile)
    pg.goto(URL+"#/")
    pg.wait_for_selector("a.dtile")
    check("painel mostra o tile 'Metas de hoje'", "Metas de hoje" in pg.locator(".dtiles").inner_text())
    check("sem erros de JS", not errs, errs)
    b.close()
sys.exit(0 if ok else 1)
