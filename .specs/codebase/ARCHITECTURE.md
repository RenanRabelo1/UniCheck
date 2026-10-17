# UniCheck — Brownfield Architecture Map

## Escopo e evidência

Este documento descreve a implementação encontrada no branch `Unicheck-1.0.3`, não apenas a arquitetura inicialmente planejada em `docs/ESTRUTURA_DO_PROJETO.md`. A aplicação é um monorepo npm com workspaces `client` e `server`.

## Visão real de execução

```text
Browser
  └─ Vite/React client (porta 5173)
       ├─ App.tsx: autenticação demonstrativa e máquina de telas local
       ├─ componentes de dashboard e fluxos de solicitação
       └─ modules/dashboard + services/api.ts (única integração API ativa)

Node/Express server (porta 3000)
  ├─ Helmet, CORS, JSON parser
  ├─ routes/index.ts
  ├─ authenticate/requireRole + validação Zod
  ├─ módulos por domínio (controller → service → repository → JSON database)
  └─ job de atrasos a cada minuto
```

O front só chama o back-end quando `VITE_DATA_SOURCE=api` e quando o fluxo usa `dashboardService`. Login, nova solicitação, confirmação, minhas solicitações, detalhes e painel administrativo atualmente usam estado local e mocks; não existe cliente de API para esses fluxos.

## Estrutura do cliente

- `client/src/App.tsx`: componente raiz monolítico; guarda perfil, sessão, tela ativa, solicitação em revisão e solicitação selecionada. A navegação é uma união `AppView`, sem React Router.
- `client/src/components/`: telas visuais implementadas: `UserDashboard`, `StudentDashboard`, `NewRequestScreen`, `RequestConfirmationScreen`, `MyRequestsScreen`, `RequestDetailsScreen` e `AdminDashboard`.
- `client/src/modules/dashboard/`: contrato Zod, mock, serviço e hook para o dashboard professor/aluno.
- `client/src/services/api.ts`: wrapper `getJson` somente para GET; lê `VITE_API_URL` e token de `sessionStorage`.
- `client/src/modules/auth`, `solicitacoes`, `materiais`, `chaves`, `administrativo` e `routes`: apenas `.gitkeep`; não são módulos funcionais.

### Fluxo visual atual

1. Login local aceita qualquer identificador/senha que passe as validações mínimas.
2. Perfil professor ou aluno abre seu dashboard; coordenador abre `AdminDashboard`.
3. Dashboard abre nova solicitação, revisão/confirmação, lista mockada e detalhes mockados.
4. `onConfirm` da confirmação resolve uma Promise, mas não cria uma solicitação no servidor.
5. A lista e os detalhes derivam de `MyRequestsScreen.mock.ts` e não refletem o banco.

## Estrutura do servidor

`server/src/app.ts` monta middleware global e registra `routes/index.ts`. Cada domínio adota parcialmente a convenção controller/service/repository/validation:

- `auth`: login, bcrypt e JWT.
- `usuarios`: repositório e mappers usados pela autenticação/dashboard; não há rotas administrativas de usuários/autorização.
- `dashboard`: painel restrito a professor/aluno, com formato próprio para o front.
- `solicitacoes`: opções, criação, listagem e detalhe do próprio usuário; módulo admin lista fila e decide item.
- `materiais`: listagem/cadastro/atualização, rotas admin.
- `chaves`: salas e chaves, cadastro/atualização, rotas admin.
- `movimentacoes`: retirada, devolução e histórico, restrito a funcionário/coordenador.
- `alertas`: listagem e verificação manual, com job periódico.

O servidor é iniciado em `server/src/server.ts`, registra `startAtrasosJob()` e escuta `config.port` (3000 por padrão).

## Persistência e consistência

Apesar da documentação e do SQL declararem MySQL, o código em execução usa `server/src/database/jsonDatabase.ts`. Na primeira chamada, `db.seed.json` é copiado para `db.json`; alterações são serializadas por uma fila e gravadas via arquivo temporário + rename. Isso simula transação no processo, mas não oferece concorrência, locks ou persistência multi-instância.

`controle_emprestimos.sql` define o modelo relacional esperado: `usuario`, `professor`, `aluno`, `coordenador_cct`, `projeto`, `autorizacao`, `solicitacao`, `termo_responsabilidade`, `material`, `sala`, `chave`, `item_solicitado`, `movimentacao` e `ocorrencia_atraso`, além de triggers/evento. O schema SQL não é consumido pelos repositories atuais.

## Máquina de estados de domínio

O servidor centraliza os status em `solicitacao.status.ts` e aplica regras em `solicitacao.service.ts`, `solicitacao.admin.service.ts` e `movimentacao.service.ts`:

```text
PENDENTE → APROVADO/RESERVADO → RETIRADO → DEVOLVIDO
PENDENTE → RECUSADO
RETIRADO → ATRASADO → DEVOLVIDO
```

Professor só solicita materiais; aluno autorizado só solicita chaves. Coordenação decide itens; funcionário/coordenação registra retirada/devolução. O cliente atual não representa essa máquina com dados da API.

## Fronteiras e riscos arquiteturais

- Autenticação real existe no server, mas o client não usa `/auth/login`.
- Há contratos duplicados: tipos JSON do servidor, mocks de telas e tipos do dashboard não compartilham um pacote/geração de contrato.
- O front mistura telas e dados de demonstração no componente raiz; a pasta `modules` planejada não organiza os fluxos implementados.
- O painel administrativo visual existe, mas suas ações apenas disparam callbacks opcionais e nenhum callback é conectado em `App.tsx`.
- Os endpoints de materiais, salas, chaves, movimentações e alertas não possuem telas/client services correspondentes.
- CORS, JWT e `VITE_API_URL` estão preparados, porém o fluxo padrão continua mockado.

## Direção de evolução recomendada

1. Definir contratos de API compartilhados e um `apiClient` com GET/POST/PATCH, token e tratamento de erro.
2. Implementar sessão real em `auth`, protected routes e autorização por perfil.
3. Mover cada tela para módulos de domínio (`solicitacoes`, `administrativo`, etc.) e remover a máquina de navegação monolítica de `App.tsx`.
4. Trocar repositories JSON por MySQL usando o schema validado, migrations/seeds e transações reais.
5. Conectar cada ação administrativa aos endpoints e testar os fluxos ponta a ponta.
