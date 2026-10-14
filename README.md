# Prompt para Vídeo — TikTok Shop Creator

> **Ao atualizar de uma versão anterior, rode `npm install` antes de `npm run dev`** (a v26 trouxe a biblioteca `fflate`, usada para ler e gravar Excel).

Aplicação em **React + TypeScript + Vite** com geração de prompts usando o **Gemini gratuito** (Google AI Studio).
Não precisa de servidor: a chave fica no navegador e as chamadas vão direto ao Google.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

Outros comandos:

```bash
npm run build      # checa tipos e gera a pasta dist/
npm run preview    # serve o dist/ localmente
npm test           # testes unitários
npm run clean:stale  # apaga arquivos de versões antigas que sobraram na pasta
```

Para publicar, envie o conteúdo de `dist/` para Netlify, Vercel, Cloudflare Pages ou GitHub Pages
(o roteamento usa `#`, então não precisa configurar redirecionamentos).
**Não abra `dist/index.html` com duplo clique:** navegadores bloqueiam módulos em `file://`.

## Publicar no GitHub com deploy automático (CI/CD)

O projeto já traz o pipeline pronto em `.github/workflows/`:

| Arquivo | Quando roda | O que faz |
| --- | --- | --- |
| `ci.yml` | Pull Requests e pushes fora da `main` | `npm ci`, checagem de tipos, testes e build |
| `deploy.yml` | A cada push na `main` (ou manualmente) | Mesmas validações e, se tudo passar, publica no **GitHub Pages** |
| `dependabot.yml` | Semanal | Abre PRs de atualização de dependências e das actions |

**Se algo falhar (tipos, testes ou build), o site não é atualizado** e continua na última versão boa.

### Passo a passo (uma vez só)

1. No GitHub, crie um repositório **vazio** (sem README, sem .gitignore).
2. No terminal, dentro da pasta do projeto:

```bash
git init -b main          # pule se a pasta já for um repositório
git add .
git commit -m "feat: projeto inicial"
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
git push -u origin main
```

3. No GitHub: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
4. Abra a aba **Actions** e acompanhe o workflow "Deploy (GitHub Pages)". Ao terminar, o endereço aparece no
   job "Publicar" e em Settings > Pages: `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Pronto: a partir daí, **todo commit na `main` atualiza o site** em cerca de 1 a 2 minutos.

### Fluxo recomendado no dia a dia

```bash
git switch -c minha-melhoria      # trabalhe em uma branch
git add . && git commit -m "feat: ..." && git push -u origin minha-melhoria
# abra um Pull Request: o ci.yml valida; ao fazer merge na main, o deploy.yml publica
```

### Observações

- Se o primeiro deploy falhar com "Get Pages site failed", o passo 3 não foi feito.
- GitHub Pages em repositório **privado** exige plano pago do GitHub; em repositório público é gratuito. Confira os planos atuais.
- O site é 100% estático: a chave do Gemini nunca vai para o repositório (cada usuário cola a própria no navegador).
- O app usa rotas com `#` e caminhos relativos, então funciona em `usuario.github.io/repo/` sem configuração extra.
- Para rodar as mesmas checagens do CI antes de enviar: `npm run ci`.
- Se a pasta tiver arquivos de versões antigas (`src/App.jsx`, `src/main.jsx`, `src/data.js`, `src/styles.css`,
  `vite.config.js`), apague-os antes do primeiro commit. `npm run dev` e `npm run build` avisam quais são.

## Como conectar o Gemini

1. Abra https://aistudio.google.com/api-key e entre com sua conta Google.
2. Clique em **Criar chave de API** e copie a chave (começa com `AIza`).
3. Cole no app. Ao colar uma chave válida, ele conecta sozinho.

O Google não oferece login que entregue a chave a outro site, então o passo de colar é necessário uma única vez.
A chave é validada listando os modelos da conta e fica salva só neste navegador
(localStorage, ou sessionStorage se você desmarcar "Lembrar neste dispositivo").

## Ferramentas

| Ferramenta | O que faz |
| --- | --- |
| **Geradores de Prompt** (item do menu lateral, `#/geradores`) | Reúne todos os geradores de IA abaixo num só lugar. Os endereços antigos `#/ferramenta/<id>` continuam valendo |
| POV, UGC, Influencer | Prompts de imagem/vídeo (modos Frames e Elementos do Flow) a partir das fotos do produto |
| Copy, Headlines | Títulos, descrições, falas e 10 headlines dor + solução |
| Análise de Produto | Público, dores, ângulos e riscos de violação a partir de imagens |
| Autoanálise de Vídeo | Avalia um vídeo de até 100 MB (upload pela File API do Gemini) |
| Defesa de Violações | Textos de recurso baseados só nos fatos informados |
| Crescimento de Contas | Plano de 7 dias e prompts para o nicho |
| **2K DE SEGUIDORES** (card em “Mais ferramentas”, `#/2k-seguidores`) | Kit para crescer um perfil de personagem no TikTok: 13 prompts de criação de perfil (campos Hair, Skin e Other characteristic entram no texto copiado), base obrigatória, negative prompt e 50 vídeos prontos (busca, troca de `[PROFESSION]`, “Copiar base + cena”). Dados em `src/seguidores2k/data/kit.ts`; não usa o Gemini |
| Prompts Prontas / Movimentos / Vídeos | Agora moram na **Galeria de Prompts**, na seção "Prompts prontos" (veja "Galeria de Prompts"): busca, favoritos, filtros, edição, "Novo prompt" e **Adaptar com IA** (Gemini). As prévias de cada card vêm de `public/media` (veja abaixo) |

Em breve (dependem de dados externos ou servidor): Produtos mais vendidos, Radar de Produto em Alta.

## Arquitetura

```
src/
  lib/gemini/     cliente da API: generate com fallback de modelos, retry, timeout, cancelamento,
                  upload de vídeo (File API), listagem/ranking de modelos, erros tipados em pt-BR
  lib/            storage, keyStore, uso diário, clipboard
  context/        GeminiContext (chave, modelos, fallback), ToastContext
  hooks/          useGenerate, useHistory, useLibrary, usePersistentState, useFavorites
  tools/          definições declarativas das ferramentas (campos, prompts de sistema, schema de saída)
  data/           catálogo do painel e bibliotecas de prompts
  components/     UI reutilizável (Modal sobre <dialog>, dropzones, ResultView, PromptText…)
  pages/          Welcome, Dashboard, ToolPage, SettingsPage (as bibliotecas de prompts estão em `src/galeria/`)
```

Decisões:

- **Ferramentas declarativas.** Cada ferramenta é um objeto em `src/tools/definitions.ts`; uma única página
  (`ToolPage`) renderiza formulário, estados e resultado. Para criar uma nova, basta adicionar um objeto.
- **Saída estruturada.** O Gemini responde em JSON validado por `responseSchema`; `normalizeOutput` protege
  contra desvios. Todo resultado tem botão de copiar por item, seção e tudo, além de baixar `.txt`.
- **Modelos sem hardcode.** Os modelos Gemini mudam com frequência (os 2.5 têm desligamento previsto para 16/10/2026).
  O app lista os modelos da sua chave, ordena do mais indicado ao menos e, se um modelo falhar por cota ou
  indisponibilidade, passa sozinho ao próximo. Em Configurações dá para fixar um modelo.
- **Imagens otimizadas no navegador** (máx. 1536 px, JPEG): upload rápido e menos tokens da cota gratuita.
- **Segurança.** CSP restringe conexões a `generativelanguage.googleapis.com`; nenhum HTML de origem externa é
  injetado; o vídeo enviado ao Gemini é apagado após a análise.

## Prompts dos Vídeos do TikTok (formato novo: produto idêntico à foto)

**Para que servem:** cada card (na **Galeria de Prompts > Prompts prontos > Prompts dos Vídeos do TikTok**; o link antigo `#/biblioteca/videos` redireciona para lá) é uma **ideia de vídeo**. O texto (prompt) que você copia serve para o **Flow (Google Veo)** transformar **a foto do seu produto em um vídeo**. Para o produto não mudar, a sua foto entra como o **primeiro quadro** do vídeo.

**Como usar (também está no topo da página):**
1. No Flow, escolha **"Frames to Video"** e suba a foto real do seu produto.
2. No app, abra o card que combina com o seu produto (**Montar prompt**), envie a foto e cole a descrição: a IA preenche tudo. Revise e ajuste.
3. Copie o **Prompt do vídeo** e cole no Flow. Gere 3 ou 4 versões e fique com a em que o produto está igual à foto.
4. Quer uma sequência (clipe 1, 2, 3) ou cortes rápidos? Copie os **Clipes extras** (mesma foto, ação diferente, cada um com a sua fala se quiser) e junte no CapCut.

**O card** é um card da Galeria (capa, selo VÍDEO e título). Passe o mouse para ver os botões **Montar prompt** e **Gerar com IA**, ou clique para abrir a janela de detalhes, que explica **"O que acontece no vídeo"** em português, mostra quem aparece, o **modelo** do prompt e as observações do Flow.

**Área de montagem** (abre em tela cheia; à esquerda os passos, à direita os prompts prontos):
- **Passo 1: a IA preenche para você.** Envie a foto (recomendado), cole o título e a descrição ou a **ficha técnica inteira** do produto e clique em **Preencher tudo com IA**. A IA escolhe só o que importa: cria a **narração curta** (8 s = 22 a 26 palavras; 4 a 6 s = 12 a 18), tira o **tamanho** das medidas, descreve **o que a foto mostra**, descreve **quem aparece** e **adapta a ação ao seu produto** (e os clipes extras também). Mostra **avisos** (contradições na descrição, medidas que faltam, foto não enviada). Sem foto, ela não descreve o que aparece na foto e avisa. Precisa do Gemini conectado.
- **Passo 2: revise os campos.** Todos editáveis: o que aparece na foto, tamanho, quem aparece, uso real (só nos cards que pedem e quando a IA não adaptou a ação), narração (com contador), duração, voz e quem fala.
- O **Prompt do vídeo** se completa sozinho. O que ainda falta fica **destacado em amarelo**, com a contagem de trechos que faltam; quando completa, aparece "Prompt completo: é só copiar".
- **Proteção contra ficha técnica colada:** uma narração com mais de (limite + 10) palavras **não entra no prompt** (o trecho volta destacado e o aviso explica); o campo "o que aparece na foto" avisa quando parece uma ficha técnica (peso, medidas, texto longo). A fala sempre vai em uma linha só e sem aspas internas.
- Aba **Clipes extras**: cada clipe é um **vídeo separado**, com o **prompt completo** e uma frase em português dizendo o que ele faz. Você escolhe como será a fala:
  - **Cada clipe com a sua fala** (padrão): cada clipe tem a sua própria narração, que **continua a história** do clipe 1 sem repetir (a chamada para o carrinho vai só no último), e a linha de voz leva o **mesmo perfil de voz, escrito igual** em todos. A IA escreve essas falas no Passo 1. Aparece o **Roteiro completo da sequência** (todas as falas em ordem, com o total de palavras) para copiar e usar de legenda no CapCut. Como cada clipe é gerado separado, a voz pode variar um pouco entre eles.
  - **Sem fala**: os clipes saem sem a linha de voz, e você coloca a narração na edição (era o comportamento do briefing original).
  - Fala longa demais (ficha técnica) não entra no prompt do clipe, igual ao clipe 1.
- Aba **Foto da cena** (opcional): só para foto de catálogo (fundo branco).
- O que você preenche (e a adaptação da IA) fica salvo no navegador, por card. A foto enviada **não** fica salva. "Voltar à ação do card" desfaz a adaptação; "Limpar tudo" zera.
- **Gerar com IA** (botão do card e do guia): abre o gerador completo (foto obrigatória) e devolve tudo em seções (O que vi na foto, Prompt A, Prompt B, Narração, Clipes extras, Alertas, Lembrete). Tem a opção **"Cada clipe extra com a sua fala"** (ligada por padrão) e confere a contagem de palavras de **cada** fala.

**Regras do formato** (valem para todo card; texto completo em `src/lib/veo/briefing.ts`): foto real = primeiro quadro; trava visual só com o que a foto mostra; trava de escala (proporção visível ou medidas reais, nunca estimar); trava de sujeito; **um plano contínuo** por clipe, câmera travada, sem girar nem mostrar lados que a foto não mostra; cláusula de integridade; ação em 2 ou 3 fases; zero texto, logo, ícone ou overlay; narração só com o que está na descrição, sem narrar a ação.

**Cuidados e adaptações:**
- Os títulos e a ordem (`video-0` a `video-47`) **não mudaram**: as mídias de `public/media/library/` continuam valendo.
- Os cards de vídeo **não têm mais caixas de texto para editar** (a edição agora é pelos campos). Edições antigas desses cards ficam guardadas no navegador, mas não aparecem mais.
- Alguns cards mudaram de propósito para respeitar o formato: **"Queimando com o Isqueiro"** sem chama (isqueiro apagado); **"Jogando tinta"** não muda a cor dentro do clipe (a troca é na edição); **"Calça no apoio girando"** gira poucos graus (outro lado exige outra foto).
- O restante do prompt está em inglês, como o formato pede. Os campos aceitam português, mas **não foi verificado** como o Veo trata um prompt em inglês com trechos em português. Se puder, escreva os campos em inglês simples (ou use "Preencher com IA").
- Código: `src/lib/veo/briefing.ts` (regras e modelos), `src/data/videoSpecs.ts` (os 48 cards, com os textos em português), `VideoWorkspace.tsx`, `VideoGuide.tsx`, `VeoDialog.tsx`. Testes: `src/lib/veo/briefing.test.ts`.
- **Não verificado:** nenhum prompt foi rodado no Veo de verdade, e o gerador não foi testado com uma chave real do Gemini (só com resposta simulada).

## Layout

As páginas **ocupam toda a largura disponível** (testado em 2500 × 1260 e em 1366 × 900). As grades (cards, avatares, produtos, movimentos) criam mais colunas em tela larga, e as caixas de texto das bibliotecas crescem até mostrar tudo, sem rolagem interna. Na capa do Reels Studio, se a imagem em `public/media/styles` já tiver o título escrito, o app **não repete** o texto por cima.

## Galeria de Prompts

Aba própria (`#/galeria`), no menu **logo abaixo de Manequins**. Saiu do menu "Ferramentas" do Trendly; a rota antiga `#/trendly/galeria` redireciona para cá. Os favoritos que você já tinha continuam valendo.

**Layout (no estilo de uma galeria de vídeos):**
- **Filtros à esquerda** com contagens: caixa de **Favoritos**; **Explorar** (Todos os prompts, Novos na minha mídia, Editados por mim); **Formato** (Vídeo, Imagem); **Categorias** (Look e movimento, Giros e câmera, Cabelo, Chamada para ação, Dança e energia, Espelho e selfie, Tecido e produto, POV, Pessoa e realismo, e **Minha mídia** quando existir); **Reels Studio** (UGC, POV, Provador). Clicar de novo em um filtro desmarca. Os filtros se combinam.
- No topo: **"Mostrando X de N prompts"**, as pílulas **Tudo / Vídeo / Imagem / Com mídia** e a busca (título, descrição **e o texto do prompt**, sem diferenciar acento).
- **Grade de cards** que ocupa a largura inteira (8 por linha em tela larga): vídeo (ou imagem) em tela cheia, selos **VÍDEO/IMAGEM**, **NOVO** e **EDITADO**, coração e o título com a categoria. O **vídeo toca sozinho, mudo e em loop, como um GIF**, enquanto o card está na tela (pausa fora da tela; dá para desligar no botão **Movimento** da Galeria); no celular, os botões ficam sempre visíveis.
- **No card, ao passar o mouse:** coração, **copiar prompt** e **lápis (editar)**.
- **Janela de detalhes** ao clicar: vídeo com controles e **setas** (ou as teclas ← e →) para navegar pelos prompts do filtro atual; descrição; etiquetas; **"Copiar prompt inteiro" com o lápis logo ao lado**, e Favoritar; o bloco **PROMPT** (com o seu próprio Copiar e lápis) e **COMO USAR** (vídeo: suba a foto no Flow em "Frames to Video" como primeiro quadro; imagem: anexe a foto de referência e gere em 9:16).

**Prompts prontos (antes ficavam no painel):** a seção **"Prompts prontos"** do menu de filtros reúne as três coleções, que agora são cards da Galeria como os outros:
- **Prompts dos Vídeos do TikTok** (48): no card, **Montar prompt** e **Gerar com IA**; na janela de detalhes, o modelo do prompt (sem lápis nem copiar, porque o texto final é montado pelos campos) e as observações. Ao abrir essa coleção aparece o guia "Como funciona".
- **Prompts Prontas** (24, em 7 pastas que aparecem no filtro) e **Movimentos Especiais** (7): copiar, lápis (**Prompt e Observações**), **Adaptar com IA**, **Restaurar original**; observações em bloco próprio; selos de pasta, Frames/Elementos e Rascunho.
- **Novo prompt** (botão no topo): cria um prompt seu em Prompts Prontas, na pasta que você escolher. Os seus levam o selo **Seu**, têm o título editável e o botão **Excluir** (com confirmação).
- **Nada se perdeu:** as edições (`overrides:<coleção>`), os prompts seus (`custom:<coleção>`) e os favoritos (`favorites`) continuam nas mesmas chaves de antes.
- Os links antigos `#/biblioteca/videos`, `prontas` e `movimentos` (e `?cat=<pasta>`) abrem a Galeria já filtrada. A prévia desses cards continua em `public/media/library`.

**Editar o prompt (lápis):** abre o editor com **Título** e **Prompt**. **Salvar** guarda neste navegador (`galeria:edits`) e o card ganha o selo **Editado**; **Cancelar** descarta; **Restaurar original** volta ao texto de fábrica (só aparece se houver edição). Salvar um texto igual ao original não conta como edição.

**Vídeos novos pela pasta de mídia:** coloque o arquivo em `public/media/gallery/` (ex.: `giro-lateral.mp4`, MP4 H.264 ou WebM) e faça o commit: **um card novo aparece sozinho**, com o selo Novo, na categoria **Minha mídia** (e em "Novos na minha mídia"), **antes dos demais**. O título vem do nome do arquivo ("giro-lateral" vira "Giro lateral"). O card nasce **sem prompt**: abra e clique no lápis para escrever o prompt e, se quiser, trocar o título. Imagem com o mesmo nome (`giro-lateral.jpg`) vira a capa. Para trocar o vídeo de um card que já existe, use o nome exato dele (veja no **Mapa de mídia**). O botão **"Como adicionar vídeos"** na página explica isso, com o comando do `ffmpeg` para comprimir. O Mapa de mídia **não** trata esses arquivos como "nome errado": ele informa quantos viraram cards.

Código: `src/galeria/` (`lib/galeria.ts`, `components/GaleriaCard.tsx`, `GaleriaDetail.tsx`, `GaleriaFilters.tsx`, `pages/GaleriaPage.tsx`). Os 46 prompts continuam em `src/trendly/data/gallery.ts` (o passo "Movimento" do Provador também os usa). Testes: `src/galeria/galeria.test.ts`.

**Não verificado:** os textos dos 46 prompts foram escritos para este app como ponto de partida e **nunca foram rodados no Veo**; as categorias são minhas.

## Manequins

Aba **Manequins** (`#/manequins`), no menu logo abaixo de **Humanizar IA**. Reúne **10 vídeos de roupa em manequim** (5 de frente e 5 de costas, cada um com um movimento diferente de câmera e de mão) e o prompt para **vestir o manequim com a sua peça**. O manequim fica sempre parado e sem rosto, e a peça deve sair 100% igual à foto.

**Como usar (também está no topo da página):**
1. **Passo 1: a sua peça e o manequim.** Escolha o tipo de peça (vestido, saia, blusa ou camisa, calça, short, conjunto, macacão, jaqueta), o manequim (feminino ou masculino, tom fosco), a mão que toca o tecido e a voz. **Trocar a roupa é só trocar o tipo de peça:** os 10 prompts passam a falar dela (ex.: na calça, "waistband area" e "pant legs" no lugar de "upper fabric area" e "skirt"). Cole a descrição da peça para a IA escrever as falas.
2. **Passo 2: vista o manequim.** Dois prompts de imagem (frente e costas) para usar num gerador de imagens **com a foto da sua peça anexada**. O resultado, o manequim usando a SUA roupa, é o primeiro quadro dos vídeos.
3. **Passo 3: escolha o vídeo** (abas De frente, De costas e Todos). No Flow, suba a foto do manequim em **"Frames to Video"** (a de frente para os vídeos de frente, a de costas para os de costas) e cole o prompt.

**O que cada vídeo tem:** o nome do movimento, **"O que acontece" em português** (com as palavras da peça escolhida), a **fala em um espaço separado** (caixa própria, com contador de 22 a 26 palavras e aviso de palavras a evitar) e o **prompt completo**, com os botões **Copiar prompt do vídeo** e **Copiar só a fala**.

**A fala:** por padrão entra no fim do prompt (`Speak only this line, exactly as written: "..."`) para a voz falar no vídeo; desmarque "Colocar a fala dentro do prompt" para narrar na edição (o bloco `AUDIO` continua no prompt, sem a linha da fala). No **vestido**, as falas iniciais são as do documento original; nas outras peças começam vazias. **Gerar as 10 falas com IA** (Gemini) escreve falas diferentes entre si, de 22 a 26 palavras, só com o que a descrição diz, sem narrar a ação e sem as palavras proibidas. Uma ficha técnica colada na fala **não entra** no prompt.

**Aviso sobre as falas do documento original:** elas têm de **14 a 18 palavras** (o documento promete 22 a 26) e **4 usam "sofisticado/a"** (a do vídeo 10 também usa "impecável"). O app mostra isso nos contadores e avisa quantas falas estão fora da faixa.

O prompt segue o modelo do documento: *Create a realistic vertical 9:16 fashion boutique product video, 8 seconds…*, `PRODUCT LOCK`, cenário de boutique, `ACTION` com os tempos, `CAMERA` (sem rotação e sem o manequim se mexer), `STYLE`, `NEGATIVE` e `AUDIO` (voz em português do Brasil, sem sincronia labial). Tudo salvo no navegador (`manequins:v1`); "Voltar aos padrões" zera.

Código: `src/manequins/` (`data/garments.ts`, `data/videos.ts`, `lib/prompts.ts`, `pages/ManequinsPage.tsx`). Testes: `src/manequins/manequins.test.ts`.

**Não verificado:** nenhum prompt foi rodado no Veo (não sei se a peça sai idêntica nem se o manequim fica parado); o Passo 2 (prompt de imagem) foi escrito por mim a partir do pedido de "trocar a roupa" e **não existia no documento original**; a IA das falas só foi testada com resposta simulada.

## Acessibilidade e qualidade

- **Teste automático de acessibilidade** (`axe-core`, WCAG 2 A e AA e boas práticas) em 21 telas e 4 janelas abertas: hoje **zero violações**. Ele já achou e corrigiu: contraste do texto branco sobre rosa e laranja (cores sólidas `--pink-solid` `#e50076` e `--hm-accent-solid` `#de3500`, só onde há texto branco), nome acessível dos cards da Galeria (contém o texto visível), ordem dos títulos, título principal nos assistentes do Trendly, papel dos ícones do Mapa de mídia e contraste do texto pequeno.
- **Título da aba** por tela (ex.: "Galeria de Prompts | Prompt para Vídeo").
- Os estilos do botão de tocar e do aviso "este vídeo não toca" ficam no CSS global (antes só carregavam depois de abrir o Trendly).
- Limpeza: 132 regras de CSS e um componente sem uso foram removidos.
- **Dependabot mensal**, ignorando saltos de versão grandes (vite 8, TypeScript 7…), em PRs separados.

## Humanizar IA

Ferramenta separada (rota `#/humano`), logo abaixo de **Trendly** na barra lateral. Monta **prompts que tiram a "cara de IA"** de fotos e vídeos.

- **Imagem / Vídeo:** alterna o modo. Cada modo tem os seus presets e comandos.
- **Comparação Original × Realista:** controle deslizante com duas imagens (ou vídeos) de IA lado a lado. Arraste o divisor ou use as setas do teclado (Home e End levam às pontas).
- **Presets realistas:** cenas prontas (vlog caseiro, vlog na rua, captura no bar, selfie no espelho…). Dá para marcar vários; ficam em carrossel.
- **Comandos para realismo:** 7 categorias (Rosto e pele, Corpo, Dispositivo, Edição, Iluminação, Movimento, Outros). "Movimento" só existe no modo Vídeo.
- **Seu prompt otimizado:** junta (1) o seu prompt original, se você colar um, (2) as cenas dos presets e (3) os comandos marcados. **Limpar** zera tudo, **Editar** deixa mexer no texto (e, se você mudar as seleções depois, um botão oferece "Atualizar com as seleções"), **Copiar** copia.
- As seleções ficam salvas no navegador.
- Os textos dos presets e comandos foram escritos para este app (em inglês, para os geradores de imagem e vídeo).

### Imagens da comparação

As imagens vêm de `public/media/humano/` (não há upload pelo site). Nomes:

| Arquivo | Onde aparece |
| --- | --- |
| `padrao-imagem-original.jpg` e `padrao-imagem-realista.jpg` | Comparação no modo Imagem |
| `padrao-video-original.jpg` e `padrao-video-realista.jpg` | Comparação no modo Vídeo |
| `<preset>-original.jpg` e `<preset>-realista.jpg` (ex.: `vlog-rua-original.jpg`) | Opcional: par próprio de um preset (aparece quando ele é o último marcado) |
| `<preset>.jpg` ou `.mp4` (ex.: `vlog-rua.jpg`) | Miniatura do preset |

Imagem ou vídeo valem em qualquer um deles. A tela **Mapa de mídia** (`#/trendly/midia`) lista os nomes exatos e marca o que já foi encontrado. Sem arquivos, a comparação mostra um espaço reservado com o caminho esperado.

## Aba Tendências (antes chamada Trendly)

O nome visível mudou de **Trendly** para **Tendências**. Pastas e endereços continuam `src/trendly/` e `#/trendly/...`, então links e favoritos antigos seguem funcionando.

Área separada (`src/trendly/`, rotas `#/trendly/...`), com menu próprio **Produtos**, **Ferramentas ▾** e **Mídia**, aberta pelo card **Tendências** do painel (ela não fica no menu lateral).

**Ferramentas ▾** tem os itens do menu de referência:

| Item | O que faz |
| --- | --- |
| **Reels Studio** | Escolha o estilo (UGC, POV, Provador) e siga o assistente passo a passo |
| **Agente IA** | Chat com o Gemini para ideias, ganchos, roteiros e legendas (conversa salva no navegador) |
| **Influencer Studio** | Avatares: 8 mulheres e 4 homens de partida (personagens fictícios, sem foto) e "Meus Avatares", que nasce das fotos `f-nome` / `m-nome` em `public/media/avatars` |
| **Galeria de Prompts** | Saiu do Trendly: agora é uma aba própria (`#/galeria`), logo abaixo de Manequins. Veja a seção "Galeria de Prompts" |
| **Hacks Virais** | Cartomante, Religioso e Frutas Falantes, com o Criador de Vídeo Viral |

### Os três fluxos do Reels Studio

| Estilo | Passos | Resultado |
| --- | --- | --- |
| **UGC** (4) | Avatar, Produto, Cena, Roteiro & Voz | **Direção de IA Pronta!** (Estação de Trabalho com 2 takes de 8 s) |
| **POV** (3) | Produto, Configuração Visual (cenário, mãos, estilo, duração de 8 a 40 s), Roteiro & Voz | **Direção de IA Pronta!** (1 a 5 takes) |
| **Provador** (4) | Avatar, Produto, Cena, Movimento (galeria de prompts) | **Seu Sistema de Criação Está Pronto** (passo 1 imagem, passo 2 vídeo, abre o Veo 3) |

- **Selecione o Produto Viral:** use o seu próprio produto (upload de foto, que vai só para o Gemini e não é salvo) ou escolha um da lista de **Produtos**. A lista é sua: o app **não busca vendas do TikTok Shop sozinho**. Cadastre produtos ou cole uma lista (por exemplo, exportada do Kalodata ou do FastMoss). Os itens "exemplo" que vêm com o app não são dados reais.
- **Roteiro & Voz:** takes de 8 s com 20 a 25 palavras, contador por take, **Preencher automático** (Gemini) e **Criar roteiro** (copia um prompt pronto e abre o ChatGPT ou o Gemini).
- **Primeiro frame:** o botão "Gerar Prompt de Imagem" gera, sob demanda, o prompt da imagem estática inicial.
- **Direção:** a fala de cada take vai ao Gemini exatamente como você escreveu; cada take tem "Ver Prompt" e "Copiar Take n".

### O que o vídeo de referência não mostrava (decisões minhas)

- O **passo 3 do UGC** não aparece no vídeo; usei a mesma tela de cena do Provador.
- A **terceira pose** do avatar ("Sentado(a)") e o conteúdo do **Agente IA** e do **Influencer Studio** também não aparecem; são interpretações minhas.
- Os textos dos prompts da galeria foram escritos para este app como ponto de partida.
- Nenhuma imagem de terceiros é incluída: capas, avatares, prévias e fotos de produto são arquivos que você mesmo coloca em `public/media`.
- Cada Hack tem regras de conteúdo (rotular como conteúdo de IA, sem alegações de saúde, sem previsões sensíveis, sem pedidos de seguir em troca de afeto), exibidas na tela e enviadas ao Gemini.
- Use apenas fotos suas, de quem autorizou ou de personagens fictícios nos avatares.
- A galeria e os prompts prontos, os avatares, os produtos e a mídia funcionam sem Gemini; só a geração precisa da chave.

## Imagens e vídeos dos cards (public/media)

**Não há upload no site.** As prévias vêm de arquivos que você coloca no repositório, na pasta `public/media/`. Faça o commit e o deploy publica tudo junto. Como o app é só seu, todo mundo que abrir o site vê os mesmos arquivos.

**Como o app sabe qual arquivo vai em qual card:** pelo **nome do arquivo**. O caminho é `public/media/<pasta>/<nome>.<extensão>`:

| Pasta | Onde aparece | Nome do arquivo |
| --- | --- | --- |
| `styles` | Capas de UGC, POV e Provador | `ugc`, `pov`, `provador` |
| `gallery` | Galeria de Prompts e passo "Movimento" | o id do prompt, ex.: `giro-360`, `pacote-vid`, `cta-carrinho` |
| `avatars` | Fotos dos avatares | o nome do avatar, ex.: `carolina`. Avatares seus: `f-nome` (mulher) ou `m-nome` (homem) |
| `products` | Foto de cada produto da lista | o código do produto (aparece em Produtos), ex.: `calca-feminina` |
| `interactions`, `poses`, `hands` | Prévias do passo de cena e do POV | `frontal`, `espelho`, `corpo-inteiro`, `luvas`, `sem-maos`… |
| `hacks` | Exemplos dos Hacks | `frutas-ex1`, `cartomante-ex2`… |
| `library` | Prompts Prontas, Movimentos e Vídeos do TikTok | o título (`roupas-infantis`) ou o id (`video-0`) |

- Formatos: imagens `.jpg .png .webp` e vídeos `.mp4 .webm`. Maiúsculas não importam.
- **Em qualquer card vale imagem OU vídeo** (capas, interação, pose, mãos, avatares, produtos, galeria, hacks). Se existirem os dois com o mesmo nome, o vídeo toca e a imagem vira a capa (`.jpg` ao lado do `.mp4`).
- **Nos cartões de seleção** (cena, pose, mãos, avatares, produtos, movimento) o vídeo toca sozinho, mudo e em loop, enquanto estiver na tela. Na galeria também toca sozinho enquanto estiver na tela. O movimento é uma preferência do app (botão **Movimento** na Galeria e opção em Configurações), ligada por padrão; ela vale mesmo se o sistema estiver com "reduzir movimento".
- **Para a IA** (foto do avatar e do produto), o app usa a imagem; se só houver vídeo, usa a capa ou um quadro do vídeo.
- **Se um vídeo não tocar**, o card mostra o aviso "Este vídeo não toca no navegador". O motivo costuma ser o codec (vídeos de iPhone/HEVC). Converta para MP4 H.264:
- **Mapa de mídia** (`#/trendly/midia`, botão **Mídia** no topo da aba Trendly): lista o nome certo de cada card, mostra o que já foi encontrado, copia o nome e avisa de arquivos com nome errado, formato não suportado ou grande demais.
- A lista de arquivos é gerada sozinha a cada `npm run dev` e `npm run build`; não existe lista para editar. No `npm run dev`, um arquivo novo aparece na hora.
- Os vídeos só começam a baixar quando o card chega perto da tela.

**Peso dos arquivos (GitHub):** um arquivo acima de 100 MB é bloqueado no push, e o repositório deve ficar abaixo de 1 GB (o Pages publica no máximo 1 GB e tem limite suave de 100 GB de tráfego por mês). O build avisa quando passa disso. Para vídeos curtos de prévia, comprima antes:

```bash
ffmpeg -i entrada.mov -vf "scale=-2:720" -c:v libx264 -crf 28 -preset slow -movflags +faststart -an saida.mp4
```

`+faststart` deixa o vídeo tocar antes de baixar inteiro. Lembre que o histórico do Git guarda todas as versões: suba só a versão final.

Continuam salvos **só no navegador**: lista de produtos, favoritos, histórico de gerações, edições de prompts, conversa do Agente IA e a chave do Gemini.

## Limites conhecidos

- A cota gratuita do Gemini é limitada por minuto e por dia (confira em https://aistudio.google.com/usage).
  O contador "chamadas hoje" é local a este navegador.
- Os prompts das bibliotecas foram reconstruídos a partir de gravações de tela, que mostravam só trechos.
  Cards com selo "rascunho" devem ser conferidos. Tudo é editável e seus prompts novos ficam salvos no navegador.
- Se quiser esconder a chave de usuários (ex.: vender acesso), aí sim é preciso um backend próprio com proxy.

## Mapa de mídia: lápis para trocar imagem ou vídeo

Em **Trendly > Mídia**, cada linha tem um **lápis**. Clique, escolha a imagem ou o vídeo no computador (ou arraste o arquivo sobre a linha) e o app coloca o arquivo em `public/media/<pasta>/<nome>.<ext>`, com o nome certo.

- **Com `npm run dev`:** o servidor grava direto na pasta e a página recarrega sozinha. Vídeo troca vídeo; imagem troca imagem (um `.jpg` ao lado do `.mp4` continua sendo a capa).
- **Site publicado (GitHub Pages, Vercel) ou sem `npm run dev`:** um site publicado não consegue gravar no seu projeto. O arquivo é **baixado já com o nome certo** e o app diz em qual pasta colocar (`public/media/<pasta>/`). Coloque no seu computador e faça o commit. Para gravar direto, abra o projeto com `npm run dev`.
- **Segurança:** o servidor só aceita os formatos do app, nomes simples dentro de `public/media` e até 100 MB; recusa pedidos de outros sites. No site publicado (GitHub Pages) o lápis não grava nada no servidor.

### Subir mídia direto da Galeria (v19)

- **Novo prompt:** o diálogo tem o campo **Imagem ou vídeo (opcional)**. Ao salvar, o arquivo vai para `public/media/library/<título-em-minúsculas>.<ext>` e o card passa a ser VÍDEO ou IMAGEM conforme o arquivo.
- **Janela de detalhes:** sem mídia, aparece o botão **Escolher imagem ou vídeo**; com mídia, um **lápis no canto da imagem** troca o arquivo.
- **Faixa "Quer adicionar vídeos?":** o botão **Subir vídeo ou imagem** cria um card novo em "Minha mídia" (`public/media/gallery`), sem sobrescrever outro de mesmo nome.
- **Mapa de mídia:** os prompts que você criou aparecem no grupo "Seus prompts (criados na Galeria)", com lápis, como os demais.
- Os vídeos dos cards da Galeria tocam sozinhos (mudos, em loop) enquanto estão na tela.

### Vídeos que tocam sozinhos (v20)

Vídeos **com áudio** e o ajuste "reduzir movimento" do sistema podiam impedir o play automático, e o vídeo só tocava depois de clicar em play. Agora o vídeo é forçado a começar mudo (`src/lib/videoMotion.ts`), toca sozinho nos cards e na janela de detalhes, e o movimento passa a ser uma preferência do app: botão **Movimento: ligado/desligado** na Galeria e opção em **Configurações > Vídeos**. Se o navegador ainda recusar, o card mostra um ▶ e a janela de detalhes mantém os controles.

### Salvar no projeto: seus prompts valem no GitHub Pages e na Vercel (v21)

Prompts criados, edições de prompts, favoritos e produtos ficam no navegador, e cada endereço (localhost, GitHub Pages, Vercel) tem o seu. Para valerem em todos:

1. Rode `npm run dev`, crie ou edite o que quiser. Aparece o aviso **"Seus prompts, edições e favoritos só existem neste navegador"** na Galeria (e em Configurações).
2. Clique em **Salvar no projeto**. O app grava `src/data/userData.json`.
3. Faça o **commit** (junto com a pasta `public/media`, onde estão as imagens e vídeos). O deploy publica, e o site passa a mostrar tudo, em qualquer navegador.

- **Sem `npm run dev`:** o botão vira **Baixar userData.json**. Coloque o arquivo em `src/data/userData.json` e faça o commit.
- **Navegador novo ou sem alterações:** usa automaticamente o que está no projeto.
- **Projeto mais novo e alterações no navegador:** o app pergunta qual versão vale ("Usar a do projeto" ou "Manter a deste navegador").
- **Nunca entram no arquivo:** a chave do Gemini, o histórico de gerações, as conversas do agente e os contadores de uso.

> **Onde editar:** criar prompts, subir mídia e **Salvar no projeto** gravam direto no projeto só com `npm run dev` (no seu computador). No GitHub Pages e na Vercel o site é só leitura: ele mostra o que foi commitado.


## Visual e títulos editáveis (v23)

- **Paleta única azul-escuro** (slate + azul) no lugar do rosa/laranja: cores centrais em `--accent`, `--accent-hi`, `--accent-solid` (`#2563eb`, contraste 5,2:1 com texto branco) no começo de `src/styles/app.css`. Os nomes antigos `--pink*` continuam como apelidos desses tokens. O teste de acessibilidade segue com **zero violações**.
- **Lápis nos títulos:** na janela de detalhes da Galeria há um lápis azul ao lado do título. Dá para renomear qualquer prompt (os que já vêm no app, os vídeos, os movimentos e os seus). O nome original nunca é apagado: **Restaurar nome** volta a ele, e **Restaurar original** (no editor do prompt) volta nome e texto juntos. Nome em branco é ignorado e Esc cancela.

## Painel e menu sem repetição (v23)

Cada destino aparece em **um lugar só**:

- **Menu lateral** (uso diário): Painel, Geradores de Prompt, Galeria de Prompts, Configurações.
- **Painel** (`#/`): quatro blocos de resumo (Gemini e chamadas do dia, prompts favoritos, editados por mim, Diagnóstico), **Continue de onde parou** (as últimas 6 ferramentas e prompts abertos, em `ppv:recent:items`, só neste navegador), **Atalhos** (Novo prompt, Mapa de mídia, Novos na minha mídia) e **Mais ferramentas** (Tendências, Humanizar IA, Manequins e os "Em breve"), com busca e estrela de favorito.
- Links novos da Galeria: `#/galeria?p=<id>` abre um prompt, `?v=fav|edited|new` filtra, `?novo=1` abre "Novo prompt".
- No código, `inMenu: true` em `src/data/catalog.ts` marca o que já está no menu e não vira card.

## Filtros da Galeria (correção v24)

Os filtros da Galeria **se somam** (por exemplo "Editados por mim" + "Prompts dos Vídeos do TikTok"). Antes o número ao lado de cada filtro era o total, então aparecia "48" e a tela mostrava 0. Agora: (1) os números consideram os outros filtros ligados (`facetCounts` em `src/galeria/lib/galeria.ts`), então o número bate com o que aparece ao clicar; (2) uma faixa **"Filtros ligados"** mostra cada filtro como etiqueta com ×, mais "Limpar todos"; (3) a tela vazia tem o botão **Limpar filtros**.

## Monitoramento (v23)

Duas camadas, sem servidor e sem enviar nada para fora:

1. **Verificação agendada do site** (`.github/workflows/uptime.yml`, a cada 30 minutos). Abre o site publicado, confere se a página é a do app e se cada script/estilo carrega (3 tentativas antes de dar alarme). Se falhar, abre uma issue **"Site fora do ar"** (rótulo `monitoramento`) e comenta nas próximas falhas; quando o site volta, a issue é fechada sozinha. O endereço vem da variável do repositório `SITE_URL` (Settings > Secrets and variables > Actions > Variables; use para a Vercel) ou, se não existir, do GitHub Pages (`https://<usuário>.github.io/<repositório>/`). Também roda à mão em Actions > Monitoramento do site > Run workflow, com um endereço opcional. Para testar no seu computador: `node scripts/check-site.mjs https://seu-site/`.
2. **Diagnóstico** (Configurações > Diagnóstico): lista os últimos 100 problemas deste navegador (erro de tela, falha do Gemini, vídeo que não toca, falha ao enviar arquivo), com contador de repetições e a tela onde aconteceu. Mostra a versão em uso, o armazenamento usado e **Verificar versão publicada** (compara com `health.json`, gerado no build, e avisa se o site publicado é diferente do que você está vendo: resolve a dúvida de "por que o site não atualizou"). **Copiar relatório** gera um texto para colar numa conversa. Tudo fica em `localStorage` (`ppv:diag:events`), fora do arquivo do projeto, e **a chave do Gemini nunca é gravada** (chaves e tokens são removidos do texto antes de guardar). Se uma tela quebrar, aparece um aviso com "Recarregar", "Voltar ao painel" e "Abrir Diagnóstico" em vez de página em branco.

## Progresso Semanal (v29)

Aba do menu logo abaixo da Galeria (`#/progresso`, código em `src/progresso/`), com três abas (`?aba=metas`, `?aba=planilha`; a primeira, Gerar Relatório, abre por padrão) e gráficos todos coloridos, desenhados em SVG próprio (sem biblioteca de gráficos):

- **Metas e progresso** (v25): metas diárias editáveis, marcação por dia (domingo a sábado), percentual da semana e do mês só até hoje, sequência, mapa do mês, média por dia da semana, frase do dia. Cores por desempenho (vermelho, amarelo, verde-limão, verde). Importar/Exportar metas em Excel. Botões que levam às outras abas.
- **Importar/Exportar Planilha**: abre `.xlsx` ou `.csv`, edita na tela (50 linhas por página, linhas e colunas novas), colunas com Concluído / Editando / Não começou viram menus coloridos, resumo por coluna e exporta de volta em Excel com as cores. "Baixar modelo" traz uma planilha de produção de conteúdo.
- **Gerar Relatório**: relatório de metas (esta semana, semana passada, este mês, mês passado; copiar, .txt e imprimir/PDF), **Indicadores** (junta por dia o Excel de cliques, AffiliateClickReport, com o de comissão, AffiliateCommissionReport: Cliques, Pedidos, Comissão, Itens vendidos, Valor do pedido e Novos compradores, com 6 gráficos) e **Importar Itens do Excel** (AffiliateCommissionReport): somas, Top 10 itens, Top 5 lojas, horário com mais vendas, maior comissão e 10 gráficos. Qualquer um dos botões reconhece sozinho qual relatório é.

Tudo roda no navegador (leitor/gravador de `.xlsx` próprio com `fflate`, leitor de CSV com detecção de separador e acentos). Dados em `progresso:goals`, `progresso:done`, `progresso:planilha` (entram no `userData.json`). Os relatórios importados (cliques por dia e linhas de pedidos) ficam só neste navegador (`progresso:r:*`) e continuam depois do F5; arquivo grande demais para o navegador avisa com mensagem. Testes: `src/progresso/lib/*.test.ts` e `e2e_progresso.py`.
