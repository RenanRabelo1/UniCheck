# Tela 12 — Alertas de atraso

## Objetivo e elementos obrigatórios

Concentrar visualmente itens não devolvidos no prazo e orientar regularização. Incluir cartões-resumo, filtros por período, tipo e vínculo, limpeza de filtros, leitor de código, ação de registrar devolução, exportação do termo e disparo de lembrete coletivo como controles visuais. Atraso corresponde a item não devolvido até 22:40. Usar somente mocks explícitos.

## Arquivos que pode criar ou alterar

- `client/src/modules/admin/overdue-alerts/**`

## Documentos mínimos que deve ler

- `agents.md`
- Este `README.md`

## Critérios de aceite

- A tela é autocontida no diretório permitido, com componente, tipos, mocks e CSS co-localizados quando necessários.
- Filtros, cartões e leitura de código possuem estado visual local.
- Controles de devolução, exportação e lembrete são explicitamente marcados como demonstrativos.
- Nenhum arquivo fora do diretório permitido é alterado.
- `npm.cmd run build --workspace=@unicheck/client` passa no worktree.

## Proibições de escopo

- Não alterar backend, API, autenticação, persistência, contratos ou banco.
- Não editar `App.tsx`, `app/`, navegação, estilos globais ou componentes compartilhados.
- Não implementar chamadas HTTP, e-mail, PDF, CSV, impressão ou leitura física de código.
- Não representar alertas ou disparos demonstrativos como funcionais.
