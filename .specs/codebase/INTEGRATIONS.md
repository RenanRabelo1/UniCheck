# UniCheck — Brownfield Integrations Map

## Serviços e pontos de entrada

| Integração | Evidência no código | Estado |
| --- | --- | --- |
| React/Vite | `client/package.json`, `main.tsx`, `vite.config.ts` | Ativa para UI |
| Node/Express | `server/src/app.ts`, `server/src/server.ts` | Ativa |
| REST client | `client/src/services/api.ts` | Parcial; somente GET/dashboard |
| JWT/Bcrypt | `auth.service.ts`, `authenticate.ts` | Ativo no servidor; não usado pelo login do client |
| Zod | validações de domínio e `dashboard.service.ts` | Ativo no servidor e dashboard client |
| MySQL | dependência `mysql2`, `controle_emprestimos.sql` | Planejado, não conectado |
| JSON file database | `database/jsonDatabase.ts`, `data/db.seed.json` | Persistência efetiva atual |
| Job de atraso | `jobs/atrasos.job.ts` | Ativo ao iniciar server |

## Rotas HTTP efetivas

Base padrão: `http://localhost:3000`. Todas as rotas abaixo, exceto health/login, exigem `Authorization: Bearer <JWT>`.

### Públicos

- `GET /health` — `{ status: "ok" }`.
- `POST /auth/login` — recebe `identifier`, `password` e `role`; devolve token e sessão conforme o mapper de usuário.

### Professor/aluno

- `GET /dashboard` — dashboard do próprio professor/aluno; coordenador é recusado.
- `GET /solicitacoes/opcoes` — salas e itens permitidos para a janela informada.
- `GET /solicitacoes` — solicitações do usuário autenticado.
- `POST /solicitacoes` — cria solicitação; o service aplica perfil, autorização, horário e disponibilidade.
- `GET /solicitacoes/:id` — detalhe somente do proprietário.

### Coordenação/secretaria

- `GET /admin/solicitacoes` — fila admin filtrável por status/data para coordenador e funcionário.
- `POST /admin/solicitacoes/:id/itens/:itemId/decisao` — aprova ou recusa item; somente coordenador, motivo obrigatório na recusa.
- `GET /movimentacoes` — histórico, filtrável por solicitação/item.
- `POST /movimentacoes/retiradas` — registra retirada presencial; exige termo e regras de data/status.
- `POST /movimentacoes/devolucoes` — registra devolução e resolve alerta correspondente.
- `GET /alertas` — lista alertas abertos/resolvidos/todos.
- `POST /alertas/verificar` — dispara verificação manual; somente coordenador.
- `GET/POST/PATCH /admin/materiais[/:id]` — consulta, cadastro e alteração/inativação de materiais.
- `GET/POST/PATCH /admin/salas[/:id]` — consulta, cadastro e alteração/inativação de salas.
- `GET/POST/PATCH /admin/chaves[/:id]` — consulta, cadastro e alteração/inativação de chaves.

## Autorização

O middleware decodifica JWT e carrega o usuário por ID. `requireRole` implementa:

- `PROFESSOR`, `ALUNO`: dashboard e solicitação própria.
- `COORDENADOR`, `FUNCIONARIO`: consultas operacionais, movimentações, materiais/salas/chaves.
- Apenas `COORDENADOR`: decisões de solicitação, mutações de cadastro, verificação manual de atrasos.

Não há endpoint para manutenção de usuários, projetos ou autorizações de alunos, embora o MER e o protótipo indiquem essa necessidade.

## Integração client ↔ server atual

`client/src/services/api.ts` calcula `VITE_API_URL`, adiciona `Accept` e o bearer token de `sessionStorage`. `dashboard.service.ts` usa essa função apenas quando `VITE_DATA_SOURCE=api`; caso contrário retorna `dashboard.mock.ts`.

Não há chamada client para:

- `/auth/login`;
- `/solicitacoes` e `/solicitacoes/opcoes`;
- `/admin/solicitacoes`;
- `/movimentacoes`;
- `/alertas`;
- `/admin/materiais`, `/admin/salas`, `/admin/chaves`.

Como consequência, as telas de confirmação, minhas solicitações, detalhes e painel administrativo exibem dados estáticos. `RequestConfirmationScreen.onConfirm` não persiste nada; o fluxo de sucesso apenas navega para a lista mockada.

## Banco e integração planejada

O arquivo `controle_emprestimos.sql` é um artefato de definição, não uma migration executada pelo servidor. Ele exige MySQL 8.0.16+/InnoDB, CHECK constraints, triggers para integridade e evento/agendamento para atrasos. O código atual substitui tudo por um JSON versionado.

Principais divergências que precisam de decisão antes da migração:

- SQL normaliza professor/aluno/coordenador em tabelas especializadas; JSON usa uma tabela polimórfica `usuarios`.
- SQL separa termo de responsabilidade e ocorrência de atraso; JSON registra apenas campos agregados em solicitação/alerta.
- SQL suporta chaves e itens por entidades relacionais; JSON guarda snapshots de nome/detalhe dentro do item.
- A fila de escrita JSON simula atomicidade local, enquanto MySQL exigirá transações e controle de disponibilidade no service/repository.

## Configuração e ambiente

Variáveis observadas:

- `PORT` — porta do server, padrão `3000`.
- `JWT_SECRET` — obrigatório forte em produção; há fallback inseguro em desenvolvimento.
- `CORS_ORIGIN` — lista separada por vírgula; padrão `http://localhost:5173`.
- `DATA_FILE` — caminho opcional do JSON de execução.
- `VITE_API_URL` — base da API no client; obrigatório quando `VITE_DATA_SOURCE=api`.
- `VITE_DATA_SOURCE` — `api` ativa dashboard remoto; qualquer outro valor usa mock.

## Gaps de integração prioritários

1. Ligar login real e persistir sessão/token com expiração e logout.
2. Criar client services/tipos para solicitação e administração; não duplicar payloads nos componentes.
3. Implementar POST real na confirmação e recarregar lista/detalhe pelo ID retornado.
4. Conectar ações do painel às decisões, retirada, devolução, materiais, chaves e alertas.
5. Escolher MySQL como fonte única e criar migrations/seeds; retirar a dependência operacional do JSON.
6. Criar observabilidade mínima: request ID, logs estruturados, erros de API mostrados no client e health/readiness do banco.
