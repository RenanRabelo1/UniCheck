# Tela 09 — Análise da solicitação

## Objetivo e elementos obrigatórios

Exibir uma solicitação e permitir parecer visual individual por item. Incluir retorno para pendências, identificação do solicitante, itens e disponibilidade, ações **Aprovar** e **Recusar** por item, motivo obrigatório de recusa, resumo do parecer e ação **Concluir Análise e Emitir Parecer Oficial**. Uma solicitação pode ter itens aprovados e recusados. Usar somente mocks explícitos.

## Arquivos que pode criar ou alterar

- `client/src/modules/admin/request-analysis/**`

## Documentos mínimos que deve ler

- `agents.md`
- Este `README.md`

## Critérios de aceite

- A tela é autocontida no diretório permitido, com componente, tipos, mocks e CSS co-localizados quando necessários.
- Recusar um item exige motivo visível antes de concluir o parecer visual.
- Aprovação, recusa e conclusão atualizam apenas estado local demonstrativo.
- A tela expõe callbacks tipados para voltar às pendências e concluir a análise.
- Nenhum arquivo fora do diretório permitido é alterado.
- `npm.cmd run build --workspace=@unicheck/client` passa no worktree.

## Proibições de escopo

- Não alterar backend, API, autenticação, persistência, contratos ou banco.
- Não editar `App.tsx`, `app/`, navegação, estilos globais ou componentes compartilhados.
- Não implementar chamadas HTTP, emissão oficial real, e-mail, PDF, CSV ou impressão.
- Não representar parecer demonstrativo como persistido.
