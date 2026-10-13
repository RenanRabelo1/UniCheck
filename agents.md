# AGENTS.md — UniCheck

## Objetivo

O UniCheck é um sistema web para controlar empréstimos de materiais e chaves da Secretaria do CCT da Unifor:

```text
React/Vite (client) -> API REST Node/Express (server) -> MySQL
```

O fluxo cobre autenticação, solicitações, análise pelo coordenador, retirada/devolução presencial, disponibilidade e alertas de atraso.

## Fontes de verdade

Antes de alterar regras, nomes ou contratos, consultar nesta ordem:

1. `docs/ESTRUTURA_DO_PROJETO.md`.
2. `controle_emprestimos.sql`.
3. `../MER-CCT-Controle-de-Emprestimos.drawio` e `../DER-CCT-Controle-de-Emprestimos.drawio`.
4. PDFs, requisitos, protótipos e diagramas em `../` e `../diagramas/`.
5. Código e testes existentes.

Se houver divergência, documentar a decisão e não apagar a regra silenciosamente.

## Stack

### Monorepo

- Node.js com npm workspaces; instalar dependências na raiz de `UniCheck/`.
- Não criar outro `package-lock.json` dentro de `client/` ou `server/`.

### Front-end (`client/`)

- React, TypeScript e Vite.
- React Hook Form para formulários.
- Zod para validar respostas e entradas.
- Vitest, Testing Library e jsdom para testes.
- ESLint e Prettier para qualidade.
- `client/src/services/` é o limite de comunicação com a API; não espalhar `fetch` por componentes.
- O cliente pode filtrar opções, mas nunca é a autoridade das regras.
- `VITE_API_URL` define a API; `VITE_DATA_SOURCE=api` habilita dados reais.
- Mocks devem permanecer explícitos e isolados em `*.mock.ts`.

### Back-end (`server/`)

- Node.js, TypeScript e Express.
- `tsx` em desenvolvimento; `tsc` para build; `node dist/server.js` em produção.
- MySQL via `mysql2`; configuração via `dotenv`.
- `cors` e `helmet` para segurança HTTP.
- `bcrypt` para senhas; `jsonwebtoken` para tokens.
- Zod para payloads.
- `swagger-jsdoc` e `swagger-ui-express` para documentação.
- Vitest e Supertest para testes.

## Organização

Cliente:

```text
client/src/components/   # componentes compartilhados
client/src/modules/      # auth, solicitacoes, materiais, chaves, administrativo, dashboard
client/src/routes/       # rotas e proteção por perfil
client/src/services/     # API e integrações
```

Servidor:

```text
server/src/app.ts
server/src/server.ts
server/src/database/     # conexão, migrations e seeds
server/src/middlewares/  # auth, autorização, erros e validações comuns
server/src/modules/      # auth, usuarios, solicitacoes, materiais, chaves, movimentacoes, alertas
server/src/routes/
```

Cada módulo deve separar `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts` e `*.validation.ts`. Controller trata HTTP; service aplica regras e transações; repository executa SQL.

## Regras de domínio

- Professor solicita materiais; aluno solicita chaves.
- Aluno só solicita chave com autorização ativa vinculada ao aluno e a projeto.
- Solicitação pode conter vários itens; cada item é aprovado ou recusado individualmente.
- Recusa exige `motivo_recusa`.
- Retirada exige aceite do termo de responsabilidade.
- Coordenador CCT decide; funcionário/coordenador registra retirada e devolução presencial.
- Retirada registra data/hora real e, para chave, a chave física e o tipo entregue.
- Devolução registra data/hora real e condição.
- Materiais e chaves são inativados, nunca removidos quando houver histórico.
- Item não devolvido até 22:40 gera uma `OCORRENCIA_ATRASO`.
- O servidor valida tudo novamente, mesmo que a interface já tenha filtrado.

## Modelo de dados

O MER possui `USUARIO`, `PROFESSOR`, `ALUNO`, `COORDENADOR_CCT`, `PROJETO`, `AUTORIZACAO`, `SOLICITACAO`, `TERMO_RESPONSABILIDADE`, `MATERIAL`, `SALA`, `CHAVE`, `ITEM_SOLICITADO`, `MOVIMENTACAO` e `OCORRENCIA_ATRASO`.

- Professor, aluno e coordenador são especializações 1:1 de `USUARIO`.
- `ITEM_SOLICITADO` referencia exatamente um `MATERIAL` ou uma `CHAVE`.
- Material individual usa patrimônio; material por quantidade usa estoque.
- `CHAVE.tipo_chave` é `PRIMARIA` ou `SECUNDARIA`.
- Protocolo da solicitação, código da sala e código da chave são únicos; patrimônio também é único quando informado.
- Não alterar PK/FK/enums sem atualizar MER, migrations, validações, services e testes.

## Estados e concorrência

```text
PENDENTE -> APROVADO -> RETIRADO -> DEVOLVIDO
PENDENTE -> RECUSADO
RETIRADO -> alerta de atraso após 22:40
```

Operações que alteram disponibilidade precisam de transação MySQL: aprovação/reserva, retirada, devolução e atualização de estoque. Usar bloqueio (`SELECT ... FOR UPDATE` ou equivalente) para evitar aprovação dupla.

## Configuração

Criar `server/.env.example` sem segredos, contemplando:

```text
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=cct_controle_emprestimos
DATABASE_USER=root
DATABASE_PASSWORD=
JWT_SECRET=troque-por-um-segredo-local
JWT_EXPIRES_IN=1d
```

Nunca commitar `.env`, senhas, tokens, dumps com dados reais ou credenciais de produção.

## Comandos

Executar na raiz de `UniCheck/`:

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
```

`controle_emprestimos.sql` é o schema inicial. Migrations futuras devem ser incrementais e, quando possível, idempotentes.

## Critérios de implementação

- Usar TypeScript estrito; evitar `any` sem justificativa.
- Centralizar enums/status e manter respostas HTTP consistentes.
- Rotas protegidas exigem autenticação e autorização por perfil no servidor.
- Validar datas e horários no servidor; devolução deve ser posterior à retirada.
- Não colocar SQL, autorização ou segredo em componente React.
- Preservar histórico ao inativar.
- Comentários explicam decisões, não código óbvio.

## Verificação e Git

Antes de concluir uma alteração:

1. Conferir `git status` e incluir somente arquivos do escopo.
2. Rodar testes relacionados e `npm test` quando aplicável.
3. Rodar lint, formatação e build do workspace alterado.
4. Em banco, revisar PK/FK, transações, rollback e compatibilidade com o SQL.
5. Em telas, testar os perfis afetados; não declarar validação visual/runtime sem executá-la.
6. Atualizar docs e migrations quando mudar contrato ou regra.

Trabalhar na branch solicitada ou em branch de feature. Usar commits focados e seguir como referência o repositório [iuricode/padroes-de-commits](https://github.com/iuricode/padroes-de-commits).

### Padrão de commits do projeto

Formato preferencial:

```text
<emoji> <tipo>: <descrição curta>
```

Tipos aceitos e uso:

| Tipo | Quando usar |
| --- | --- |
| `feat` | novo recurso ou comportamento |
| `fix` | correção de bug |
| `docs` | documentação, sem alteração de código |
| `test` | criação ou alteração de testes |
| `build` | dependências ou arquivos de build |
| `perf` | melhoria de performance |
| `style` | formatação, lint ou estilo sem mudança funcional |
| `refactor` | reorganização sem mudar comportamento |
| `chore` | configuração, manutenção ou tarefas administrativas |
| `ci` | integração/automação contínua |
| `raw` | dados, parâmetros ou arquivos de configuração |
| `cleanup` | remoção de código desnecessário |
| `remove` | remoção de arquivo, diretório ou funcionalidade obsoleta |

Emojis recomendados:

```text
feat      ✨ :sparkles:
fix       🐛 :bug:
docs      📚 :books:
test      🧪 :test_tube:
build     ➕ :heavy_plus_sign:
refactor  ♻️ :recycle:
chore     🔧 :wrench:
ci        🧱 :bricks:
perf      ⚡ :zap:
cleanup   🧹 :broom:
remove    🗑️ :wastebasket:
```

Regras práticas:

- Primeira linha curta e objetiva, preferencialmente com no máximo quatro palavras na descrição principal.
- Usar o corpo do commit para explicar contexto, impacto e decisões quando a mudança não for óbvia.
- Usar rodapé para referências, por exemplo `Reviewed-by: Nome` ou `Refs #123`.
- Não misturar funcionalidades independentes no mesmo commit.
- O emoji deve representar o tipo de alteração; o tipo textual deve ser compatível com a alteração.

Exemplos para este projeto:

```text
✨ feat: fluxo de nova solicitação
🐛 fix: impede aprovação duplicada de material
📚 docs: atualiza instruções do banco
🧪 test: cobre devolução de chave
➕ build: adiciona dependência do MySQL
♻️ refactor: separa regra de disponibilidade
🔧 chore: ajusta configuração local
```

Fluxo Git seguro:

1. Conferir branch, remoto, `git status` e divergência.
2. Criar/switchar para a branch solicitada antes de editar ou commitar.
3. Validar a alteração e executar testes/lint/build aplicáveis.
4. Fazer `git add` somente dos arquivos da tarefa.
5. Criar um commit seguindo o formato acima.
6. Conferir o hash criado e publicar com `git push` apenas quando solicitado.
7. Confirmar o hash remoto e o estado limpo da branch antes de afirmar que foi publicado.

Não usar `reset --hard`, `checkout --` ou remoções para resolver conflitos sem autorização explícita.
