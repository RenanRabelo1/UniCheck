# Tela 11 — Devolução presencial

## Objetivo e elementos obrigatórios

Receber visualmente itens em posse, registrar conferência e encerrar custódia demonstrativa. Incluir busca de itens em posse, dossiê do solicitante, checklist por item, registro de condição, termo de homologação, data/hora e ação **Confirmar Devolução e Baixar Custódia**. A devolução não pode preceder a retirada. Usar somente mocks explícitos.

## Arquivos que pode criar ou alterar

- `client/src/modules/admin/return-operations/**`

## Documentos mínimos que deve ler

- `agents.md`
- Este `README.md`

## Critérios de aceite

- A tela é autocontida no diretório permitido, com componente, tipos, mocks e CSS co-localizados quando necessários.
- Cada item permite checklist e condição local de devolução.
- Confirmação visual exige homologação e data/hora posterior à retirada mockada.
- O resultado visual exibe baixa demonstrativa e callback tipado de retorno.
- Nenhum arquivo fora do diretório permitido é alterado.
- `npm.cmd run build --workspace=@unicheck/client` passa no worktree.

## Proibições de escopo

- Não alterar backend, API, autenticação, persistência, contratos ou banco.
- Não editar `App.tsx`, `app/`, navegação, estilos globais ou componentes compartilhados.
- Não implementar chamadas HTTP, baixa real, e-mail, PDF, CSV ou impressão.
- Não representar devolução demonstrativa como persistida.
