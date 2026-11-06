# Runtime Validation Report

**Data:** 2026-11-05
**Projeto:** `marketplace-nft`

## Resumo

| Etapa | Status | Código de saída | Evidencia |
|---|---|---:|---|
| Build de producao | PASS | 0 | `npm run build` |
| Testes Playwright | PASS | 0 | 3 testes aprovados |
| Lighthouse | PASS | 0 | `reports/lighthouse.json` e `reports/lighthouse.html` |

**Resultado geral:** PASS

## Playwright

Fluxos executados:

1. Busca no catalogo, filtro pela URL e limpeza do estado vazio.
2. Falha de autenticacao, login valido e acesso ao perfil/logout.
3. Abertura de NFT, adicao ao carrinho e leitura apos reload.

Comando: `npm run test:e2e`

## Lighthouse

Auditoria local da pagina inicial em Chromium:

| Categoria | Nota |
|---|---:|
| Performance | 93 |
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 83 |

Comando: `npm run test:lighthouse`
