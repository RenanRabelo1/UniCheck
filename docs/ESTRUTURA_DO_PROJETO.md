# Estrutura do Projeto UniCheck

Este documento descreve o checkout atual do UniCheck e separa o que já funciona no protótipo do que pertence ao roadmap de integração e MySQL.

## Runtime atual do protótipo

```text
React/Vite (telas demonstrativas e mocks) -> API REST Node.js -> JSON
                                                        server/data/db.json
```

- O client possui login real e consulta de Minhas solicitações/Detalhes quando `VITE_DATA_SOURCE=api`. O token é guardado em sessionStorage e as consultas são restritas ao usuário. Criação de pedidos e administração ainda são demonstrativas. Consulte `GUIA_DUAS_TELAS.md`.
- O server é uma API Express em TypeScript. Seus repositories ativos usam `server/src/database/jsonDatabase.ts`, que lê e grava `server/data/db.json` a partir do seed versionado `server/data/db.seed.json`.
- `CORS_ORIGIN` é a variável de ambiente usada pelo servidor para definir origens autorizadas. `DATA_FILE` é opcional e permite trocar o arquivo JSON em testes ou uso local.

## Roadmap de arquitetura

```text
React/Vite -> API REST Node.js -> MySQL
```

Esta é a arquitetura planejada, não a persistência atual. O projeto já inclui `mysql2` e `controle_emprestimos.sql` como referência do modelo futuro, mas não há conexão MySQL, migrations executáveis nem repositories SQL ativos. O script `migrate` referencia `src/database/runMigrations.ts`, arquivo que ainda não existe; portanto, não deve ser usado como instrução de setup atual.

## Estrutura raiz

```text
UniCheck/
├── client/                     # React, Vite e telas do protótipo
├── server/                     # API Express e persistência JSON atual
├── docs/                       # documentação técnica
├── controle_emprestimos.sql    # modelo MySQL planejado
├── agents.md                   # guia operacional
└── README.md                   # apresentação resumida
```

## Front-end atual

```text
client/src/
├── components/                 # telas e componentes compartilhados
├── modules/                    # módulos visuais e dados mockados
├── services/                   # fronteira de comunicação HTTP
├── App.tsx                     # composição, navegação e sessão demonstrativa
└── styles.css                  # estilos globais
```

`client/src/services/api.ts` concentra o suporte HTTP existente e usa `VITE_API_URL`. O dashboard pode escolher API quando `VITE_DATA_SOURCE=api`, e as duas telas de consulta usam API autenticada. A integração das mutações e dos módulos administrativos permanece pendente.

## Back-end atual

```text
server/src/
├── app.ts                      # Express, CORS, rotas e erros
├── server.ts                   # entrada HTTP e job de atrasos
├── config.ts                   # PORT, CORS_ORIGIN, DATA_FILE e JWT
├── database/
│   ├── jsonDatabase.ts          # leitura e escrita do JSON
│   └── types.ts
├── middlewares/                # autenticação, validação e erros
├── modules/                    # regras por domínio
├── routes/                     # registro das rotas
└── jobs/                       # processamento de atrasos
```

Os módulos seguem a divisão de responsabilidades entre rotas, controllers, services, repositories e validações. No estado atual, essa divisão opera sobre JSON; a substituição por MySQL exige decisão de contrato, migrations, repositories SQL, seed e testes de integração antes de ser considerada concluída.

## Regras de domínio planejadas

As regras abaixo são a referência para a futura integração do sistema. Elas não comprovam que todas já estejam integradas às telas demonstrativas.

- Professor solicita materiais; aluno autorizado solicita chaves vinculadas a projeto e professor.
- Coordenador aprova ou recusa cada item, e a recusa exige motivo.
- Retirada exige aceite do termo; retirada e devolução presenciais registram responsável e horários reais.
- Chaves registram a unidade física entregue e seu tipo, primária ou secundária.
- Materiais e chaves são inativados, não excluídos quando há histórico.
- Itens não devolvidos até 22:40 devem gerar ocorrência de atraso.

## Configuração e comandos atuais

Use `server/.env.example` e `client/.env.example` sem versionar arquivos `.env` ou segredos. O servidor lê `PORT`, `CORS_ORIGIN`, `DATA_FILE` e `JWT_SECRET`; o client usa `VITE_DATA_SOURCE` e `VITE_API_URL`.

Na raiz de `UniCheck/`:

```powershell
npm.cmd run dev:client
npm.cmd run dev:server
npm.cmd run test
npm.cmd run lint
npm.cmd run format
npm.cmd run build --workspace=@unicheck/client
npm.cmd run build --workspace=@unicheck/server
npm.cmd run db:reset --workspace=@unicheck/server
```

`db:reset` restaura o JSON local a partir de `db.seed.json`. Não execute `migrate` como setup do protótipo enquanto `runMigrations.ts` não existir e a migração MySQL não for implementada.

## Próximos marcos

1. Aprovar o contrato de API e integrar autenticação, sessão e telas ao servidor.
2. Planejar a migração MySQL com migrations, repositories, seed e testes de integração.
3. Validar concorrência, autorização e persistência antes de tratar o sistema como pronto para ambiente multiusuário ou produção.
