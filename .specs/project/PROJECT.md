# UniCheck — Contexto Geral

## Objetivo

O UniCheck é um sistema web de apoio ao controle de empréstimos de materiais e chaves da Secretaria do CCT da Unifor. Nesta etapa, a prioridade é concluir um front-end visual, modular e navegável para os fluxos definidos no protótipo.

## Estado atual verificado

- Monorepo npm workspaces com React/Vite/TypeScript no cliente e Node/Express/TypeScript no servidor.
- A persistência de execução é JSON em `server/data/db.json`; MySQL e migrations são uma evolução futura, não parte desta rodada.
- O login atual é demonstrativo e permanece assim até a API de autenticação estar pronta para integração de front-end.
- As telas de solicitação e administração existem, porém a integração real com API e persistência está adiada deliberadamente.

## Limites desta rodada

- Fazer telas e navegação visuais com dados mockados explícitos.
- Separar o front-end em módulos para reduzir responsabilidades de `client/src/App.tsx`.
- Corrigir documentação para diferenciar runtime JSON atual de arquitetura MySQL futura.

## Fora desta rodada

- Integração do frontend com `/auth/login`, JWT ou rotas protegidas reais.
- Integração das telas com endpoints de solicitações/administração.
- MySQL, migrations, transações e migração de dados.
- Alterações de regras de negócio do servidor.

## Documentos gerais permitidos para módulos

1. `agents.md`
2. `.specs/project/PROJECT.md`
3. `.specs/project/ROADMAP.md`
4. `.specs/project/STATE.md`
5. `.specs/codebase/STACK.md`
6. `.specs/codebase/CONVENTIONS.md`
7. `.specs/codebase/STRUCTURE.md`
8. `.specs/codebase/TESTING.md`

Cada módulo também pode ler somente os arquivos da sua própria pasta em `.specs/features/`.
