# UniCheck

Sistema web para o controle de empréstimos de materiais e chaves da Secretaria do CCT da Unifor.

## Como rodar

Requisitos: Node.js 22 ou superior e MySQL 8.0.16 ou superior.

1. Copie `server/.env.example` para `server/.env` e preencha o acesso ao seu MySQL.
2. Copie `client/.env.example` para `client/.env` e use `VITE_DATA_SOURCE=api`.
3. Na raiz do projeto, instale e prepare o banco:

```bash
npm ci
npm run migrate --workspace=@unicheck/server
npm run db:seed --workspace=@unicheck/server
```

4. Em dois terminais, suba a API e o front:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Abra `http://localhost:5173`. Rode o seed só em banco novo de desenvolvimento, nunca em produção. Para os testes, use `npm test` com o MySQL ligado; eles usam um banco próprio terminado em `_test`.

Mais detalhes: [fluxos da coordenação](docs/GUIA_COORDENACAO.md), [banco de dados](docs/BANCO_DE_DADOS.md) e [publicação](docs/DEPLOY.md).

## Estrutura

- `client/`: aplicação React.
- `server/`: API REST em Node.js.
- `docs/`: requisitos, diagramas e protótipos do projeto.

No back-end, cada módulo concentra suas rotas, controller, service, repository e validações. A API aplica as regras de permissões, disponibilidade, aprovação por item, retirada, devolução e alertas de atraso.
