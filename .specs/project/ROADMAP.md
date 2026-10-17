# Roadmap — UniCheck

## Marco atual — Front-end visual modular

| Ordem | Módulo | Resultado | Dependência |
|---|---|---|---|
| 1 | `frontend-shell` | App shell, sessão demonstrativa e navegação extraídos de `App.tsx` | Nenhuma |
| 2 | `request-flow-ui` | Fluxo visual de criar, confirmar, listar e detalhar solicitações | Shell definido para integração |
| 3 | `admin-dashboard-ui` | Painel administrativo visual isolado | Shell definido para integração |
| 4 | `documentation-alignment` | Documentação fiel ao runtime JSON e ao roadmap MySQL futuro | Nenhuma |

## Próximo marco — Integração de API

Após a API ser considerada pronta, integrar autenticação real, sessão e os contratos das telas. Este marco depende de uma decisão de contrato de API, não desta rodada visual.

## Marco futuro — MySQL

Planejar e implementar migrations, repositories SQL, seed e testes de integração. A fonte de verdade permanece JSON no protótipo até essa decisão ser executada e validada.
