# Tela 15 — Alunos autorizados e projetos

## Objetivo e elementos obrigatórios

Manter visualmente projetos ativos e autorizações de alunos vinculadas a eles. Incluir totais de alunos e projetos, cadastro de projeto, nova autorização, filtros, histórico, edição, inativação e reativação. Preservar a regra visual de que solicitação de chave exige autorização ativa, projeto ativo e professor responsável ativo. Usar somente mocks explícitos.

## Arquivos que pode criar ou alterar

- `client/src/modules/admin/authorizations-projects/**`

## Documentos mínimos que deve ler

- `agents.md`
- Este `README.md`

## Critérios de aceite

- A tela é autocontida no diretório permitido, com componente, tipos, mocks e CSS co-localizados quando necessários.
- Totais, filtros, histórico e estados de autorização são demonstráveis localmente.
- Inativação e reativação são ações visuais, sem persistência ou contrato novo.
- Nenhum arquivo fora do diretório permitido é alterado.
- `npm.cmd run build --workspace=@unicheck/client` passa no worktree.

## Proibições de escopo

- Não alterar backend, API, autenticação, persistência, contratos ou banco.
- Não editar `App.tsx`, `app/`, navegação, estilos globais ou componentes compartilhados.
- Não implementar chamadas HTTP, geração de arquivo, e-mail, PDF, CSV ou impressão.
- Não representar ação demonstrativa como persistida.
