# Banco de dados local (MySQL)

Cada membro usa o **próprio MySQL 8.0.16+** na sua máquina. O que mantém todos iguais são as migrations versionadas no Git.

## Primeira vez

1. Em `server/`, copie `.env.example` para `.env` e preencha `DB_PASSWORD` (senha do seu MySQL).
2. `npm run db:check -w @unicheck/server` — confere se a conexão funciona.
3. `npm run migrate -w @unicheck/server` — cria o banco `unicheck` e aplica as migrations.

## Mudando o banco

- Crie um arquivo novo em `server/src/database/migrations/` com o próximo número (ex.: `005_adiciona_coluna.sql`) e faça commit.
- Nunca edite uma migration que já foi para o Git, nem altere tabelas só pelo Workbench/DBeaver sem commitar o SQL.
- Depois de um `git pull`, rode `npm run migrate` de novo para receber as mudanças dos colegas.
- Cada migration deve fazer uma coisa só: no MySQL, criar/alterar tabela não tem rollback.

## Estado atual

A API ainda lê e grava em `server/data/db.json`. Os repositories serão migrados para `src/database/connection.ts` módulo a módulo.
