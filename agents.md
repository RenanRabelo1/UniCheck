# AGENTS.md — UniCheck

## Visão geral do projeto

O UniCheck é um sistema web para o controle de empréstimos de materiais e chaves da Secretaria do CCT da Unifor. O fluxo inclui solicitação, decisão por item, retirada/devolução presencial e alerta de atraso.

Arquitetura atual:

```text
React/Vite (client/) -> API REST Express (server/) -> MySQL
```

MySQL é a persistência atual: conexão, migrations 001–005 e repositories SQL estão implementados. Os testes de integração exigem MySQL local.

## Tech stack

- **Frontend:** React, TypeScript, Vite, React Hook Form e Zod.
- **Backend:** Node.js, TypeScript, Express, Zod, Helmet, CORS, bcrypt e JWT.
- **Persistência atual:** MySQL 8.0.16+ com `mysql2`; conexão e migrations em `server/src/database/`, acesso via repositories.
- **Testes:** Vitest; Testing Library no client e Supertest no server.
- **Monorepo:** npm workspaces (`client/` e `server/`), com lockfile somente na raiz.

## Comandos principais

Execute a partir da raiz `UniCheck/`:

```bash
npm install
npm run dev:client
npm run dev:server
npm test
npm run lint
npm run format
npm run build --workspace=@unicheck/client
npm run build --workspace=@unicheck/server
npm run migrate --workspace=@unicheck/server
npm run db:check --workspace=@unicheck/server
# Somente para inicializar/repor dados de demonstração:
npm run db:seed --workspace=@unicheck/server
```

Não edite migrations já aplicadas; adicione a próxima numeração (006 nesta versão). Não reaplique seed para uma simples atualização de código.

## Arquitetura e diretrizes de código

- **Client:** mantenha comunicação HTTP em `client/src/services/`; componentes não devem espalhar `fetch`, regras de autorização ou segredos.
- **Server:** rotas e controllers tratam HTTP; services aplicam regras de negócio; repositories são a única camada que lê ou grava dados.
- **Validação:** valide dados externos com Zod no servidor. A validação do client melhora UX, mas não substitui a validação da API.
- **Tipagem:** TypeScript estrito; não introduza `any` sem justificativa concreta.
- **Persistência:** altere os repositories SQL ativos e preserve o contrato dos dados. Não escreva SQL em controllers. Não declare testes de persistência executados sem MySQL real.
- **Integração do client:** `VITE_DATA_SOURCE=mock` mantém o modo visual; `VITE_DATA_SOURCE=api` habilita os serviços que já suportam a API. Mocks devem permanecer explícitos e isolados.
- **Concorrência:** em MySQL, aprovação/reserva, retirada e devolução precisam de transação e bloqueio para impedir disponibilidade dupla.

## Regras de domínio

- Professor solicita materiais; aluno solicita chaves.
- Aluno só solicita chave com autorização ativa, projeto e professor ativos.
- Cada item de uma solicitação é aprovado ou recusado separadamente; a recusa exige motivo.
- Retirada exige aceite do termo de responsabilidade e registra data/hora real.
- Devolução registra data/hora real e condição; não pode preceder a retirada.
- Materiais e chaves com histórico são inativados, nunca removidos.
- Item não devolvido até 22:40 gera ocorrência de atraso.
- O servidor é a autoridade para permissões, disponibilidade e transições de estado.

```text
PENDENTE -> APROVADO -> RETIRADO -> DEVOLVIDO
PENDENTE -> RECUSADO
```

## Arquivos protegidos e restrições

- Não versionar `.env`, senhas, tokens, dados reais nem dumps de produção.
- Use `server/.env.example` e `client/.env.example` como referência. No servidor, as variáveis ativas são `PORT`, `CORS_ORIGIN`, `JWT_SECRET`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`; no client, `VITE_DATA_SOURCE` e `VITE_API_URL`.
- Não altere dados manualmente para mascarar comportamento. Use um banco isolado terminado em `_test` para testes destrutivos.
- Não alterar PKs, FKs, enums ou regras do MER sem atualizar o SQL, diagramas, validações, services e testes no mesmo escopo.
- Não apagar histórico de empréstimos nem contornar as regras de autorização.
- Não use `git reset --hard`, `git checkout --` ou remoções para resolver conflitos sem autorização explícita.
- Não envie diretamente para `main`; use uma branch de feature e Pull Request quando houver publicação.

## Fontes de verdade e documentação

Antes de mudar regras ou contratos, consulte nesta ordem:

1. Código e testes afetados.
2. `docs/ESTRUTURA_DO_PROJETO.md`.
3. `controle_emprestimos.sql`.
4. `../MER-CCT-Controle-de-Emprestimos.drawio` e `../DER-CCT-Controle-de-Emprestimos.drawio`.
5. `.specs/codebase/STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `TESTING.md` e `CONCERNS.md`.

Se houver divergência, registre a decisão em vez de alterar silenciosamente. A documentação antiga de JSON foi corrigida após inspeção da migração MySQL recebida da equipe.

## Verificação e Git

1. Confirme a branch e `git status` antes de editar.
2. Execute testes, lint, formatação e build do workspace afetado.
3. Em telas, valide os perfis e fluxos afetados; não declare validação visual ou de runtime sem executá-la.
4. Atualize documentação e testes ao mudar regra, contrato ou persistência.
5. Faça commits focados no formato `<emoji> <tipo>: <descrição curta>`, por exemplo `✨ feat: cria solicitação de material`.

## Para registrar

**Contexto:** A equipe substituiu JSON por MySQL; o guia ainda descrevia a versão antiga.
**Decisão:** Documentar a conexão e os repositories atuais e distinguir telas integradas de mocks.
**Validação:** Consulte `docs/GUIA_COORDENACAO.md` para resultados e limitações desta entrega. Não confundir testes de contrato HTTP simulados com integração MySQL.
