# Contexto de execução

Data: 2026-10-16

## Fatos verificados

- `server/src/config.ts` lê `CORS_ORIGIN`, `DATA_FILE`, `PORT` e `JWT_SECRET`.
- Os repositories ativos usam `server/src/database/jsonDatabase.ts`; o arquivo padrão é `server/data/db.json`, com `server/data/db.seed.json` como seed versionado.
- `server/package.json` ainda declara `migrate`, mas `src/database/runMigrations.ts` não existe.
- O front-end mantém autenticação demonstrativa e fluxos visuais com mocks; a integração de autenticação e das telas com API está adiada para o próximo marco.

## Decisão aplicada

Os documentos gerais agora classificam JSON e os mocks como runtime atual do protótipo. MySQL, migrations, integração de autenticação e persistência das telas permanecem explícitos como roadmap futuro. As regras de domínio foram preservadas como referência planejada.

## Limite do módulo

Foram alterados somente `agents.md`, `docs/ESTRUTURA_DO_PROJETO.md`, `server/.env.example`, o estado geral e os arquivos desta feature. Nenhum código de runtime, contrato, dependência ou artefato de outro módulo foi modificado.
