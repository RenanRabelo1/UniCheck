# Estrutura do Projeto UniCheck

## Arquitetura atual

React/Vite (`client/`) → API REST Node.js/Express (`server/`) → MySQL 8.0.16 ou superior.

A migração para MySQL está no código recebido da equipe: conexão em `server/src/database/connection.ts`, migrations 001–005, seed SQL e repositories SQL. Os documentos anteriores que descreviam JSON estavam desatualizados. O banco é local a cada integrante; não acompanha o código do GitHub.

## Integração das telas

Com `VITE_DATA_SOURCE=api`, cadastro/login, Nova solicitação, Minhas solicitações e detalhes usam a API. Esta entrega acrescenta Pendências e Análise da solicitação para coordenação. As demais telas administrativas e os indicadores do painel administrativo continuam demonstrativos. O modo `mock` preserva as telas de demonstração.

- `client/src/app/AppShell.tsx`: sessão e navegação; escolhe os módulos reais ou demonstrativos.
- `client/src/services/api.ts`: HTTP e tratamento de erros; `adminRequests.ts`: contratos e operações administrativas.
- `client/src/modules/admin/requests-api/`: fila e análise integradas, com estilos das telas existentes.
- `server/src/routes/index.ts`: registro de rotas.
- `server/src/modules/`: rotas/controllers, validações, services e repositories por domínio.
- `server/src/database/`: conexão, transações, migrations, seed e tipos.

Services aplicam regras; repositories executam SQL. A aprovação existente usa transação e bloqueios para reconferir disponibilidade. A recusa exige motivo. O servidor mantém a autoridade sobre autenticação, permissões e transições.

## Configuração

Na raiz: `npm ci`. Copie os modelos `server/.env.example` e `client/.env.example` para `.env` nas respectivas pastas. Preencha as credenciais locais do MySQL no servidor. No client, configure `VITE_DATA_SOURCE=api` e `VITE_API_URL=http://localhost:3000`.

Execute na raiz:

```sh
npm run migrate --workspace=@unicheck/server
npm run db:check --workspace=@unicheck/server
```

Em um banco novo de desenvolvimento, use `npm run db:seed --workspace=@unicheck/server` para carregar os exemplos. Não é necessário reaplicar o seed para instalar esta entrega. O seed pode redefinir registros de demonstração existentes.

Abra dois terminais na raiz, com `npm run dev:server` e `npm run dev:client`. Não envie `.env` ou credenciais reais ao GitHub.

## Verificações

```sh
npm test
npm run lint
npm run format
npm run build --workspace=@unicheck/client
npm run build --workspace=@unicheck/server
```

Os testes de integração do servidor requerem MySQL acessível e permissão para criar/reinicializar um banco cujo nome termina em `_test`. Consulte `server/src/testing/testApp.ts`. O teste `solicitacao.admin.http.test.ts` usa repositories simulados e não comprova persistência MySQL.

Esta entrega não altera migrations. Novas mudanças de schema devem entrar em uma nova migration (próxima: 006), preservando as já aplicadas.

## Próximos módulos

Retirada, devolução, histórico, cadastros administrativos e autorizações ainda precisam ser integrados às telas. Verificar os requisitos antes de implementar cancelamento pelo aluno. Consulte `GUIA_COORDENACAO.md` para instalar e testar esta etapa.
