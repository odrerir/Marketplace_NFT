# Arquitetura e decisões

Este documento registra como a solução está organizada, os contratos simulados, as políticas de sessão e de cache, as decisões de UX, os desvios do Figma e as limitações conhecidas.

> **Pendente (atualizar antes de entregar):** as seções marcadas como pendentes dependem de funcionalidades ainda não implementadas. Remova ou preencha cada uma.

## 1. Visão geral

A aplicação é uma SPA em React. Não há backend: o MSW intercepta as requisições HTTP no navegador (service worker) e as conexões WebSocket (interceptor do próprio MSW). O código das telas, os hooks e o cliente Axios não contêm dados fictícios nem caminhos alternativos de negócio, e só enxergam uma API REST e um servidor Socket.IO.

```
Tela -> TanStack Query -> Axios -> [rede] -> MSW (handlers REST) -> banco simulado
Tela -> socket.io-client -> [WebSocket] -> MSW (binding Socket.IO) -> banco simulado
```

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Rotas | `src/routes` | Parâmetros de busca, proteção de rotas privadas, carregamento inicial |
| Telas | `src/features` | Componentes e hooks de cada área |
| Acesso a dados | `src/api` | Funções que chamam a API (sempre via Axios) |
| Infraestrutura | `src/lib` | Cliente HTTP, sessão, cache, ETH, avisos, socket |
| Contratos | `src/types` | Tipos compartilhados entre mocks e interface |
| Simulação | `src/mocks` | Banco, handlers, fixtures e cenários |

## 2. Contratos REST (simulados)

Erros usam o formato `{ code, message, fieldErrors? }`, com `code` em `VALIDATION_ERROR`, `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` e `TRANSIENT`.

| Método e caminho | Autenticação | Respostas |
|---|---|---|
| `POST /api/auth/register` | Não | 201 `{ token, user, expiresAt }`; 400 validação; 409 conflito de e-mail ou usuário |
| `POST /api/auth/login` | Não | 200 `{ token, user, expiresAt }`; 400 validação; 401 `INVALID_CREDENTIALS` |
| `GET /api/auth/session` | Sim | 200 `{ user, expiresAt }`; 401 `UNAUTHENTICATED` |
| `POST /api/auth/logout` | Sim | 204 (idempotente) |
| `GET /api/nfts` | Não | 200 lista paginada com `facets` (contagens e faixa de preço) |
| `GET /api/nfts/:id` | Não | 200; 404 |
| `GET /api/favorites` | Sim | 200 `{ nftIds }`; 401 |
| `PUT /api/favorites/:nftId` | Sim | 204 (idempotente); 404; 401 |
| `DELETE /api/favorites/:nftId` | Sim | 204 (idempotente); 401 |

Parâmetros de `GET /api/nfts`: `page`, `pageSize`, `q`, `category`, `network`, `minPrice`, `maxPrice`, `tab` (`new` ou `trending`) e `sort` (`price_asc`, `price_desc`; o padrão é o mais recente). A busca `q` cobre nome, coleção, token e categoria.

> **Pendente:** documentar carrinho, cotação (cupom, taxas, disponibilidade), pedidos (criação idempotente e consulta), perfil e carteiras, e os eventos Socket.IO (`nft.updated`, `order.updated`), com identidade, recurso afetado e versão.

## 3. Valores em ETH

Valores em ETH trafegam como **strings decimais** (`"1.19"`), nunca como `number`. Os cálculos usam `BigInt` em unidades de 10⁻¹⁸ ETH (`src/lib/eth.ts`), o que evita erros de ponto flutuante (`0.1 + 0.2`). Quantidades são inteiros.

## 4. Sessão

- O login devolve um token opaco, guardado no `localStorage` (chave `kurio:session-token`) e enviado em `Authorization: Bearer`. Em um backend real, o recomendado seria um cookie `httpOnly`, para o JavaScript não ter acesso ao token.
- O servidor simulado guarda as sessões (com expiração de 30 minutos) no mesmo banco persistido. As senhas ficam com sal e SHA-256, apenas para a demonstração (um backend real usaria bcrypt ou argon2).
- A sessão é recuperada após refresh pela consulta `['session']`, que resolve para o usuário ou `null`.
- **Expiração:** um 401 `UNAUTHENTICATED` com sessão ativa dispara um evento no cliente. O token é descartado, os caches privados são limpos, aparece um aviso e, se o usuário estiver em página privada, ele volta ao login com o caminho atual no parâmetro `redirect`, para retomar depois. Senha errada vem como `INVALID_CREDENTIALS` e não aciona esse fluxo.
- **Redirecionamento seguro:** `redirect` só aceita caminhos internos (começando com `/`, sem `//`), para não virar redirecionamento aberto.
- **Rotas privadas:** ficam sob o layout `_authed`, que valida a sessão em `beforeLoad`. Login e cadastro redirecionam quem já está logado.
- **Troca de usuário e logout:** descartam todos os caches (exceto a sessão), cancelam requisições em voo e desconectam o socket.

## 5. Cache e estado remoto

| Política | Valor |
|---|---|
| `staleTime` padrão | 30 s |
| `staleTime` da sessão | 5 min |
| Retries | Erros 4xx não são repetidos; falhas de rede e 5xx tentam até 2 vezes |
| Respostas obsoletas | O `AbortSignal` do TanStack Query é repassado ao Axios, cancelando a requisição anterior |
| Transição entre buscas | `keepPreviousData`: a lista antiga fica na tela (apagada) até a nova chegar |
| Chaves | Incluem todos os parâmetros da consulta; dados privados incluem o id do usuário |

**Atualização otimista (favoritos):** ao clicar, o cache é atualizado na hora, guardando o estado anterior. Se a requisição falhar, o estado é restaurado (rollback) e aparece um aviso acessível. Ao final, a consulta é invalidada para conferir com o servidor.

**Estado da URL:** busca, aba, ordenação, filtros e página vivem nos parâmetros de busca do TanStack Router, validados por `parseHomeSearch`. Sobrevivem a refresh e ao histórico do navegador. Mudar qualquer filtro reinicia a paginação, e a digitação na busca só escreve na URL após 300 ms de pausa.

> **Pendente:** descrever o estado do carrinho (servidor, mesclagem do carrinho de visitante ao entrar) e a reconciliação entre REST e Socket.IO (versões, duplicatas, reconexão).

## 6. Mocks (MSW)

- **Banco simulado** (`src/mocks/db.ts`): usuários, sessões, NFTs e favoritos, persistido no `localStorage` (`kurio-mock-db:v3`). Todas as escritas passam por `db.update`. `db.reset()` restaura integralmente o cenário conhecido.
- **Fixtures:** 36 NFTs determinísticos (sem aleatoriedade), com categorias, redes, preços, edições e alguns itens esgotados; e dois usuários fictícios.
- **Falhas configuráveis:** `__kurioMock.setFailure(grupo, 'http500' | 'network' | 'none')`. Hoje o grupo `favorites` está ligado a esse mecanismo.
- **Latência:** os handlers usam atrasos fixos (150 a 600 ms).
- **Ativação:** por `VITE_ENABLE_MOCKS`, presente no build publicado.

> **Pendente:** latência variável e respostas fora de ordem, timeout após criação do pedido, preço alterado durante a compra e os demais cenários exigidos.

## 7. Tempo real (Socket.IO sobre MSW)

- **Transporte:** `socket.io-client` com `transports: ['websocket']` conecta a `wss://realtime.kurio.mock`, um host fictício. O MSW intercepta a conexão e responde pelo `@mswjs/socket.io-binding`.
- **Carregamento tardio:** o `socket.io-client` guarda o `WebSocket` global quando o módulo carrega, e o MSW só o substitui no `worker.start()`. Por isso o cliente é carregado com `import()` dinâmico, depois dos mocks (`src/lib/socket.ts`).
- **Host fictício:** padrões de URL com caminho não casaram com o `/socket.io/` nos testes, e um curinga interceptaria o WebSocket do HMR do Vite.
- **Ping:** o binding não envia o ping do Engine.IO, e o cliente derruba a conexão por timeout (cerca de 30 s). O mock envia um ping a cada 20 s.
- **Reconexão:** testada derrubando a conexão no servidor simulado; o cliente reconecta sozinho.
- **Limitações do binding:** sem salas, namespaces nem broadcast.

> **Pendente:** eventos `nft.updated` e `order.updated`, tolerância a duplicatas e eventos antigos, reconciliação com REST após reconectar e isolamento por sessão.

## 8. Decisões de UX

- **Botão central da barra inferior (mobile):** o Figma não define a ação. Foi implementado como atalho para o campo de busca.
- **Busca no desktop:** vira um ícone no cabeçalho que expande um campo. Ao fechar, a busca é limpa, para não ficar um filtro ativo invisível.
- **Filtros no mobile:** o Figma tem só o botão. Foi criado um drawer lateral (com foco preso e `Esc`) que reaproveita o mesmo painel de filtros do desktop.
- **Faixa de preço:** dois campos (mínimo e máximo) em ETH, validados, com o botão "Aplicar"; os limites disponíveis vêm da API. Categoria e rede filtram ao clicar.
- **Login e cadastro:** um cartão centralizado nas duas larguras (o Figma desktop usa um modal sobre a Início). Foi acrescentado um botão "Voltar".
- **Estados não desenhados** (carregamento, erro, vazio, página inexistente, NFT inexistente, 404 global) seguem o padrão visual existente, com skeletons de mesmas dimensões do conteúdo e respeito a `prefers-reduced-motion`.
- **Quantidade e edição:** ao trocar de edição ou se a disponibilidade cair, a quantidade se ajusta ao limite, com mensagem em região `status`.
- **Favoritar deslogado:** leva ao login e volta para a mesma página.
- **Avisos:** região `aria-live` única para confirmações e erros (`src/lib/notify.ts`).

## 9. Desvios do Figma e de assets

- **Banner da Início:** o Figma tinha uma miniatura sobreposta (gorila de moletom roxo) que a nota do designer indicava que não deveria estar. Foi mantida só a imagem grande (macaco de jaqueta verde). Sem contato com o designer, a decisão ficou registrada aqui.
- **Banner em telas menores que 414 px:** cresce em altura para o texto não ser cortado (o Figma usa 190 px fixos).
- **Hero desktop:** sem o fundo em degradê, imagem de 450 × 450 e textos próprios do frame desktop.
- **Recorte da barra inferior:** feito com CSS para continuar responsivo; as pontas do recorte são retas, ao contrário do Figma.
- **Itens fora do escopo:** login social, newsletter, links do rodapé e as abas Mercado, Criadores e Aprenda aparecem desabilitados ou como texto, com aviso, para não parecerem funcionais.
- **Detalhe do NFT:** aba "Avaliações", ampliação da imagem e "Compartilhar este NFT" não foram implementados; "Mais desta coleção" é uma grade, não um carrossel; a galeria usa a mesma imagem quatro vezes (dados simulados).
- **Rodapé:** aparece só no desktop (o frame mobile não o tem).
- **Tablet (768 px):** usa o layout mobile com grade de 3 colunas.
- **Fonte:** Roboto Mono, identificada visualmente no Figma.
- **Inconsistências do Figma:** no carrinho mobile os itens somam 8,14 ETH, mas o subtotal mostra 8,92; o token do Violet Nomad aparece como #0009 no carrinho desktop e #0314 no resto; a edição "1/10" aparece duas vezes no detalhe mobile (deveria ser 1/1); o contador do carrinho mostra 6 com 3 itens; os rótulos "Contrato" e "Direitos autorais" estão trocados no detalhe. As telas usam valores coerentes vindos da API simulada.
- **Busca:** cobre também a categoria, porque o Figma chama as categorias de "Coleções".

## 10. Acessibilidade

Navegação por teclado com foco visível; drawer com foco preso (shadcn/ui); formulários com `label`, `aria-invalid` e mensagens de erro associadas por `aria-describedby`; estados não dependem só de cor (rótulos, `aria-pressed`, texto de edição esgotada); skeletons com `aria-hidden` e região de status para o carregamento; botões de ícone com nome acessível.

> **Pendente:** conferir contraste, zoom e overflow horizontal em 390, 768 e 1440 px, e documentar ajustes feitos.

## 11. Limitações conhecidas

- Favoritar pelos cards da listagem não foi implementado (só no detalhe).
- Blocos promocionais, "Diário da Cunhagem" e o cartão "NFT em destaque" da barra lateral da Início não foram implementados.
- O carrossel de destaques do banner (pontinhos) não foi implementado.
- Slider de preço do Figma substituído por campos numéricos.
- O hash de senha do mock e o token no `localStorage` servem só para a demonstração.

> **Pendente:** acrescentar tudo o que ficar de fora até a entrega (carrinho, checkout, perfil, carteiras, testes e Lighthouse, conforme o que for concluído), com o motivo.
