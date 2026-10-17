# UniCheck — Stack verificada

> Mapeamento brownfield realizado em 2026-10-15. Este arquivo registra o que existe no checkout atual; não deve ser confundido com a stack planejada nos documentos.

## Resumo

```text
React 19 + Vite 8 + TypeScript 6
        ↓ (mock atualmente; API opcional)
Express 5 + TypeScript + tsx
        ↓ (planejado, não usado no runtime atual)
MySQL 8 via mysql2
```

O front-end está em `client/` e o servidor em `server/`. O monorepo usa npm workspaces a partir da raiz `UniCheck/`. Há um `package-lock.json` somente na raiz.

## Versões efetivamente instaladas

Os `package.json` usam majoritariamente `latest`; as versões abaixo foram verificadas com `npm list --depth=0 --workspaces` e podem mudar após nova instalação:

- Node/npm: não fixados no repositório; validar no ambiente antes de diagnosticar diferenças.
- Client: React 19.3.0, React DOM 19.3.0, Vite 8.3.2, TypeScript 6.0.3, Vitest 5.0.3, Zod 4.6.5, React Hook Form 7.89.0, Prettier 3.9.9, ESLint 10.12.0.
- Server: Express 5.2.1, TypeScript 6.0.3, tsx 4.23.15, mysql2 3.24.5, bcrypt 6.0.0, jsonwebtoken 9.0.3, dotenv 18.0.5, cors 2.8.6, helmet 8.3.0, Zod 4.6.5, Supertest 7.3.1, Vitest 5.0.3, Swagger JSDoc 6.3.0 e Swagger UI Express 5.0.1.

## Scripts reais

Na raiz:

```text
npm run dev:client
npm run dev:server
npm test
npm run lint
npm run format
```

No client: `dev`, `build`, `preview`, `test`, `test:watch`, `lint`, `format` e `format:write`.

No server: `dev`, `build`, `start`, `test`, `test:watch`, `lint`, `format`, `format:write`, `migrate` e `db:reset`.

## Runtime e configuração

- Client: Vite entrega a aplicação por padrão em `localhost:5173`.
- Server: `server/src/server.ts` sobe Express em `PORT`, padrão `3000`, e inicia o job de atrasos.
- `client/.env.example` oferece `VITE_DATA_SOURCE=mock` e `VITE_API_URL=http://localhost:3000`. O serviço de dashboard só escolhe API quando `VITE_DATA_SOURCE=api`.
- `server/.env.example` documenta MySQL, mas o runtime efetivo usa `DATA_FILE` e JSON.
- CORS no código lê `CORS_ORIGIN` (singular), enquanto os documentos e exemplo devem ser mantidos consistentes com esse nome.

## Persistência atual

`server/src/database/jsonDatabase.ts` lê e grava `server/data/db.json`, inicializado a partir de `db.seed.json`. Os repositories de usuários, solicitações, materiais, chaves, movimentações e alertas dependem desse adaptador. `mysql2` está instalado, mas não há conexão MySQL usada pelos módulos atuais.

## Qualidade

- Client possui teste em `client/src/App.test.tsx`.
- Server possui testes Vitest nos módulos de alertas, chaves, dashboard, materiais, movimentações e solicitações.
- TypeScript é usado em todo o código; não há `tsconfig` compartilhado na raiz.
- A raiz não possui script `build`; builds devem ser executados por workspace.

## Contradições/documentação desatualizada

1. `agents.md` e `docs/ESTRUTURA_DO_PROJETO.md` descrevem MySQL como arquitetura, mas o código usa JSON.
2. A documentação promete `server/src/database/connection`, migrations e seeds SQL; a pasta `database` contém apenas `jsonDatabase.ts` e `types.ts`. O script `migrate` aponta para `src/database/runMigrations.ts`, arquivo que não existe.
3. A documentação recomenda rotas no client e módulos de domínio completos; o client atual não possui `src/routes/` nem módulos de auth/solicitações/materiais/chaves. A navegação das telas está centralizada em estado local dentro de `App.tsx`.
4. A documentação de módulos do servidor menciona arquivos `.js`, mas a implementação real é TypeScript `.ts`.
5. O fluxo visual ainda usa mocks nos dashboards e telas de solicitação; autenticação e confirmação em `App.tsx` não persistem sessão nem chamam a API.

## Melhorias prioritárias

1. Escolher e documentar uma fonte oficial de persistência: concluir MySQL/migrations ou assumir JSON apenas como protótipo.
2. Corrigir/remover o script `migrate` até existir `runMigrations.ts`.
3. Separar o client por rotas/módulos e mover autenticação, sessão e chamadas de solicitação para `services`/hooks.
4. Fixar versões (ou adotar política explícita de lockfile/renovações) em vez de `latest`.
5. Adicionar um contrato de API versionado, testes de integração com autenticação e testes de fluxo para as telas 4–7.
