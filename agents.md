# AGENTS.md — UniCheck

## Visão geral do projeto

O UniCheck é um sistema web para o controle de empréstimos de materiais e chaves da Secretaria do CCT da Unifor. O fluxo inclui solicitação, decisão por item, retirada/devolução presencial e alerta de atraso.

Arquitetura atual:

```text
React/Vite (client/) -> API REST Express (server/) -> JSON local
```

MySQL é o modelo planejado, representado por `controle_emprestimos.sql` e pelos diagramas do diretório-pai, mas não é a persistência em uso no runtime atual.

## Tech stack

- **Frontend:** React, TypeScript, Vite, React Hook Form e Zod.
- **Backend:** Node.js, TypeScript, Express, Zod, Helmet, CORS, bcrypt e JWT.
- **Persistência atual:** `server/data/db.json`, acessado por `server/src/database/jsonDatabase.ts`.
- **Persistência planejada:** MySQL 8 com `mysql2`; conexão, migrations e repositories SQL ainda não existem.
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
npm run db:reset --workspace=@unicheck/server
```

Não use `npm run migrate --workspace=@unicheck/server`: o script referencia `src/database/runMigrations.ts`, arquivo inexistente.

## Arquitetura e diretrizes de código

- **Client:** mantenha comunicação HTTP em `client/src/services/`; componentes não devem espalhar `fetch`, regras de autorização ou segredos.
- **Server:** rotas e controllers tratam HTTP; services aplicam regras de negócio; repositories são a única camada que lê ou grava dados.
- **Validação:** valide dados externos com Zod no servidor. A validação do client melhora UX, mas não substitui a validação da API.
- **Tipagem:** TypeScript estrito; não introduza `any` sem justificativa concreta.
- **Persistência:** enquanto o protótipo usar JSON, altere os repositories ativos e preserve o contrato dos dados. Não escreva SQL em controllers nem declare MySQL integrado sem conexão e testes reais.
- **Integração do client:** `VITE_DATA_SOURCE=mock` mantém o modo visual; `VITE_DATA_SOURCE=api` habilita os serviços que já suportam a API. Mocks devem permanecer explícitos e isolados.
- **Concorrência:** ao migrar para MySQL, aprovação/reserva, retirada e devolução precisam de transação e bloqueio para impedir disponibilidade dupla.

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
- Use `server/.env.example` e `client/.env.example` como referência. No servidor, as variáveis ativas são `PORT`, `CORS_ORIGIN`, `DATA_FILE` e `JWT_SECRET`; no client, `VITE_DATA_SOURCE` e `VITE_API_URL`.
- Não editar `server/data/db.json` para mascarar comportamento de aplicação; use `db:reset` para restaurar o seed local quando necessário.
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

Se houver divergência, registre a decisão em vez de alterar silenciosamente. A divergência atual — MySQL planejado versus JSON em runtime — deve permanecer explícita até uma migração validada.

## Verificação e Git

1. Confirme a branch e `git status` antes de editar.
2. Execute testes, lint, formatação e build do workspace afetado.
3. Em telas, valide os perfis e fluxos afetados; não declare validação visual ou de runtime sem executá-la.
4. Atualize documentação e testes ao mudar regra, contrato ou persistência.
5. Faça commits focados no formato `<emoji> <tipo>: <descrição curta>`, por exemplo `✨ feat: cria solicitação de material`.

## Para registrar

**Contexto:** Guia operacional precisava refletir o código, não apenas a arquitetura planejada.
**Decisão:** Tratar JSON como persistência vigente e MySQL como migração futura não implementada.
**Justificativa:** Os repositories ativos usam `jsonDatabase.ts` e o script de migration aponta para arquivo inexistente.
**Trade-offs aceitos:** O documento não assume garantias transacionais de MySQL no protótipo atual.
**Revisar em:** Quando conexão MySQL, migrations e repositories SQL estiverem implementados e testados.
