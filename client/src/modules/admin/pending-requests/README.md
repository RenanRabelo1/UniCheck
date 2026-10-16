# Tela 08 — Solicitações pendentes

## Objetivo e elementos obrigatórios

Permitir que a coordenação localize solicitações que aguardam parecer e inicie a análise visual. Incluir navegação administrativa visual, busca, período (hoje, últimos 7 dias, mês e personalizado), filtros, limpeza, lista paginada, ação **Analisar solicitação** e estados de carregando, vazio, filtrado e erro. Usar somente mocks explícitos.

## Arquivos que pode criar ou alterar

- `client/src/modules/admin/pending-requests/**`

## Documentos mínimos que deve ler

- `agents.md`
- Este `README.md`

## Critérios de aceite

- A tela é autocontida no diretório permitido, com componente, tipos, mocks e CSS co-localizados quando necessários.
- Todos os estados e controles obrigatórios são demonstráveis sem API.
- A ação de análise emite somente um callback tipado com o identificador selecionado.
- Nenhum arquivo fora do diretório permitido é alterado.
- `npm.cmd run build --workspace=@unicheck/client` passa no worktree.

## Proibições de escopo

- Não alterar backend, API, autenticação, persistência, contratos ou banco.
- Não editar `App.tsx`, `app/`, navegação, estilos globais ou componentes compartilhados.
- Não implementar chamadas HTTP, geração de arquivo, e-mail, PDF, CSV ou impressão.
- Não representar ação demonstrativa como persistida.
