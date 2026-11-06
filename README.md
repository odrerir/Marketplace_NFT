# Kurio: NFT Marketplace

Solução do desafio frontend "Marketplace de NFTs", feita com React e TypeScript. Todo o backend (REST e tempo real) é simulado com MSW, direto na camada de rede do navegador.

- **Aplicação publicada:** https://marketplace-nft-sage.vercel.app
- **Repositório:** https://github.com/odrerir/Marketplace_NFT
- **Decisões, contratos e limitações:** veja [ARCHITECTURE.md](./ARCHITECTURE.md)

## Stack

| Responsabilidade | Tecnologia |
|---|---|
| Interface | React 19 |
| Linguagem | TypeScript |
| Roteamento | TanStack Router (rotas por arquivo) |
| Estado remoto | TanStack Query |
| Cliente HTTP | Axios |
| Tempo real | Socket.IO (`socket.io-client`) |
| Estilização | Tailwind CSS v4 |
| Componentes | shadcn/ui (Base UI) |
| Mocking | MSW + `@mswjs/socket.io-binding` |
| Testes E2E | Playwright |
| Auditoria | Lighthouse |

Ferramentas complementares: Vite (build), oxlint (lint) e Lucide (ícones).

## Requisitos

- Node.js 20.19 ou superior (ou 22.12+)
- npm

## Como executar

A aplicação fica na pasta `marketplace-nft`.

```bash
cd marketplace-nft
npm install
npm run dev
```

Abra http://localhost:5173. O arquivo `.env` já vem com os mocks ligados, então não é preciso configurar nada.

## Variáveis de ambiente

| Variável | Padrão | Função |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Liga o MSW (API REST e Socket.IO simulados). Também está ligada no build publicado. |
| `VITE_REALTIME_URL` | `wss://realtime.kurio.mock` | Endereço do Socket.IO. O valor padrão é um host fictício, interceptado pelo MSW. |

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento, com mocks |
| `npm run build` | Verificação de tipos e build de produção |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Só a verificação de tipos (`tsc -b`) |
| `npm run lint` | Lint com oxlint |
| `npm run test:e2e` | Testes Playwright |
| `npm run lighthouse` | Auditoria Lighthouse |

## Credenciais fictícias

| Usuário | E-mail | Senha |
|---|---|---|
| Ana | `ana@kurio.test` | `Kurio@123` |
| Bruno | `bruno@kurio.test` | `Kurio@123` |

Também é possível criar uma conta nova em `/cadastro`. As senhas ficam guardadas com sal e SHA-256, apenas para a demonstração.

## Cenários, reset e falhas

Os dados simulados ficam no `localStorage` (chave `kurio-mock-db:v5`), então sobrevivem a um refresh. Com a aplicação aberta, o console do navegador oferece:

```js
__kurioMock.resetDb()                      // restaura o cenário conhecido (dados e falhas)
__kurioMock.expireSessions()               // expira todas as sessões
__kurioMock.setFailure('favorites', 'http500')   // falha HTTP 500 no grupo
__kurioMock.setFailure('favorites', 'network')   // queda de conexão no grupo
__kurioMock.setFailure('favorites', 'none')      // volta ao normal
__kurioMock.clearFailures()                // remove todas as falhas
```

### Falhas e opções adicionais

```js
__kurioMock.setFailure('cart', 'http500')
__kurioMock.setFailure('wallets', 'network')
__kurioMock.setFailure('orders', 'none')

__kurioMock.setOption('payment', 'confirm')
__kurioMock.setOption('payment', 'refuse')
__kurioMock.setOption('payment', 'timeout')
__kurioMock.setOption('wallet', 'ok')
__kurioMock.setOption('wallet', 'refuse')

__kurioMock.changeNft('nft-001', { price: '1.50' })
__kurioMock.disconnectWallet()
```

Para colar código no console do Chrome, digite antes `allow pasting`.

### Como reproduzir os fluxos de falha

| Cenário | Como reproduzir |
|---|---|
| Lista vazia | Na Início, busque por `zzzz` |
| Página inexistente | Abra `/?page=99` |
| NFT inexistente | Abra `/nft/xyz` |
| Edição esgotada | Abra `/nft/nft-009` (a edição 1/1 está esgotada) |
| Limite de quantidade | No detalhe, aumente a quantidade até o limite da edição |
| Falha com rollback (favoritos) | Entre, rode `__kurioMock.setFailure('favorites', 'http500')` e clique no coração |
| Queda de rede | Igual ao anterior, com `'network'` |
| Sessão expirada | Entre, abra `/perfil`, rode `__kurioMock.expireSessions()` e recarregue |
| Conflito de cadastro | Em `/cadastro`, use `ana@kurio.test` ou o usuário `ana` |
| Validação de formulário | Envie login e cadastro vazios ou com dados inválidos |
| Rota privada sem login | Deslogado, abra `/perfil` |
| Rota inexistente | Abra `/qualquer-coisa` |
| Falha no carrinho | Execute `setFailure('cart', 'http500')` e altere o carrinho |
| Falha ou queda da rede do carrinho | Execute `setFailure('cart', 'network')` ou troque para `http500` |
| Falha no cadastro de carteira | Execute `setFailure('wallets', 'http500')` |
| Conexão de carteira recusada | Execute `setOption('wallet', 'refuse')` |
| Conexão de carteira bem-sucedida | Execute `setOption('wallet', 'ok')` |
| Pagamento confirmado | Execute `setOption('payment', 'confirm')` e finalize o pedido |
| Pagamento recusado | Execute `setOption('payment', 'refuse')` e finalize o pedido |
| Timeout do pagamento | Execute `setOption('payment', 'timeout')` e finalize o pedido |
| Cotação alterada | Altere um NFT ou seu carrinho e tente pagar com uma cotação antiga |
| Desconexão simulada | Execute `disconnectWallet()` |

## Estrutura do projeto

```
marketplace-nft/
  public/                 service worker do MSW e imagens dos NFTs
  src/
    api/                  funções de acesso à API (Axios)
    components/           componentes compartilhados (Field, Notifier, Footer, ui/)
    features/             telas por área (home, detail, favorites, auth)
    lib/                  cliente HTTP, sessão, cache, ETH, avisos, socket
    mocks/                banco simulado, handlers REST e Socket.IO, fixtures
    routes/               rotas por arquivo (TanStack Router)
    types/                contratos da API
  vercel.json             rewrite para o index.html
```

## Deploy

A aplicação é publicada na Vercel a partir da branch `main`. O `vercel.json` redireciona qualquer caminho para o `index.html`, para que acesso direto e refresh funcionem em todas as rotas. Se o repositório tiver a aplicação em uma subpasta, o *Root Directory* da Vercel precisa apontar para ela. Os mocks fazem parte do build publicado.

## Status

| Área | Situação |
|---|---|
| Início: busca, abas, filtros, ordenação, paginação na URL | Concluído |
| Detalhe do NFT e favoritos otimistas | Concluído |
| Login, cadastro, sessão, rotas privadas, logout | Concluído |
| Tempo real: eventos de negócio sobre Socket.IO/MSW | Concluído |
| Carrinho, cupom e cotação | Concluído |
| Carteiras, conexões e redes | Concluído |
| Pagamento, pedidos idempotentes e confirmação | Concluído |
| Eventos `nft.updated` e `order.updated` | Concluído |
| Perfil | Concluído |
| Testes Playwright | Pendente |
| Lighthouse | Pendente |