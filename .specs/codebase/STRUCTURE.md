# UniCheck — Estrutura real do código

## Árvore resumida verificada

```text
UniCheck/
├── package.json                 # workspace e comandos agregadores
├── package-lock.json
├── agents.md
├── controle_emprestimos.sql     # schema inicial/documental
├── docs/ESTRUTURA_DO_PROJETO.md
├── client/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx             # entry point React
│       ├── App.tsx              # login, navegação e composição principal
│       ├── components/          # dashboards e telas do protótipo
│       ├── modules/dashboard/   # tipos, mock, service e hook
│       ├── services/api.ts      # getJson e ApiError
│       ├── styles.css
│       └── App.test.tsx
└── server/
    ├── package.json
    ├── data/db.seed.json        # seed versionado
    └── src/
        ├── server.ts            # entry point HTTP + job de atrasos
        ├── app.ts              # Express, helmet, CORS, JSON, rotas e erros
        ├── config.ts
        ├── routes/index.ts
        ├── database/jsonDatabase.ts, types.ts
        ├── middlewares/
        ├── jobs/atrasos.job.ts
        ├── utils/
        ├── testing/testApp.ts
        └── modules/
            ├── auth/
            ├── usuarios/
            ├── dashboard/
            ├── solicitacoes/
            ├── materiais/
            ├── chaves/
            ├── movimentacoes/
            └── alertas/
```

## Entry points e fluxo

### Client

`client/index.html` carrega `client/src/main.tsx`. `main.tsx` renderiza `App` em `#root` e importa `styles.css`. `App.tsx` mantém login, papel atual, tela ativa e seleção de solicitação em `useState`; não existe roteador instalado.

Telas/componentes presentes: `UserDashboard`, `StudentDashboard`, `NewRequestScreen`, `RequestConfirmationScreen`, `MyRequestsScreen`, `RequestDetailsScreen` e `AdminDashboard`. Dados de dashboard e listagem são majoritariamente mocks explícitos.

### Server

`server/src/server.ts` chama `createApp().listen(...)` e inicia `startAtrasosJob()`. `app.ts` configura `helmet`, CORS, parser JSON, `routes`, 404 e handler de erros. `routes/index.ts` expõe:

```text
GET  /health
      /auth
      /dashboard
      /solicitacoes
      /admin/solicitacoes
      /movimentacoes
      /alertas
      /admin/materiais
      /admin/salas
      /admin/chaves
```

Os módulos do servidor já seguem, em grande parte, a separação route/controller/service/repository/validation. `usuarios` possui mapper/repository, sem routes/controller próprios.

## Responsabilidades observadas

- `middlewares/authenticate.ts`: autenticação por Bearer token e usuário do repositório.
- `middlewares/validate.ts`: validação de payloads com schemas.
- `modules/solicitacoes`: criação, disponibilidade, regras, status, operações administrativas e mapeamento.
- `modules/movimentacoes`: retirada/devolução e atualização de alertas.
- `modules/alertas` + `jobs/atrasos.job.ts`: criação e resolução de ocorrências de atraso.
- `modules/dashboard`: agregação e formatação de dados para painéis.
- `modules/materiais` e `modules/chaves`: cadastro/ativação e disponibilidade em JSON.

## Gargalos estruturais identificados

### Fronteira de dados inconsistente

O contrato declarado é MySQL, porém todos os repositories usam `jsonDatabase`. Isso impede concorrência real, transações SQL e implantação coerente. O arquivo SQL e o código podem divergir sem verificação automática.

### Bootstrap e navegação acoplados

`App.tsx` concentra autenticação demonstrativa, autorização visual, roteamento manual, dados de sessão e transformação de solicitação. Isso dificulta adicionar telas e testar permissões isoladamente.

### Contrato client/API incompleto

`client/src/services/api.ts` só implementa `getJson`; não há client de login, criação/consulta de solicitações, retirada, devolução ou administração. A interface, portanto, não exercita a API real mesmo com o backend disponível.

### Configuração sem fonte única

Há nomes e valores que divergem entre `agents.md`, `.env.example` e `config.ts` (`CLIENT_ORIGIN` versus `CORS_ORIGIN`, MySQL versus `DATA_FILE`, expiração JWT documentada versus fixa em código).

### Build e migração não são verificáveis pela raiz

A raiz não tem build agregado. O script de migração referencia arquivo ausente. Um onboarding novo pode parecer configurado, mas falha ao executar o comando documentado.

## Organização recomendada para a próxima etapa

```text
client/src/
├── app/                 # sessão, providers e rotas
├── modules/
│   ├── auth/
│   ├── solicitacoes/
│   ├── materiais/
│   ├── chaves/
│   └── administrativo/
├── components/ui/       # primitives compartilhadas
└── services/            # cliente HTTP e contratos

server/src/
├── config/
├── database/             # conexão, migrations e seeds MySQL
├── middlewares/
├── modules/
├── routes/
└── shared/               # erros, tipos e utilitários
```

Essa reorganização deve ser incremental: primeiro definir contrato de autenticação e persistência, depois extrair navegação e serviços do `App.tsx`, sem misturar a migração de banco com alterações visuais.
