# Testes de navegador do projeto `prompt-para-video`

Estes scripts **não fazem parte do zip do projeto**. Eles simulam um usuário no navegador (Playwright). Todos usam a **API do Google simulada** (`page.route`), nunca uma chave real.

## Requisitos
Node 22 e `npm ci` no projeto, Python 3 com `playwright` e o Chromium instalado, `ffmpeg` (com `libvpx-vp9`) e `Pillow`. Para `e2e_a11y.py`: `npm i axe-core` numa pasta à parte e `AXE_JS=<caminho>/node_modules/axe-core/axe.min.js`.

## Antes de usar em outro ambiente: ajuste os caminhos fixos
- `ROOT="/home/claude/ppv"` (pasta do projeto) nos `run_*.py`.
- `PLAYWRIGHT_BROWSERS_PATH="/opt/pw-browsers"` e as pastas de saída das capturas (`/mnt/user-data/outputs/prints`).
- Portas fixas: 5190 a 5320. **`e2e.py` e `e2e_video.py` têm a porta 5193 fixa**: troque com
  `sed 's#127.0.0.1:[0-9]\{4\}#127.0.0.1:SUAPORTA#g' e2e.py > /tmp/e2e.py`. Os demais leem a variável `APP_URL`.

## O que cada um faz
| Script | Como rodar | Cobre |
| --- | --- | --- |
| `e2e_storefront.py` | `APP_URL=http://localhost:PORTA python e2e_storefront.py` (Playwright Python e Chrome instalado) | v39: site de promoções, rascunho/publicação, banners, destaques, acesso público sem login, busca, detalhes, imagens, desktop/mobile, despublicação e exclusão preservando produtos. API simulada; capturas em `%TEMP%/prompt-storefront-shots` ou `SHOTS_DIR`. |
| `run_media_tests.py` | `python3 run_media_tests.py` (~4 min; em segundo plano) | **Bateria principal.** Cria arquivos de exemplo em `public/media`, roda `e2e_media3.py` e `e2e_trendly2.py` no servidor de desenvolvimento e em produção, testa um **subcaminho** como o do GitHub Pages, apaga os exemplos e refaz o build limpo. Termina com "RESULTADO FINAL: TUDO OK". |
| `e2e.py`, `e2e_video.py` | `APP_URL` fixo; precisam de `npm run build` + `npm run preview` | Painel (6 cards, menu enxuto) e página Geradores de Prompt, ferramentas de IA, prompts prontos pela Galeria, upload de vídeo da Autoanálise |
| `run_galeria.py` (+ `e2e_galeria.py`) | `python3 run_galeria.py` (cria vídeos de exemplo em `public/media/gallery` e apaga no fim) | **Galeria de Prompts** (127 prompts) em 2500 × 1260: menu, rotas antigas, layout, cards novos da pasta de mídia, filtros, favoritos, copiar, lápis, detalhes, edição, **prompts prontos** (3 coleções, pastas, Novo prompt, excluir), compatibilidade com edições e favoritos antigos, Mapa de mídia, celular |
| `run_veo.py` (+ `e2e_veo.py`) | `python3 run_veo.py` (faz o build e usa o preview) | **Vídeos do TikTok** pela Galeria em 2500 × 1260: largura, colunas, detalhes em português, área de montagem, clipes extras com fala, foto da cena, persistência, IA, celular |
| `e2e_v23.py` | `APP_URL=http://localhost:PORTA python3 e2e_v23.py` com `npx vite --port PORTA` aberto (reinicie o servidor se mudar a versão do `package.json`) | **v23/v24:** filtros combinados da Galeria (número = resultado, faixa Filtros ligados), painel novo (resumo, Continue de onde parou, atalhos), menu enxuto, Geradores de Prompt (9 geradores, rotas antigas), nome Tendências, **lápis nos títulos** (renomear, restaurar, em branco, Esc, 4 tipos de prompt e prompt do usuário), **Diagnóstico** (erro de tela, envio, Gemini com chave dentro da mensagem, relatório sem chave, limpar). Gemini simulado |
| `e2e_progresso.py` | `APP_URL=http://localhost:PORTA python3 e2e_progresso.py` com `npx vite --port PORTA` aberto | **v26:** Progresso Semanal com 3 abas (posição no menu, marcar/desmarcar, dias futuros travados, persistência, semana anterior, metas: adicionar/renomear/mover/excluir, mapa do mês, tile no painel, importar/editar/exportar planilha colorida, relatórios Indicadores (cliques + comissão) e Itens com gráficos coloridos, relatórios guardados após F5, favoritos do painel, impressão, teclado nas abas, celular) |
| `e2e_mapa.py` | `APP_URL=http://localhost:PORTA python3 e2e_mapa.py` com `npx vite --port PORTA` aberto | **Lápis do Mapa de mídia**: grava em `public/media`, troca vídeo/imagem, recusa PDF, 403 sem cabeçalho e `..` |
| `e2e_novo_prompt.py` | `APP_URL=http://localhost:PORTA python3 e2e_novo_prompt.py` com `npx vite --port PORTA` aberto | Novo prompt com mídia, lápis de mídia no detalhe, botão Subir vídeo ou imagem, Mapa de mídia com prompts do usuário |
| `e2e_autoplay.py` | `APP_URL=http://localhost:PORTA python3 e2e_autoplay.py` com `npx vite --port PORTA` aberto; precisa de `/tmp/ta.webm` (vídeo com áudio: `ffmpeg -f lavfi -i testsrc=d=3:s=160x284 -f lavfi -i sine=d=3 -c:v libvpx-vp9 -c:a libopus -shortest /tmp/ta.webm`) | Vídeo **com áudio** toca sozinho no card e no detalhe, mesmo com autoplay restrito e "reduzir movimento"; botão Movimento liga/desliga |
| `e2e_userdata.py` | `APP_URL=http://localhost:PORTA python3 e2e_userdata.py` com `npx vite --port PORTA` aberto **dentro da pasta do projeto** | **Salvar no projeto**: grava `src/data/userData.json`, não vaza chave/histórico, segundo navegador limpo vê o prompt, conflito (usar a do projeto). Restaura o arquivo no fim |
| `e2e_publicado.py` | `APP_URL=http://localhost:PORTA python3 e2e_publicado.py` com `npm run build && npx vite preview --port PORTA`; precisa de `/tmp/t.webm` | **Site publicado**: o lápis baixa o arquivo com o nome certo, sem erro de seletor de pasta |
| `e2e_manequins.py` | `TEST_SCRIPT=e2e_manequins.py python3 run_veo.py` | Aba Manequins |
| `e2e_a11y.py` | `TEST_SCRIPT=e2e_a11y.py python3 run_veo.py` | **Acessibilidade (axe-core)** em 21 telas e 4 janelas, mais os títulos de aba. Falha com qualquer violação |
| `run_vi.py` (+ `e2e_vi.py`) | `python3 run_vi.py` | Imagem **ou** vídeo, autoplay, aviso de codec |
| `run_hm.py` (+ `e2e_hm.py`) | `python3 run_hm.py` | Humanizar IA |
| `run_layout.py` (+ `e2e_layout.py`) | `python3 run_layout.py` | 18 rotas em 2500 × 1260 e 1366 × 900: conteúdo ocupa toda a largura, sem rolagem lateral |
| `shots_*.py`, `run_hm_shots.py`, `run_galeria_shots.py` | `TEST_SCRIPT=shots_prontos.py python3 run_veo.py` etc. | Capturas de tela (os antigos `shots_ai`, `shots_clips`, `shots_wide` e `shots_veo` foram removidos: apontavam para cards que não existem mais) |

## Armadilhas já conhecidas
- Matar servidores antigos **por PID**: `pkill -f <padrão>` mata o próprio comando se o padrão estiver na linha dele.
- Um servidor antigo na mesma porta dá "ALL OK" falso: use porta nova e `--strictPort`.
- As baterias que criam arquivos em `public/media` (`run_media_tests`, `run_vi`, `run_hm`, `run_layout`, `run_galeria`) **não podem rodar ao mesmo tempo**.
- O Chromium de teste **não toca H.264**: para checar reprodução use WebM (VP9).
- Esperar a condição, não um tempo fixo. `wait_for_function` não funciona com a CSP do app; use `locator.evaluate`.
- `has-text` casa por trecho e sem diferenciar maiúsculas ("Vídeo" também casa com "Prompts dos Vídeos do TikTok"): use regex ancorada ou `get_by_role(..., exact=True)`.
- A galeria mostra 60 cards por vez: filtre a coleção antes de procurar um card.
- Os filtros voltam ao padrão ao recarregar a página.
- Quem renomeia uma classe de card ou muda o nível de um título precisa atualizar os testes que a usam.
- No terminal, `cut -c1-N` quebra acentos: corte em Python.
