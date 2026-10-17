# Tela 16 — Histórico de movimentações

## Objetivo e elementos obrigatórios

Oferecer auditoria visual consultável de solicitações, retiradas, devoluções, atrasos e administração. Incluir filtros parametrizados, períodos rápidos, aplicação e limpeza de filtros, lista de ocorrências, abertura de dossiê e controles de impressão/exportação apresentados como visuais. Histórico não é apagado; remoções são representadas como inativação. Usar somente mocks explícitos.

## Arquivos que pode criar ou alterar

- `client/src/modules/admin/movement-history/**`

## Documentos mínimos que deve ler

- `agents.md`
- Este `README.md`

## Critérios de aceite

- A tela é autocontida no diretório permitido, com componente, tipos, mocks e CSS co-localizados quando necessários.
- Períodos rápidos, filtros, resultado e dossiê funcionam em estado visual local.
- Impressão e exportação são controles explicitamente demonstrativos.
- Nenhum arquivo fora do diretório permitido é alterado.
- `npm.cmd run build --workspace=@unicheck/client` passa no worktree.

## Proibições de escopo

- Não alterar backend, API, autenticação, persistência, contratos ou banco.
- Não editar `App.tsx`, `app/`, navegação, estilos globais ou componentes compartilhados.
- Não implementar chamadas HTTP, exportação real, PDF, CSV ou impressão.
- Não representar histórico demonstrativo como dado persistido.
