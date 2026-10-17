# Testes e verificação

## Stack atual

- Vitest nos dois workspaces.
- Front-end: Testing Library + jsdom + `@testing-library/jest-dom`.
- Backend: Vitest; `supertest` está instalado, mas a cobertura observada está concentrada em testes de módulos/services.
- TypeScript build e ESLint são gates separados dos testes.

## Onde estão os testes

- `client/src/App.test.tsx`: fluxo de login do coordenador e aceite obrigatório do termo.
- `server/src/modules/*/*.test.ts`: regras de solicitações, administração, materiais, chaves, movimentações, dashboard e alertas.
- `server/src/testing/testApp.ts`: apoio para testar a API.

## Comandos

Na raiz:

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run format
```

Builds:

```powershell
npm.cmd run build --workspace=@unicheck/client
npm.cmd run build --workspace=@unicheck/server
```

## Lacunas de cobertura

- Não há testes de integração completos para autenticação, autorização por perfil e rotas HTTP.
- O front-end não testa navegação completa entre nova solicitação, confirmação, minhas solicitações e detalhes.
- Não há teste de erro de rede, API não configurada, loading, estado vazio ou resposta inválida.
- Não há teste visual/responsivo automatizado.
- Não há teste de concorrência/persistência que prove as garantias da transação JSON ou da futura transação MySQL.
- O script `format` faz `prettier --check`; não corrige arquivos. A consistência de formatação depende de execução explícita de `format:write`.

## Gate mínimo para mudanças

1. Teste unitário da regra de negócio alterada.
2. Teste de rota com `supertest` quando o contrato HTTP mudar.
3. Teste de componente/fluxo quando uma tela ou navegação mudar.
4. `lint`, `test`, build dos dois workspaces e `git diff --check`.
5. Para alterações de dados: reset do seed, execução em banco limpo e verificação de isolamento entre testes.

## Prioridade de expansão

Alta: autenticação real no client, autorização das rotas administrativas e integração das telas com API.

Média: estados de erro/loading/vazio e testes E2E dos fluxos de solicitação, aprovação, retirada e devolução.

Baixa: cobertura visual e métricas de cobertura; só depois de estabilizar contratos e persistência.
