# Convenções do codebase

## Organização observada

- Monorepo npm com workspaces `client/` e `server/`.
- Front-end em `client/src/components/`, com telas nomeadas em PascalCase e arquivos `.tsx`/`.css` pareados.
- Serviços do front-end em `client/src/services/`; há diretórios reservados para `modules/` e `routes/`, mas a navegação atual está concentrada em `App.tsx`.
- Back-end organizado por domínio em `server/src/modules/<dominio>/`, normalmente com `routes`, `controller`, `service`, `repository`, `validation` e, quando necessário, `mapper`, `test` e arquivos de regra/status.
- Infra compartilhada em `server/src/database`, `middlewares`, `routes`, `utils` e `jobs`.

## Nomenclatura

- React: componentes, tipos e telas em PascalCase (`AdminDashboard`, `RequestDetailsScreen`); funções/variáveis em camelCase.
- Backend: arquivos em kebab/snake semântico por domínio e sufixo de responsabilidade (`solicitacao.service.ts`, `chave.repository.ts`).
- Domínio de negócio está em português (`solicitacoes`, `movimentacoes`, `materiais`, `alertas`); nomes técnicos de framework ficam em inglês.
- Status de negócio aparecem como valores em português e devem continuar centralizados nos arquivos de status/regras; evitar strings duplicadas na UI.
- Tipos compartilhados ainda são locais aos módulos; não há pacote compartilhado de contratos entre client e server.

## Padrões de implementação

- Controllers devem adaptar HTTP para services; services concentram regras; repositories acessam persistência; validations usam Zod.
- Rotas são montadas centralmente em `server/src/routes/index.ts`.
- Erros HTTP usam `httpError`, `validate` e `errorHandler` no servidor.
- O front-end usa estado local e callbacks de navegação em `App.tsx`; novos fluxos devem preferir extrair páginas/rotas antes de aumentar esse arquivo.
- A API client usa `getJson<T>` e `VITE_API_URL`; atualmente não há cliente completo para POST/PUT/DELETE nem gerenciamento de sessão/token no front-end.
- CSS é co-localizado para telas maiores e `styles.css` mantém estilos globais.

## Git e qualidade

- Branch de trabalho observada: `Unicheck-1.0.3`; commits seguem o padrão documentado em `agents.md`/repositório `iuricode/padroes-de-commits`.
- Antes de integrar: executar `npm.cmd run lint`, `npm.cmd run test`, builds dos workspaces e `git diff --check`.
- Não versionar `server/data/db.json`, dependências ou artefatos de build.

## Regras para mudanças novas

1. Manter uma responsabilidade por arquivo e por módulo.
2. Adicionar teste junto da regra crítica, não somente da tela.
3. Não duplicar status, permissões ou disponibilidade no client; a API é a autoridade.
4. Registrar decisões de arquitetura em `.specs/` e atualizar `agents.md` quando o fluxo operacional mudar.
